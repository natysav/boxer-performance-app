# Boxing Performance Profile — Setup Guide

A web app where coaches send assessment invites to boxers. The boxer rates themselves, the coach then rates them, and both profiles overlay on a radar chart. All data is stored and can be accessed later to track progress.

---

## What You Need (all free)

| Service | What it does | Free tier |
|---------|-------------|-----------|
| **Supabase** | Database + user accounts | 500MB DB, 50K users |
| **Vercel** | Hosts the website | Unlimited for personal |
| **GitHub** | Stores the code | Free |

**Total cost: $0**

---

## Step-by-Step Setup (30 minutes)

### STEP 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign up with GitHub (easiest)
3. Click **New Project**
4. Name it `boxing-profile` (or anything you like)
5. Set a database password — **save this somewhere**
6. Choose the region closest to you (e.g., Sydney for Australia)
7. Click **Create new project** and wait ~2 minutes

### STEP 2: Set Up the Database

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project
4. Copy the ENTIRE contents and paste it into the SQL editor
5. Click **Run** (the blue button)
6. You should see "Success. No rows returned" — that's correct!

### STEP 3: Configure Supabase Auth

1. In the left sidebar, click **Authentication**
2. Click **Providers** (under Configuration)
3. Make sure **Email** is enabled (it should be by default)
4. **IMPORTANT**: Click **Email Templates** and under "Confirm signup", change the `{{ .ConfirmationURL }}` to:
   ```
   {{ .SiteURL }}/auth?confirmed=true
   ```
   (This ensures users land back on your app after confirming)

5. Under **URL Configuration** (in Auth settings), set:
   - **Site URL**: `http://localhost:5173` (change this to your Vercel URL later)
   - **Redirect URLs**: Add `http://localhost:5173/*`

### STEP 4: Get Your Supabase Keys

1. In the left sidebar, click **Settings** (the gear icon at the bottom)
2. Click **API** (under Configuration)
3. You'll see two values you need:
   - **Project URL** — looks like `https://abcdef.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`
4. Keep this page open — you'll need these in the next step

### STEP 5: Set Up the Code Locally

You need **Node.js** installed. If you don't have it, download it from [nodejs.org](https://nodejs.org) (LTS version).

Open your terminal and run:

```bash
# 1. Navigate to the project folder
cd boxing-profile-app

# 2. Create your .env file
cp .env.example .env

# 3. Open .env and paste your Supabase values:
#    VITE_SUPABASE_URL=https://your-project-id.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 4. Install dependencies
npm install

# 5. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser — you should see the login page!

### STEP 6: Test It Locally

1. **Create a Coach account**: Click "Create account", enter your name, select "Coach", and sign up
2. **Check your email** and click the confirmation link
3. **Log in** as the coach
4. **Create a new assessment**: Click "+ New Assessment", enter a boxer's email, get the invite link
5. **Open the invite link** in a private/incognito window
6. **Create a Boxer account** and complete the self-assessment
7. Go back to the Coach window — you should see "Boxer Complete"
8. Click "Do Your Assessment" to add the coach's ratings
9. Both profiles appear on the radar chart!

### STEP 7: Deploy to Vercel (Free)

1. Push your code to GitHub:
```bash
# In the project folder:
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/boxing-profile.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click **Add New** → **Project**
4. Import your `boxing-profile` repository
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**
7. In ~1 minute you'll get a URL like `boxing-profile.vercel.app`

### STEP 8: Update Supabase with Your Live URL

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Change **Site URL** to your Vercel URL (e.g., `https://boxing-profile.vercel.app`)
3. Add your Vercel URL to **Redirect URLs**: `https://boxing-profile.vercel.app/*`

**You're live!** 🥊

---

## How It Works

### The Flow
```
Coach creates assessment
    ↓
Coach gets invite link
    ↓
Coach sends link to boxer (via text/email/WhatsApp)
    ↓
Boxer clicks link → signs up → completes self-assessment → submits
    ↓
Coach sees "Boxer Complete" on dashboard
    ↓
Coach opens assessment → does their rating → submits
    ↓
Both profiles visible on radar chart ✓
    ↓
Assessment stored with date for future reference ✓
```

### Repeating Assessments
To track progress over time, the coach simply creates a **new assessment** for the same boxer. Each assessment is stored with its date, so you can compare results over time.

### Data Security
- Each user can only see their own assessments
- Boxer ratings are hidden from the coach until the boxer submits
- All data is encrypted in transit (HTTPS) and at rest (Supabase)
- The anon key is safe to expose — Supabase Row Level Security protects the data

---

## Project Structure

```
boxing-profile-app/
├── index.html              # Entry point
├── package.json            # Dependencies
├── vite.config.js          # Build tool config
├── vercel.json             # Deployment routing
├── .env.example            # Environment variables template
├── supabase/
│   └── schema.sql          # Database tables & security policies
└── src/
    ├── main.jsx            # App entry with router
    ├── App.jsx             # Auth state & route management
    ├── styles.css          # All styles
    ├── lib/
    │   ├── supabase.js     # Supabase client
    │   └── skills.js       # Boxing skills data
    ├── components/
    │   └── RadarChart.jsx  # Canvas radar chart
    └── pages/
        ├── AuthPage.jsx    # Login & signup
        ├── Dashboard.jsx   # Assessment list & invites
        ├── AssessmentPage.jsx  # Rating interface
        └── AcceptInvite.jsx    # Invite link handler
```

---

## Troubleshooting

**"Invalid login credentials"** → Make sure you confirmed your email first

**Invite link doesn't work** → Make sure the URL matches your Site URL in Supabase auth settings

**Can't see assessments** → The SQL schema must be run first; check the SQL Editor for errors

**Blank page after deploy** → Check that environment variables are set in Vercel (Settings → Environment Variables), then redeploy

---

## Future Enhancements You Could Add

- **Email notifications** when boxer completes (use Supabase Edge Functions + Resend)
- **Progress charts** comparing multiple assessments over time
- **PDF export** of completed assessments
- **Custom skill lists** per coach
- **Team management** for coaches with multiple boxers
