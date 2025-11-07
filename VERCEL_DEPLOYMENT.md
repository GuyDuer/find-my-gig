# 🚀 Vercel Deployment Guide

## Quick Deployment Steps

### Step 1: Push to GitHub

```bash
cd /Users/guy.duer/find_my_gig

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Find My Gig app"

# Create GitHub repo and push
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. **IMPORTANT**: Configure these settings:
   - **Root Directory**: `app`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (default is fine)
   - **Output Directory**: `.next` (default is fine)
   - **Install Command**: `npm install` (default is fine)

### Step 3: Configure Environment Variables

In the Vercel dashboard, add these environment variables:

#### Required Variables

```bash
# Database (use Vercel Postgres or external)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret

# Auth URL (will be your Vercel domain)
NEXTAUTH_URL=https://your-app.vercel.app

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key

# Resend API
RESEND_API_KEY=re_your-key
FROM_EMAIL=noreply@yourdomain.com

# App URL (same as NEXTAUTH_URL)
APP_URL=https://your-app.vercel.app

# Optional: Cron job security
CRON_SECRET=your-secret-here
```

### Step 4: Add Vercel Postgres (Recommended)

1. In your Vercel project dashboard
2. Go to "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Click "Create"
6. Vercel will automatically add `DATABASE_URL` to your environment variables

### Step 5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Your app will be live at `https://your-app.vercel.app`

### Step 6: Run Database Migrations

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
cd /Users/guy.duer/find_my_gig/app
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run prisma:seed
```

## ✅ Verification Checklist

After deployment, test these features:

- [ ] Can access the app at your Vercel URL
- [ ] Can sign up for a new account
- [ ] Can sign in with credentials
- [ ] Can upload CV (DOCX file)
- [ ] Can create preferences
- [ ] Can view dashboard/board
- [ ] Cron job is scheduled (check Vercel Logs)
- [ ] Can manually trigger cron: `curl https://your-app.vercel.app/api/cron/scan-jobs -X POST`

## 🔧 Configuration Details

### Cron Job

The cron job is automatically configured via `app/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scan-jobs",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6 AM UTC. To change the schedule:
- `0 6 * * *` = 6 AM UTC every day
- `0 */6 * * *` = Every 6 hours
- `0 8 * * 1-5` = 8 AM UTC weekdays only

### Custom Domain (Optional)

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update these environment variables:
   - `NEXTAUTH_URL=https://yourdomain.com`
   - `APP_URL=https://yourdomain.com`

### Email Domain Verification

For production emails:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain
3. Add DNS records:
   - SPF record
   - DKIM record
4. Wait for verification
5. Update `FROM_EMAIL=noreply@yourdomain.com`

## 🐛 Common Issues

### Build Fails

**Error: "Prisma client not generated"**
```bash
# Already handled by build script
# Verify package.json has: "build": "prisma generate && next build"
```

**Error: "Module not found"**
```bash
# Clear build cache in Vercel dashboard
# Redeploy
```

### Database Connection Issues

**Error: "Can't reach database"**
- Verify `DATABASE_URL` includes `?sslmode=require` for hosted databases
- Check database is accessible from Vercel IP ranges
- Use Vercel Postgres for best compatibility

### Cron Job Not Running

**Check Logs:**
1. Go to Vercel dashboard
2. Click "Logs"
3. Filter by "Cron"
4. Verify executions

**Manual Test:**
```bash
curl https://your-app.vercel.app/api/cron/scan-jobs \
  -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Email Not Sending

- Verify `FROM_EMAIL` domain is verified in Resend
- Check Resend dashboard for error logs
- Use `onboarding@resend.dev` for testing

## 📊 Monitoring

### Vercel Analytics

1. Enable in project settings
2. Track page views and performance
3. Monitor Web Vitals

### Database Monitoring

```bash
# View database usage
vercel postgres -- psql

# Check connection count
SELECT count(*) FROM pg_stat_activity;
```

### Error Tracking (Optional)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 💰 Cost Estimate

### Vercel
- **Hobby Plan**: Free
  - 100GB bandwidth/month
  - Unlimited deployments
  - 1 concurrent build
  - Cron jobs included

- **Pro Plan**: $20/month
  - 1TB bandwidth
  - 12 concurrent builds
  - Team collaboration
  - Advanced analytics

### Vercel Postgres
- **Free Tier**: 256MB storage, 60 compute hours/month
- **Pro**: $20/month for 512MB storage

### Total Estimated Cost
- **Development**: $0/month (free tiers)
- **Production**: $5-50/month (depending on usage)

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use Vercel's environment variable encryption
- Rotate secrets regularly

### Database
- Enable SSL connections
- Use read replicas for scaling
- Regular backups (automatic with Vercel Postgres)

### API Security
- Enable CORS restrictions
- Rate limit API endpoints (consider Vercel Edge Functions)
- Use CRON_SECRET for cron endpoint

## 🚀 Production Optimizations

### Performance

1. **Enable Edge Functions** (optional):
```typescript
// app/api/route.ts
export const runtime = 'edge';
```

2. **Add Caching**:
```typescript
export const revalidate = 3600; // Cache for 1 hour
```

3. **Optimize Images**:
```typescript
import Image from 'next/image';
// Next.js automatically optimizes images
```

### Scaling

- **Database**: Use connection pooling with Prisma Data Proxy
- **API**: Edge Functions for better global performance
- **Static Assets**: Automatically on Vercel CDN

## 📈 Post-Deployment

### Week 1
- [ ] Monitor error logs daily
- [ ] Verify cron jobs are running
- [ ] Check email delivery rates
- [ ] Test all user flows

### Week 2-4
- [ ] Implement actual job board integrations
- [ ] Add monitoring/alerting
- [ ] Optimize database queries
- [ ] Add rate limiting

### Ongoing
- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Feature enhancements
- [ ] User feedback incorporation

## 🎯 Success Metrics

Track these in Vercel Analytics:
- User signups
- CV uploads
- Tickets created
- Document generations
- Email open rates
- Page load times
- Error rates

---

**Your app is Vercel-ready! No code changes needed.** Just follow the steps above.

**Questions?** Check [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) for troubleshooting.
