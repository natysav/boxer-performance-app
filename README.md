# Boxing Performance Profile

A two-way skills assessment platform where boxing coaches and their boxers rate skills independently, then compare results on an overlay radar chart.

## How It Works

### The Flow

1. **Coach signs up** — creates an account with the "Coach" role
2. **Coach creates an assessment** — enters the boxer's email, gets a unique shareable link
3. **Coach sends the link** — shares it via text, WhatsApp, email, or any messaging app
4. **Boxer clicks the link** — signs up (if needed) with the "Boxer" role, gets linked to the assessment
5. **Boxer rates themselves** — scores each of 21 skills from 1 to 5, then submits
6. **Coach sees the update** — dashboard shows the assessment status changed to "Boxer Complete"
7. **Coach does their assessment** — rates the same boxer on the same 21 skills
8. **Both profiles overlay** — a radar chart shows coach vs. boxer ratings side by side
9. **Progress tracking** — each assessment is date-stamped and stored for historical comparison

### Skills Assessed (21 total)

| Category   | Skills                                                        |
|------------|---------------------------------------------------------------|
| Offense    | Fast Jab, Good Uppercut, Powerful Straights, Powerful Hook, Combinations |
| Defense    | Block Punches, Slip Punches, Counters, Feints                 |
| Ring Craft | Footwork, Switching, Work Inside, Change Tempo, Control the Ring |
| Physical   | Fitness, Strength, Flexibility, Stamina, Reactions            |
| Mental     | Competitive, Determined, Confidence                           |

### Assessment Statuses

- **Awaiting Boxer** (`invited`) — link sent, waiting for boxer to complete self-assessment
- **Boxer Complete** (`boxer_done`) — boxer submitted, coach can now do their assessment
- **Complete** (`complete`) — both sides done, radar chart shows the overlay

## Tech Stack

- **Frontend**: React 18 + Vite (SPA with client-side routing via React Router)
- **Backend/Database**: [Supabase](https://supabase.com) (PostgreSQL + Auth + Row Level Security)
- **Hosting**: [Vercel](https://vercel.com) (static deployment with SPA rewrites)
- **Styling**: Custom CSS with dark theme, Barlow + Bebas Neue fonts
- **Visualization**: HTML5 Canvas radar chart

## Project Structure

```
├── index.html              # Vite HTML entry point
├── vite.config.js          # Vite build configuration
├── vercel.json             # Vercel SPA rewrite rules
├── package.json            # Dependencies and scripts
├── schema.sql              # Supabase database schema (run in SQL Editor)
├── .env.example            # Environment variable template
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Router and session management
    ├── styles.css          # Global styles (dark theme)
    ├── lib/
    │   ├── supabase.js     # Supabase client initialization
    │   └── skills.js       # Skill categories and names
    ├── components/
    │   └── RadarChart.jsx  # Canvas-based radar/spider chart
    └── pages/
        ├── AuthPage.jsx    # Sign up / log in
        ├── Dashboard.jsx   # Assessment list + invite modal
        ├── AssessmentPage.jsx  # Skill rating UI + radar chart
        └── AcceptInvite.jsx    # Invite link handler
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor > New Query**
3. Paste the contents of `schema.sql` and click **Run**
4. Go to **Settings > API** and copy your **Project URL** and **anon public key**

### 2. Local Development

```bash
# Clone and install
git clone <your-repo-url>
cd boxer-performance-app
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start dev server
npm run dev
```

### 3. Deploy to Vercel

1. Push your repo to GitHub
2. Import it at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite and applies the SPA rewrites from `vercel.json`

## Database Schema

Three tables with Row Level Security:

- **`profiles`** — user info (id, email, name, role). Auto-created on signup via trigger.
- **`assessments`** — links coach to boxer with status tracking and unique invite tokens.
- **`ratings`** — individual skill scores (boxer_score + coach_score per skill per assessment).

See `schema.sql` for the full schema including RLS policies, indexes, and database functions.
