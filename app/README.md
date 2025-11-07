# 🎯 Find My Gig - AI Job Search & Application Assistant

A comprehensive multi-user web application that automates job discovery, scoring, tracking, and tailored application generation using AI.

## 📋 Features

- **🔍 Daily Job Discovery**: Automated scanning of job opportunities based on your preferences
- **🎯 Dual Fit Scoring**: 
  - User→Job (60%): How well your CV matches the job requirements
  - Job→User (40%): How well the job matches your preferences
- **📊 Kanban Board**: Visual job tracking through stages (Identified → Submitted → Rejected → Won't Go After)
- **📝 AI-Generated Applications**: Tailored CVs (DOCX + PDF) and cover letters for each opportunity
- **📧 Daily Digest Emails**: Notification of new high-fit opportunities
- **📈 Insights Dashboard**: Analytics on your job search progress
- **⏸️ Snooze Mode**: Temporarily pause job scanning
- **🏷️ Smart Tags**: Automatic tagging (High Fit, Match, Stretch Role, Left Field)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with credentials provider
- **AI**: Claude Sonnet 4.5 (Anthropic)
- **Email**: Resend
- **Document Processing**: Mammoth (DOCX parsing), docx & pdf-lib (generation)
- **Testing**: Vitest
- **Deployment**: Vercel (with cron jobs)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Anthropic API key
- Resend API key (for email notifications)

### 1. Clone and Install

```bash
cd app
npm install
```

### 2. Environment Setup

Create a `.env` file in the `app` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/find_my_gig?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic API
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Resend (Email)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Optional: Cron job security
CRON_SECRET="your-cron-secret"

# App Configuration
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🎮 Demo User

After seeding, you can login with:
- **Email**: `demo@findmygig.com`
- **Password**: `password123`

The demo user comes with:
- Pre-configured preferences (RevOps, BizOps roles in Israel)
- Sample CV
- Example job opportunity

## 📖 Usage Guide

### 1. Initial Setup

1. **Sign Up**: Create an account at `/auth/signup`
2. **Upload CV**: Go to Settings → Upload your base CV (DOCX format)
3. **Set Preferences**: Go to Preferences → Create up to 3 preference sets with:
   - Role taxonomy (RevOps, BizOps, etc.)
   - Preferred locations
   - High-interest companies

### 2. Job Discovery

The system automatically scans for jobs daily at 6 AM (configurable in `vercel.json`). You can also trigger manually via the cron endpoint.

### 3. Reviewing Jobs

- Jobs appear on the **Board** organized by status
- Each job shows:
  - Overall fit score
  - Tags (High Fit, Match, etc.)
  - Company and location
- Click "View" to see full details and scoring explanation

### 4. Generating Applications

1. Open a ticket detail page
2. Click "Generate CV & Cover Letter"
3. AI generates:
   - Tailored CV (DOCX + PDF)
   - Custom cover letter (TXT)
4. Download and customize as needed

### 5. Tracking Progress

- Move tickets between columns by updating status
- Mark submission method when applying
- View analytics on the **Insights** page

## 🔧 Configuration

### Scoring Thresholds

Default: 65 (adjustable in Settings)
- Jobs scoring below threshold won't create tickets
- Score calculation: `min(0.6 × User→Job + 0.4 × Job→User, 100)`

### Tag Rules

- **"You're a High Fit!"**: User→Job score ≥ 90
- **"They're a High Fit for you!"**: Job→User score ≥ 90
- **"That's a Match!"**: Both scores ≥ 90
- **"Stretch Role"**: User→Job 70-84
- **"Left Field"**: Job→User < 60 but User→Job ≥ 75

### Snooze Mode

Pause scanning for 1-30 days via Settings. Useful when:
- Taking a break from job search
- Traveling or unavailable
- Need to focus on existing applications

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

Vercel will automatically:
- Set up the cron job for daily scanning
- Configure serverless functions
- Handle Next.js builds

### Other Platforms

For platforms without native cron support:
1. Set up external cron service (GitHub Actions, etc.)
2. Call `/api/cron/scan-jobs` with Bearer token authentication

## 🔐 Security

- **Authentication**: Secure password hashing with bcrypt
- **Row-Level Security**: Users can only access their own data
- **Input Validation**: Zod schemas for all API inputs
- **Sanitization**: SQL injection prevention via Prisma
- **API Protection**: NextAuth session verification

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

Current test coverage:
- CV parser utilities
- Company normalization
- Keyword extraction

## 📊 Database Schema

Key models:
- **User**: User accounts and base CV
- **UserPreferenceSet**: Job search preferences (max 3 per user)
- **ScanConfig**: Scanning settings and schedule
- **Job**: Job postings from various sources
- **Ticket**: Job opportunities matched to users
- **Artifact**: Generated CVs and cover letters
- **Notification**: In-app and email notifications

See `prisma/schema.prisma` for full schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### CV Management
- `POST /api/cv/upload` - Upload base CV
- `GET /api/cv/upload` - Get current CV

### Preferences
- `GET /api/preferences` - List preference sets
- `POST /api/preferences` - Create preference set
- `PATCH /api/preferences/[id]` - Update preference set
- `DELETE /api/preferences/[id]` - Delete preference set

### Tickets
- `GET /api/tickets` - List tickets (with status filter)
- `GET /api/tickets/[id]` - Get ticket details
- `PATCH /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/generate-artifacts` - Generate CV & cover letter

### Artifacts
- `GET /api/artifacts/[id]/download` - Download artifact

### Settings
- `GET /api/settings/scan-config` - Get scan configuration
- `PATCH /api/settings/scan-config` - Update scan configuration

### Analytics
- `GET /api/insights` - Get insights and analytics

### Cron
- `GET/POST /api/cron/scan-jobs` - Run job scanning (authenticated)

## 🤖 Job Scanning Implementation

The current implementation includes a placeholder for job scraping. To implement actual job discovery, integrate with:

### Job Board APIs
- **LinkedIn Jobs API**: Official API or RapidAPI
- **Indeed API**: Publisher API
- **Glassdoor API**: Job listings
- **Google Jobs**: Custom search integration

### Web Scraping
- Use Puppeteer or Playwright for dynamic sites
- Respect robots.txt and rate limits
- Implement proper error handling and retries

### Implementation Location
Update `/lib/job-scanner.ts` → `scrapeJobs()` function with your integration.

## 📝 Prompt Templates

The application uses carefully crafted prompts for Claude:

### Job Extraction
Maps job descriptions to taxonomy and extracts structured data.

### Scoring
Compares CV with JD, considers user preferences, outputs dual scores.

### CV Generation
Rewrites CV for specific role, maintains factual accuracy, optimizes for ATS.

### Cover Letter
Generates short (≤200 words), punchy letters matching the example style.

## 🎨 Customization

### Adding Role Taxonomies
Edit `app/dashboard/preferences/page.tsx` → `AVAILABLE_ROLES` array

### Changing Score Weights
Edit `lib/claude.ts` → `scoreJobFit()` function

### Email Templates
Edit `lib/email.ts` → `sendDailyDigest()` and `sendHighFitNotification()`

### UI Styling
All components use Tailwind CSS. Customize in component files or extend `tailwind.config.js`

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check firewall/network settings

### CV Upload Fails
- Verify file is `.docx` format (not `.doc`)
- Check file size (should be < 10MB)
- Ensure proper file permissions

### Emails Not Sending
- Verify Resend API key
- Check `FROM_EMAIL` is verified in Resend
- Review Resend dashboard for errors

### Claude API Errors
- Check API key is valid
- Verify sufficient API credits
- Review rate limits in Anthropic dashboard

### Cron Jobs Not Running
- Verify `vercel.json` is properly configured
- Check Vercel cron logs in dashboard
- Ensure `CRON_SECRET` is set (if using)

## 📚 Reference Files

The application was built following these example files:

- `raw_examples/guy_duer_cv_25_nov.docx` - Base CV structure
- `raw_examples/Guy_Duer_CV_Impala.docx` - CV formatting reference
- `jd_example.txt` - Job description parsing example
- `cover_letter_example.txt` - Cover letter tone and style

## 🤝 Contributing

This is a production-ready application. To extend:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Private - All rights reserved

## 🙏 Acknowledgments

- Built with Claude Sonnet 4.5 (Anthropic)
- UI components inspired by shadcn/ui
- Email templates styled with modern design principles

---

**Version**: 1.0.0  
**Author**: Guy Duer  
**Last Updated**: November 2025

For questions or support, contact: demo@findmygig.com
