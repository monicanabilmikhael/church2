# ☦ بيانات شمامسة كنيسة العذراء مريم

Full-stack web app to manage deacon records.  
**100% free, no credit card, always online.**

**Stack:** React + Vite → Vercel (frontend) | PostgreSQL → Supabase (database)

---

## 🚀 Setup Guide (3 steps, ~15 minutes)

### Step 1: Create Supabase Database (free)

1. Go to **https://supabase.com** → click **"Start your project"**
2. Sign up with **GitHub** (easiest) or email
3. Click **"New Project"**
   - Organization: your default org
   - Project name: `deacons-church`
   - Database password: choose any password (save it!)
   - Region: choose closest (e.g., Frankfurt or Middle East)
4. Wait ~2 minutes for project to be created
5. Go to **SQL Editor** (left sidebar) → click **"New Query"**
6. Copy ALL the contents of `supabase-setup.sql` and paste it
7. Click **"Run"** → you should see "Success"
8. Go to **Settings** → **API** (left sidebar)
   - Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy **anon public** key (the long string under "Project API keys")

### Step 2: Push Code to GitHub

1. Go to **https://github.com** → sign in (or create account)
2. Click **"+"** → **"New repository"**
   - Name: `deacons-church`
   - Keep it **Public**
   - Click **"Create repository"**
3. On your computer, open terminal in the project folder:

```bash
cd deacons-vercel
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/deacons-church.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel (free)

1. Go to **https://vercel.com** → click **"Sign Up"** → sign in with **GitHub**
2. Click **"Add New Project"**
3. Find and select your `deacons-church` repository → click **"Import"**
4. **IMPORTANT** — Before clicking Deploy, add Environment Variables:
   - Click **"Environment Variables"**
   - Add these two:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

5. Click **"Deploy"**
6. Wait 1-2 minutes...

### ✅ Done!

Your app is now live at: **https://deacons-church.vercel.app** (or similar)

**Share this link with the church!** 🎉

---

## 📋 Features

- ✅ Add, edit, delete deacon records
- ✅ Search by name, mobile, residence, confession father
- ✅ Filter by deacon rank (dropdown)
- ✅ Statistics dashboard (total + count by rank)
- ✅ View full deacon details in modal
- ✅ Beautiful RTL Arabic interface
- ✅ Responsive (works on phones)
- ✅ Real PostgreSQL database (data is permanent)
- ✅ Free forever, no sleeping, no credit card

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your Supabase URL and key

# Run locally
npm run dev

# Open http://localhost:5173
```

---

## 📊 Database Fields

| Arabic | English | Type |
|--------|---------|------|
| الاسم ثلاثي | full_name | text (required) |
| تاريخ الميلاد | date_of_birth | text |
| الرتبة الشمامسة | deacon_rank | text |
| تاريخ السيامة | ordination_date | text |
| الاسم فى السيامة | ordination_name | text |
| أب الاعتراف | confession_father | text |
| المهنة أو الوظيفة | profession | text |
| رقم الموبايل | mobile_number | text |
| محل الإقامة | residence | text |

---

## ❓ Troubleshooting

**"Failed to fetch" error?**
- Check that your `.env` / Vercel environment variables are correct
- Make sure you ran the SQL in Supabase SQL Editor

**Data not showing?**
- Go to Supabase → Table Editor → check if `deacons` table exists
- Check the RLS policies are created (the SQL does this automatically)

**Want to update the site?**
- Make changes locally
- `git add . && git commit -m "update" && git push`
- Vercel auto-deploys in ~1 minute
