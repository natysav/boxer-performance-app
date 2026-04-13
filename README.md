-- ============================================================
-- BOXING PERFORMANCE PROFILE - DATABASE SCHEMA
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Go to: SQL Editor > New Query > paste this > Run
-- ============================================================

-- 1. PROFILES TABLE
-- Stores user info and role (coach or boxer)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('coach', 'boxer')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Coaches can see their boxers' profiles
create policy "Coaches can see linked boxer profiles"
  on public.profiles for select
  using (
    id in (
      select boxer_id from public.assessments
      where coach_id = auth.uid()
    )
  );

-- 2. ASSESSMENTS TABLE
-- Each assessment links a coach to a boxer with a date and status
create table public.assessments (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references public.profiles(id) not null,
  boxer_id uuid references public.profiles(id),
  boxer_email text not null,
  status text not null default 'invited' check (status in ('invited', 'boxer_done', 'complete')),
  invite_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now(),
  boxer_completed_at timestamptz,
  coach_completed_at timestamptz,
  notes text default ''
);

alter table public.assessments enable row level security;

create policy "Coaches can see own assessments"
  on public.assessments for select
  using (coach_id = auth.uid());

create policy "Boxers can see own assessments"
  on public.assessments for select
  using (boxer_id = auth.uid());

create policy "Coaches can create assessments"
  on public.assessments for insert
  with check (coach_id = auth.uid());

create policy "Coaches can update own assessments"
  on public.assessments for update
  using (coach_id = auth.uid());

create policy "Boxers can update own assessments"
  on public.assessments for update
  using (boxer_id = auth.uid());

-- Allow token-based lookup for invite acceptance
create policy "Anyone can find assessment by invite token"
  on public.assessments for select
  using (invite_token is not null);

-- 3. RATINGS TABLE
-- Stores individual skill ratings per assessment
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  skill text not null,
  boxer_score int check (boxer_score >= 0 and boxer_score <= 5) default 0,
  coach_score int check (coach_score >= 0 and coach_score <= 5) default 0
);

alter table public.ratings enable row level security;

create policy "Users can see ratings for their assessments"
  on public.ratings for select
  using (
    assessment_id in (
      select id from public.assessments
      where coach_id = auth.uid() or boxer_id = auth.uid()
    )
  );

create policy "Users can insert ratings for their assessments"
  on public.ratings for insert
  with check (
    assessment_id in (
      select id from public.assessments
      where coach_id = auth.uid() or boxer_id = auth.uid()
    )
  );

create policy "Users can update ratings for their assessments"
  on public.ratings for update
  using (
    assessment_id in (
      select id from public.assessments
      where coach_id = auth.uid() or boxer_id = auth.uid()
    )
  );

-- 4. INDEX for faster lookups
create index idx_assessments_coach on public.assessments(coach_id);
create index idx_assessments_boxer on public.assessments(boxer_id);
create index idx_assessments_token on public.assessments(invite_token);
create index idx_ratings_assessment on public.ratings(assessment_id);

-- 5. FUNCTION: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'boxer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. FUNCTION: Link boxer to assessment when they accept invite
create or replace function public.accept_invite(token text, user_id uuid)
returns uuid as $$
declare
  assessment_record public.assessments%rowtype;
begin
  select * into assessment_record
  from public.assessments
  where invite_token = token and status = 'invited';

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  update public.assessments
  set boxer_id = user_id, status = 'invited'
  where id = assessment_record.id;

  return assessment_record.id;
end;
$$ language plpgsql security definer;
