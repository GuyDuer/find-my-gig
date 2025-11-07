# ✅ Vercel Deployment Checklist

## Quick Reference Guide

### Pre-Deployment

- [ ] Code is tested locally
- [ ] `.env` file has all required variables
- [ ] Database is accessible
- [ ] Anthropic API key is valid
- [ ] Resend API key is valid
- [ ] All features work locally

### GitHub Setup

```bash
# 1. Initialize git
cd /Users/guy.duer/find_my_gig
git init

# 2. Add files
git add .
git commit -m "Initial commit"

# 3. Create repo on GitHub
# Go to github.com/new

# 4. Push code
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Vercel Import

- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import your GitHub repository
- [ ] **Set Root Directory to: `app`**
- [ ] Framework: Next.js (auto-detected)
- [ ] Keep default build settings

### Environment Variables

Copy these into Vercel (Settings → Environment Variables):

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://your-app.vercel.app
CRON_SECRET=<optional: openssl rand -base64 32>
```

### Database Setup

Option A: Vercel Postgres (Recommended)
- [ ] Storage → Create Database → Postgres
- [ ] Auto-adds DATABASE_URL

Option B: External Database
- [ ] Add `?sslmode=require` to DATABASE_URL
- [ ] Ensure accessible from Vercel IPs

### Deploy

- [ ] Click "Deploy" button
- [ ] Wait 2-3 minutes
- [ ] Check deployment logs for errors

### Post-Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
cd app
vercel link

# 4. Pull env vars
vercel env pull .env.local

# 5. Run migrations
npx prisma migrate deploy

# 6. Seed database (optional)
npm run prisma:seed
```

### Verification

Test these at `https://your-app.vercel.app`:

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] CV upload works
- [ ] Preferences can be created
- [ ] Dashboard loads
- [ ] Settings page works

Test cron job:
```bash
curl https://your-app.vercel.app/api/cron/scan-jobs -X POST
```

### Production Checklist

- [ ] Custom domain added (optional)
- [ ] Email domain verified in Resend
- [ ] Update NEXTAUTH_URL to custom domain
- [ ] Update APP_URL to custom domain
- [ ] Cron job running (check Vercel Logs)
- [ ] Error tracking enabled (optional)
- [ ] Monitoring setup

## Quick Fixes

### Build Failed
1. Check Vercel build logs
2. Verify Root Directory is set to `app`
3. Check all dependencies are in package.json
4. Redeploy

### Database Connection Error
1. Verify DATABASE_URL format
2. Add `?sslmode=require` for hosted databases
3. Check database is running
4. Test connection locally first

### Cron Not Running
1. Vercel Dashboard → Logs → Filter by "Cron"
2. Check `app/vercel.json` exists
3. Manually trigger to test

### Email Not Sending
1. Verify FROM_EMAIL domain in Resend
2. Check Resend dashboard logs
3. Use `onboarding@resend.dev` for testing

## Support

- Full guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Installation: [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- Troubleshooting: [app/README.md](./app/README.md)

---

**Estimated Time**: 15-30 minutes

**Your app is ready to deploy!** 🚀

