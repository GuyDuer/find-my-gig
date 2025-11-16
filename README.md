# Find My Gig - Job Scanner

Automated job scanning system for Israeli tech companies, focusing on RevOps, Operations, and Program Management positions.

## Features

- **Automated Scraping**: Discovers and scrapes career pages from 100+ Israeli tech companies
- **Smart Filtering**: Keyword-based filtering for relevant roles (RevOps, Ops, Program Management)
- **AI Matching**: Uses Claude (Anthropic) to score jobs against your CV
- **Daily Digests**: Email notifications for new relevant jobs
- **Web UI**: Dashboard to view, filter, and track job opportunities

## Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Email**: Resend
- **Hosting**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Anthropic API key
- Resend account (for emails)
- Vercel account (for deployment)

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration SQL:
   - Go to SQL Editor in Supabase
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL

3. Get your Supabase credentials:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: Settings → API → anon/public key
   - Service Key: Settings → API → service_role key

### 4. Environment Variables

Create `.env.local` file in the project root:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
EMAIL_TO=your_email@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 5. Import Companies

Import the company list from CSV:

\`\`\`bash
npm run import-companies
\`\`\`

This will import all companies from `source/company_data.csv` into your database.

### 6. Upload Your CV

The system uses your CV to match and score jobs. Place your CV (DOCX format) at:

\`\`\`
source/guy_duer_cv.docx
\`\`\`

Then run a script to parse and store it:

\`\`\`bash
npm run dev
# Then visit http://localhost:3000/settings and trigger CV processing
\`\`\`

Or create a script to do this programmatically.

### 7. Run Locally

Start the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 8. Discover Career Pages

Before scraping, discover career page URLs:

\`\`\`bash
# Create a script to run career discovery
npm run discover
\`\`\`

Or trigger it via the Settings page in the UI (requires server-side script).

### 9. Run Your First Scrape

Via UI:
- Go to Settings → Manual Operations
- Click "Run Full Scrape"

Via API:
\`\`\`bash
curl http://localhost:3000/api/scrape
\`\`\`

This will:
1. Scrape jobs from companies with discovered career pages
2. Filter jobs by keywords
3. Score relevant jobs with Claude AI
4. Save results to database

### 10. Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel:
   - Add all the same variables from `.env.local`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
4. Deploy

Vercel will automatically set up cron jobs based on `vercel.json`:
- Scrape: Every 6 hours
- Email digest: Daily at 6am UTC

## Usage

### Dashboard

Visit `/dashboard` to see:
- Stats overview (relevant jobs, average match, companies)
- Job table with filtering
- Click jobs to see match analysis and full details

### Companies

Visit `/companies` to:
- View all companies and their career page status
- Manually trigger scrapes for specific companies
- See discovery status

### Settings

Visit `/settings` to:
- Configure email notifications
- Run manual scrapes
- Import companies
- View environment status

## Project Structure

\`\`\`
find_my_gig/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts         # Main scraping endpoint
│   │   ├── jobs/route.ts           # Get jobs API
│   │   ├── companies/route.ts      # Company management
│   │   └── send-digest/route.ts    # Email digest sender
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── companies/page.tsx          # Company management UI
│   ├── settings/page.tsx           # Settings page
│   └── layout.tsx
├── lib/
│   ├── supabase.ts                 # Database client
│   ├── cv-parser.ts                # CV parsing logic
│   ├── career-page-discovery.ts    # Career page finder
│   ├── job-scraper.ts              # Job scraping engine
│   ├── job-differ.ts               # Change detection
│   ├── job-filter.ts               # Keyword filtering
│   ├── llm-scorer.ts               # AI job scoring
│   └── email-service.ts            # Email generation
├── components/ui/                  # UI components
├── source/
│   ├── company_data.csv           # Company list
│   └── guy_duer_cv.docx           # Your CV
├── scripts/
│   └── import-companies.ts        # CSV import script
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql # Database schema
\`\`\`

## How It Works

1. **Company Import**: CSV with company data is imported to database
2. **Career Page Discovery**: Automatically finds career pages by trying common URL patterns
3. **Job Scraping**: 
   - Detects platform (Greenhouse, Lever, etc.)
   - Extracts job listings
   - Fetches job details
4. **Change Detection**: 
   - Compares scraped jobs against database
   - Identifies new/updated/removed jobs
5. **Filtering**: Keyword-based filter (20+ keywords for RevOps/Ops/PM roles)
6. **AI Scoring**: 
   - Batches jobs (12 per API call)
   - Uses Claude to score against your CV
   - Returns relevance, match score, and reasoning
7. **Email Digest**: 
   - Finds jobs added in last 24 hours
   - Generates HTML email
   - Sends via Resend

## Cost Estimate

- **Anthropic Claude**: ~$2-5/month for 100 companies, 1000 jobs/month
- **Supabase**: Free tier sufficient for this use case
- **Resend**: Free tier (100 emails/day)
- **Vercel**: Free tier sufficient for this use case

Total: **~$2-5/month**

## Customization

### Add More Keywords

Edit `lib/job-filter.ts` to add keywords to the filter lists.

### Adjust Scraping Frequency

Edit `vercel.json` cron schedules:
- `0 */6 * * *` = every 6 hours
- `0 6 * * *` = daily at 6am UTC

### Change Email Template

Edit `lib/email-service.ts` → `generateEmailHTML()` function.

### Add More Companies

Add rows to `source/company_data.csv` and re-run import script.

## Troubleshooting

### No jobs found after scraping

- Check that career pages were discovered (Companies page)
- Manually verify the career page URL works
- Check scrape logs in database

### LLM scoring fails

- Verify ANTHROPIC_API_KEY is set correctly
- Check API quota/limits
- Review logs for API errors

### Email not received

- Verify RESEND_API_KEY and EMAIL_TO are set
- Check Resend dashboard for send logs
- Verify email domain is configured in Resend

## License

MIT

