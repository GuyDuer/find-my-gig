# 🚀 Quick Start Guide

Get Find My Gig running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Resend API key ([get one here](https://resend.com/))

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Set Up Environment

Create `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

Required values:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `ANTHROPIC_API_KEY` - Your Claude API key
- `RESEND_API_KEY` - Your Resend API key
- `FROM_EMAIL` - Your verified email in Resend

### 3. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data (optional but recommended)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login with Demo Account

- **Email**: `demo@findmygig.com`
- **Password**: `password123`

## First Steps

1. **Upload Your CV**:
   - Go to Settings → Upload your CV (DOCX format)

2. **Set Preferences**:
   - Go to Preferences → Create a preference set
   - Select roles, locations, and companies

3. **Trigger Job Scan** (Manual):
   ```bash
   curl http://localhost:3000/api/cron/scan-jobs -X POST
   ```

4. **View Jobs**:
   - Go to Board to see any matched jobs
   - Click on a job to view details

5. **Generate Applications**:
   - Open a job ticket
   - Click "Generate CV & Cover Letter"
   - Download your tailored documents

## Common Issues

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check connection string format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### Prisma Migration Fails
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create manually
npx prisma db push
```

### Claude API Errors
- Check your API key is valid
- Verify you have credits in Anthropic console
- Review rate limits

### Email Not Sending
- Verify email domain in Resend dashboard
- Check `FROM_EMAIL` matches verified domain
- Review Resend logs for errors

## Next Steps

- Read [README.md](./README.md) for complete documentation
- Review [SPECIFICATION.md](./SPECIFICATION.md) for technical details
- Check [Example Files](../raw_examples/) for reference
- Customize preferences and scoring thresholds
- Set up actual job board integrations (see README)

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Vercel automatically handles:
- Daily cron jobs (6 AM timezone)
- Serverless functions
- Auto-scaling

### Other Platforms

See README.md for deployment on other platforms.

## Support

Need help? Check:
- 📖 Full documentation in [README.md](./README.md)
- 🐛 Troubleshooting section in README
- 📋 API documentation in README
- 🔧 Configuration options in README

---

**Happy job hunting! 🎯**

