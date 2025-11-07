# 🛠️ Complete Installation Guide - Find My Gig

## Overview

This guide will help you get Find My Gig running from scratch, including setting up all required services.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Service Setup](#service-setup)
3. [Local Installation](#local-installation)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Software Prerequisites

- **Node.js**: Version 18 or higher ([download](https://nodejs.org/))
- **PostgreSQL**: Version 14 or higher ([download](https://www.postgresql.org/download/))
- **Git**: For version control ([download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([download](https://code.visualstudio.com/))

### Verify Installation

```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 8.x or higher
psql --version  # Should be 14.x or higher
git --version   # Any recent version
```

---

## Service Setup

### 1. PostgreSQL Database

#### Option A: Local PostgreSQL

**macOS (Homebrew)**:
```bash
brew install postgresql@14
brew services start postgresql@14
createdb find_my_gig
```

**Linux (Ubuntu)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb find_my_gig
```

**Windows**:
Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Option B: Vercel Postgres (Recommended for Production)

1. Go to [vercel.com/storage](https://vercel.com/storage)
2. Create new Postgres database
3. Copy connection string
4. Use in `DATABASE_URL` environment variable

#### Option C: Other Hosted Options

- **Supabase**: Free tier available ([supabase.com](https://supabase.com))
- **Railway**: Easy PostgreSQL setup ([railway.app](https://railway.app))
- **Neon**: Serverless Postgres ([neon.tech](https://neon.tech))

### 2. Anthropic API (Claude)

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create new API key
5. Copy the key (starts with `sk-ant-`)
6. **Important**: Add credits to your account if needed

### 3. Resend (Email Service)

1. Go to [resend.com](https://resend.com/)
2. Sign up for free account (3,000 emails/month free)
3. Verify your email
4. Add and verify your domain (or use free Resend domain for testing)
5. Create API key
6. Copy the key (starts with `re_`)

**Domain Verification** (for production):
```
Add these DNS records to your domain:
- TXT record for SPF
- DKIM record (provided by Resend)
```

For testing, you can use: `onboarding@resend.dev`

---

## Local Installation

### Step 1: Clone Repository

```bash
cd /Users/guy.duer/find_my_gig
# Repository is already there with the app/ directory
```

### Step 2: Install Dependencies

```bash
cd app
npm install
```

This will install ~400 packages and may take 2-3 minutes.

### Step 3: Configure Environment Variables

Create `.env` file in the `app` directory:

```bash
cd app
cp ENV_TEMPLATE.txt .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/find_my_gig?schema=public"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
RESEND_API_KEY="re_your-key-here"
FROM_EMAIL="onboarding@resend.dev"  # or your verified email
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
# When prompted, enter a name like "init"

# Seed demo data (recommended)
npm run prisma:seed
```

Expected output:
```
✓ Created demo user: demo@findmygig.com
✓ Created scan config
✓ Created preference sets
✓ Created sample job
✓ Created sample ticket
🎉 Seeding complete!
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 6: Test the Application

1. **Login**:
   - Email: `demo@findmygig.com`
   - Password: `password123`

2. **Upload CV**:
   - Go to Settings
   - Upload your CV (DOCX file)
   - Use example from `raw_examples/guy_duer_cv_25_nov.docx`

3. **View Sample Job**:
   - Go to Board
   - See the Impala job in "Identified" column
   - Click "View" to see details

4. **Generate Documents**:
   - Open the ticket
   - Click "Generate CV & Cover Letter"
   - Wait for AI to generate documents
   - Download DOCX, PDF, and TXT files

5. **Check Insights**:
   - Go to Insights
   - View sample analytics

---

## Production Deployment

### Option 1: Vercel (Recommended)

#### Prerequisites
- GitHub account
- Vercel account ([vercel.com](https://vercel.com))

#### Steps

1. **Push to GitHub**:
```bash
cd /Users/guy.duer/find_my_gig
git init
git add app/
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Root directory: `app`
   - Framework Preset: Next.js

3. **Configure Environment Variables**:
   Add these in Vercel dashboard:
   ```
   DATABASE_URL
   NEXTAUTH_SECRET
   NEXTAUTH_URL (https://your-domain.vercel.app)
   ANTHROPIC_API_KEY
   RESEND_API_KEY
   FROM_EMAIL
   APP_URL (https://your-domain.vercel.app)
   CRON_SECRET (optional)
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live!

5. **Run Migrations**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   
   # Run migrations
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

6. **Seed Database** (optional):
   ```bash
   npm run prisma:seed
   ```

#### Cron Job Configuration

The `vercel.json` file is already configured:
```json
{
  "crons": [{
    "path": "/api/cron/scan-jobs",
    "schedule": "0 6 * * *"
  }]
}
```

This runs daily at 6 AM UTC. Vercel handles this automatically.

### Option 2: Other Platforms

#### Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL service
4. Set environment variables
5. Deploy

#### DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Create app from GitHub
3. Add managed PostgreSQL database
4. Configure environment variables
5. Deploy

For platforms without native cron:
- Set up GitHub Actions
- Use external cron service (cron-job.org)
- Call `/api/cron/scan-jobs` with Bearer token

---

## Troubleshooting

### Database Issues

**Error: "Can't reach database server"**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check connection
psql -U postgres -h localhost
```

**Error: "Database does not exist"**
```bash
# Create database
createdb find_my_gig

# Or in psql
psql -U postgres
CREATE DATABASE find_my_gig;
```

**Error: "Authentication failed"**
```bash
# Check your DATABASE_URL format:
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]

# Example:
postgresql://postgres:mypassword@localhost:5432/find_my_gig?schema=public
```

### Prisma Issues

**Error: "Prisma schema not found"**
```bash
cd app
npm run prisma:generate
```

**Error: "Migration failed"**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push
```

**View database in browser**:
```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### API Key Issues

**Claude API errors**:
- Verify key starts with `sk-ant-`
- Check credits in Anthropic console
- Review rate limits (default: 50 requests/min)

**Resend email not sending**:
- Verify FROM_EMAIL matches verified domain
- Check API key starts with `re_`
- Review logs in Resend dashboard
- For testing, use `onboarding@resend.dev`

### Build Errors

**TypeScript errors**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

**Module not found**:
```bash
# Clear cache and reinstall
npm run prisma:generate
npm install
```

### Runtime Errors

**Session errors**:
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies

**File upload fails**:
- Verify file is .docx format
- Check file size (max 10MB)
- Ensure proper permissions

**Cron not running**:
- Check Vercel cron logs
- Verify vercel.json is correct
- Test manually: `curl http://localhost:3000/api/cron/scan-jobs -X POST`

---

## Development Tips

### Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run prisma:studio          # Open database GUI
npm test                       # Run tests
npm run lint                   # Check code quality

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Create new migration
npm run prisma:seed            # Seed demo data

# Build
npm run build                  # Build for production
npm start                      # Start production server
```

### VS Code Extensions (Recommended)

- Prisma
- ESLint
- Tailwind CSS IntelliSense
- GitLens

### Database Management

```bash
# Connect to database
psql postgresql://user:pass@localhost:5432/find_my_gig

# Useful queries
\dt                           # List tables
SELECT * FROM "users";        # View users
SELECT * FROM "tickets";      # View tickets
```

---

## Getting Help

### Documentation
- [README.md](./app/README.md) - Complete feature documentation
- [SPECIFICATION.md](./app/SPECIFICATION.md) - Technical details
- [QUICKSTART.md](./app/QUICKSTART.md) - 5-minute setup
- [PROJECT_SUMMARY.md](./app/PROJECT_SUMMARY.md) - Project overview

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://prisma.io/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Vercel Docs](https://vercel.com/docs)

### Common Questions

**Q: Can I use a different database?**
A: Yes, Prisma supports MySQL, SQLite, and others. Update schema.prisma.

**Q: Can I self-host?**
A: Yes, on any Node.js hosting platform. You'll need to set up cron separately.

**Q: How much does it cost to run?**
A: 
- Database: Free tier on Vercel/Supabase
- Emails: 3,000/month free on Resend
- Claude API: Pay per token (~$0.01-0.10 per job)
- Hosting: Free on Vercel hobby plan

**Q: Can I customize the scoring algorithm?**
A: Yes, edit `lib/claude.ts` → `scoreJobFit()` function.

---

## Next Steps

After installation:

1. ✅ Upload your real CV
2. ✅ Configure your preferences
3. ✅ Set up actual job board integrations (see README)
4. ✅ Customize email templates
5. ✅ Adjust scoring thresholds
6. ✅ Deploy to production
7. ✅ Monitor logs and usage

---

**Good luck with your job search! 🎯**

For issues, refer to the troubleshooting section or check the README.

