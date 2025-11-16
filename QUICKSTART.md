# Quick Start Guide

Get your job scanner running in 30 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Have your CV ready (DOCX format)
- [ ] Credit card for API keys (most have free tiers)

## Step 1: Install (2 min)

```bash
cd /Users/guy.duer/Code/find_my_gig
npm install
```

## Step 2: Setup Database (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for provisioning (~2 min)
3. Go to SQL Editor
4. Copy-paste contents of `supabase/migrations/001_initial_schema.sql`
5. Click Run

## Step 3: Get API Keys (10 min)

### Supabase Keys
- Project URL: Settings → API → Project URL
- Anon Key: Settings → API → anon public
- Service Key: Settings → API → service_role

### Anthropic
- Go to [console.anthropic.com](https://console.anthropic.com)
- Sign up (credit card required)
- Create API key
- Note: First $5 free credit

### Resend
- Go to [resend.com](https://resend.com)
- Sign up (free tier: 100 emails/day)
- Create API key

## Step 4: Configure (2 min)

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
# Then edit .env.local with your keys
```

## Step 5: Import Data (5 min)

```bash
# Import companies from CSV
npm run import-companies

# Process your CV
npm run process-cv

# Discover career pages (takes ~10 min, can skip for now)
# npm run discover
```

## Step 6: Test It! (5 min)

```bash
# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. Go to Settings
2. Click "Run Full Scrape" (limit=5 for testing)
3. Wait ~2 minutes
4. Go to Dashboard
5. See your matched jobs!

## Step 7: Deploy (5 min)

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. Deploy to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - New Project → Import your repo
   - Add environment variables (copy from .env.local)
   - Deploy!

3. Cron jobs will auto-setup from `vercel.json`

## Done! 🎉

Your job scanner is now:
- ✅ Scraping jobs every 6 hours
- ✅ Scoring them with AI against your CV
- ✅ Sending daily email digests at 6am UTC

## Next Steps

- [ ] Run career page discovery: `npm run discover`
- [ ] Customize keywords in `lib/job-filter.ts`
- [ ] Adjust cron schedules in `vercel.json`
- [ ] Monitor via Vercel dashboard

## Troubleshooting

**No jobs found?**
- Most companies need career page discovery first
- Run: `npm run discover`

**LLM scoring failed?**
- Check Anthropic API key
- Verify you have credits

**No email received?**
- Check Resend API key
- Verify EMAIL_TO is set

## Cost

- Anthropic: ~$2-5/month
- Everything else: Free tier sufficient

## Support

Check these files for help:
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup steps
- `IMPLEMENTATION_SUMMARY.md` - What was built

Good luck! 🚀

