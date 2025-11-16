# Setup Guide - Step by Step

This guide will walk you through setting up the Find My Gig job scanner from scratch.

## Phase 1: Initial Setup (15 minutes)

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (~2 minutes)
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: Settings → API → anon public
   - Service role key: Settings → API → service_role (keep secret!)

### 3. Setup Database

1. Go to SQL Editor in Supabase
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify: Check Tables section - you should see 6 tables

### 4. Get API Keys

**Anthropic Claude:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy the key

**Resend (Email):**
1. Go to [resend.com](https://resend.com)
2. Sign up and create an API key
3. Copy the key

### 5. Configure Environment

Create `.env.local`:

\`\`\`env
# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Anthropic (from step 4)
ANTHROPIC_API_KEY=your_anthropic_key

# Resend (from step 4)
RESEND_API_KEY=your_resend_key
EMAIL_TO=your_email@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Phase 2: Data Import (10 minutes)

### 6. Import Companies

\`\`\`bash
npm run import-companies
\`\`\`

Expected output:
\`\`\`
Parsed 120 companies from CSV
Imported batch: 100/120
Imported batch: 120/120
Import complete!
Imported: 120 companies
\`\`\`

### 7. Process Your CV

Make sure your CV is at: `source/guy_duer_cv.docx`

\`\`\`bash
npm run process-cv
\`\`\`

Expected output:
\`\`\`
CV processed successfully!
Content length: 3241 characters
Skills found: 24
Experience entries: 3
Education entries: 2
\`\`\`

### 8. Discover Career Pages

⚠️ **Important**: This takes ~10 minutes and makes many HTTP requests

\`\`\`bash
npm run discover
\`\`\`

Expected output:
\`\`\`
Starting career page discovery for 50 companies...
Discovering career page for Alison.ai...
  Trying: https://alison.ai/careers
  ✓ Found career page at https://alison.ai/careers (greenhouse)
...
Career page discovery complete!
Found: 32
Not found: 15
Errors: 3
Success rate: 64.0%
\`\`\`

## Phase 3: First Scrape & Test (15 minutes)

### 9. Start Dev Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 10. Test the UI

1. **Homepage**: Should show links to Dashboard and Companies
2. **Companies Page** (`/companies`):
   - Should show ~120 companies
   - ~30-40 should have "Found" career pages
   - Try clicking "Scrape Now" on a company with a career page
3. **Dashboard** (`/dashboard`):
   - Should be empty initially
   - Will populate after first scrape
4. **Settings** (`/settings`):
   - Shows CV status
   - Has "Run Full Scrape" button

### 11. Run First Scrape

Option A - Via UI:
1. Go to Settings
2. Click "Run Full Scrape"
3. Wait ~2-3 minutes
4. Should see alert: "Scrape complete! Companies: 10, Jobs found: 45..."

Option B - Via API:
\`\`\`bash
curl http://localhost:3000/api/scrape?limit=5
\`\`\`

Expected flow:
1. Scrapes 5-10 companies
2. Finds 20-50 jobs
3. Filters to 10-30 relevant jobs
4. Scores them with Claude AI
5. Saves to database

### 12. Verify Results

1. **Dashboard** (`/dashboard`):
   - Should now show relevant jobs
   - Click on a job to see match analysis
   - Check match scores and matched skills

2. **Check Database** (optional):
   - Go to Supabase → Table Editor
   - Check `jobs` table - should have rows
   - Check `job_scores` table - should have scores

### 13. Test Email Digest

\`\`\`bash
curl http://localhost:3000/api/send-digest
\`\`\`

Or via Settings page → "Send Test Email"

Check your inbox for the digest email.

## Phase 4: Deploy to Production (20 minutes)

### 14. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
\`\`\`

### 15. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Configure environment variables:
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Click "Deploy"

### 16. Verify Deployment

1. Visit your Vercel domain
2. Test all pages (dashboard, companies, settings)
3. Trigger a scrape via Settings
4. Verify it works in production

### 17. Setup Cron Jobs

Vercel automatically sets up cron jobs from `vercel.json`:
- **Scrape**: Every 6 hours
- **Digest**: Daily at 6am UTC

To verify:
1. Go to Vercel dashboard → your project → Cron
2. Should see 2 cron jobs listed
3. Click "Run" to test manually

## Phase 5: Monitoring & Maintenance

### Monitor Scrapes

Check Vercel logs:
1. Go to Vercel dashboard → Deployments
2. Click on latest deployment → Functions
3. Look for `/api/scrape` invocations
4. Check for errors

### Check Database

In Supabase:
1. `scrape_logs` table - shows all scrape attempts
2. `email_digests` table - shows all emails sent
3. `jobs` table - filter by `status = 'active'` to see current jobs

### Adjust Cron Schedules

Edit `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/scrape?limit=20",
      "schedule": "0 */6 * * *"  // Change frequency here
    },
    {
      "path": "/api/send-digest",
      "schedule": "0 6 * * *"  // Change time here (UTC)
    }
  ]
}
\`\`\`

Redeploy after changes.

## Troubleshooting

### "No companies to scrape"
- Run career page discovery: `npm run discover`
- Check companies table - verify `career_page_url` is populated

### "LLM scoring failed"
- Check Anthropic API key is correct
- Verify API has quota remaining
- Check Vercel logs for detailed error

### "Email not received"
- Verify Resend API key
- Check Resend dashboard for send logs
- Verify email domain is configured in Resend

### "Database connection failed"
- Double-check Supabase credentials
- Verify service role key (not anon key) is used in server code
- Check Supabase project is not paused

### Jobs not appearing in dashboard
- Verify scrape completed successfully (check logs)
- Check `jobs` table has rows
- Verify `job_scores` table has `is_relevant = true` rows
- Try clicking "All Jobs" filter in dashboard

## Next Steps

1. **Add More Companies**: Edit `source/company_data.csv` and re-run import
2. **Customize Keywords**: Edit `lib/job-filter.ts` to add/remove keywords
3. **Adjust AI Prompt**: Edit `lib/llm-scorer.ts` to change matching logic
4. **Customize Email**: Edit `lib/email-service.ts` template

## Cost Breakdown

- Anthropic Claude: ~$0.003 per job scored
- Supabase: Free tier (500MB database)
- Resend: Free tier (100 emails/day)
- Vercel: Free tier

**Estimated**: $2-5/month for 100 companies, 1000 jobs/month

## Support

If you encounter issues:
1. Check the logs (Vercel dashboard or terminal)
2. Verify environment variables are set correctly
3. Check database tables have expected data
4. Review error messages in browser console

Good luck with your job search! 🎯

