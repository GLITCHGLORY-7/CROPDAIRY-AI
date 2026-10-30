# CropDiary AI — Production Deployment Guide
*Database Configuration, Environment Setup, and Hosting Architecture*

---

## 1. Hosting Architecture Overview

CropDiary AI is architected as a Progressive Web Application (PWA) with a decoupled backend:
- **Frontend**: Static single-page application (React 18 + Vite) deployable to any edge CDN (Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront).
- **Backend & Database**: Managed Supabase PostgreSQL with built-in Row-Level Security, GoTrue Auth, and Storage buckets.
- **Offline Client**: Native browser IndexedDB running client-side with automatic background synchronization.

---

## 2. Prerequisites

- A [Supabase](https://supabase.com) project (Free tier or Pro).
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account (or standard static web server).
- Node.js `v18.0.0` or higher and npm `9.0.0` or higher.

---

## 3. Database Migration Execution Sequence

Execute the 8 relational database migrations in sequential order against your Supabase PostgreSQL instance:

```bash
# Option A: Using Supabase CLI (Recommended)
supabase login
supabase link --project-ref your-project-ref
supabase db push

# Option B: Using psql or Supabase SQL Editor
# Execute migrations 000001 through 000008 in order:
```

1. `supabase/migrations/20261026000001_phase1_initial_schema.sql`: Core tables (`profiles`, `farms`, `plots`), RLS policies, spatial triggers, and area unit enums.
2. `supabase/migrations/20261026000002_phase2_crop_plans.sql`: `crop_plans` table, candidate crop snapshots, and timeline stages.
3. `supabase/migrations/20261026000003_phase3_crop_doctor.sql`: `crop_assessments`, `crop_assessment_followups`, and storage bucket policies.
4. `supabase/migrations/20261026000004_phase4_weather_alerts.sql`: `weather_forecasts`, `farm_weather_alerts`, and `farm_reminders`.
5. `supabase/migrations/20261026000005_phase5_farm_diary.sql`: `farm_diary_entries`, `farm_activity_details`, `irrigation_records`, `farm_input_records`, `crop_observations`, `farm_expenses`, `harvest_records`, and `farm_diary_attachments`.
6. `supabase/migrations/20261026000006_phase6_farm_finance.sql`: `farm_budgets`, `harvest_sales`, `farm_financial_transactions`, and integer paise constraints.
7. `supabase/migrations/20261026000007_phase7_assistant_and_schemes.sql`: `assistant_conversations`, `assistant_messages`, and regional language support.
8. `supabase/migrations/20261026000008_phase8_offline_sync_and_history.sql`: `client_sync_logs` table with composite indexes for multi-season analytics and idempotent sync auditing.

---

## 4. Storage Bucket Configuration

In the Supabase Dashboard > Storage, verify or create the following public/private buckets:
- **`crop-assessment-photos`**:
  - Max upload size: `5MB`
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - Policy: Authenticated users can upload and read their own photos (`(storage.foldername(name))[1] = auth.uid()::text`).
- **`diary-attachments`**:
  - Max upload size: `5MB`
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

---

## 5. Production Build & Environment Setup

### Step 1: Configure Production Environment Variables
Set the following environment variables in your hosting provider's dashboard:

| Variable | Description | Required? |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project API URL | Yes (for cloud persistence) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Project Anonymous Key | Yes (for cloud persistence) |
| `VITE_DATAGOV_API_KEY` | Open Government Data Platform Key | Optional (fallback to DMI benchmarks) |
| `VITE_APP_ENV` | Set to `production` | Recommended |

> **Security Note**: External API secrets (`META_API_KEY`, `WEATHER_API_KEY`) are stored exclusively server-side via Supabase Edge Function secrets (`supabase secrets set ...`), never in frontend bundles or `VITE_` variables.

### Step 2: Build the Application
```bash
npm run build
```
This generates the optimized production bundle in the `dist/` directory.

---

## 6. Edge Deployment (Vercel / Netlify)

### Deploying to Vercel
```bash
# Using Vercel CLI
npm install -g vercel
vercel --prod
```
When prompted:
- Framework preset: **Vite**
- Build command: `tsc -b && vite build`
- Output directory: `dist`

### Deploying to Netlify
Create a `netlify.toml` or configure via Netlify UI:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 7. Post-Deployment Verification Checklist

1. [ ] Navigate to the live URL and confirm HTTPS is active.
2. [ ] Register a new test account and verify authentication tokens are issued.
3. [ ] Create a farm and plot; confirm records appear in Supabase PostgreSQL `farms` table with matching `owner_id`.
4. [ ] Toggle browser DevTools to "Offline", create a diary entry, and confirm it saves locally with amber badge.
5. [ ] Toggle back to "Online" and verify the entry synchronizes with green "Cloud Synced" confirmation.
6. [ ] Navigate to `/app/history` and confirm multi-season KPI cards render cleanly.
7. [ ] Click "Export CSV" and confirm download contains properly quoted headers and data.
