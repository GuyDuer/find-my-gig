# Find My Gig - Technical Specification

## Overview

This document provides a detailed technical specification of the Find My Gig application, implementing the requirements from the original prompt v2.1.

## Architecture

### System Components

1. **Frontend (Next.js App Router)**
   - Server-side rendered pages with client components
   - Real-time updates via client-side data fetching
   - Responsive design with Tailwind CSS

2. **Backend (Next.js API Routes)**
   - RESTful API endpoints
   - Server-side business logic
   - Database operations via Prisma ORM

3. **Database (PostgreSQL)**
   - Relational data model
   - Row-level security via application logic
   - Efficient indexing for performance

4. **AI Integration (Claude Sonnet 4.5)**
   - Job data extraction
   - Fit scoring
   - CV generation
   - Cover letter writing

5. **Email Service (Resend)**
   - Daily digest emails
   - High-fit notifications
   - HTML email templates

6. **Cron Service (Vercel Cron)**
   - Daily job scanning
   - Automated email digests

## Scoring Algorithm

### Implementation

```
User → Job Score (0-100):
- Compares CV content with JD requirements
- Based on skills, experience, qualifications match
- Never invents or assumes information

Job → User Score (0-100):
- Role taxonomy match (from preferences)
- Location match
- Company match (high-interest companies boost score)
- Unlisted companies lower score

Overall Score = min(0.6 × User→Job + 0.4 × Job→User, 100)
```

### Tag Generation Rules

```python
if user_to_job >= 90:
    tags.append("You're a High Fit!")

if job_to_user >= 90:
    tags.append("They're a High Fit for you!")

if user_to_job >= 90 and job_to_user >= 90:
    tags.append("That's a Match!")

if 70 <= user_to_job < 85:
    tags.append("Stretch Role")

if job_to_user < 60 and user_to_job >= 75:
    tags.append("Left Field")
```

## Data Flow

### Job Discovery Flow

1. **Cron Trigger** (6 AM Asia/Jerusalem)
2. **Scan All Users**: Get users with active scan configs
3. **For Each User**:
   - Merge active preferences (union logic)
   - Scrape/fetch jobs from sources
   - Extract job data via Claude
   - Calculate hash for deduplication
   - Score job fit
   - Create ticket if score ≥ threshold
   - Send high-fit notification if score ≥ 85
4. **Send Daily Digests**: Email summary to all users

### Application Generation Flow

1. **User Request**: Click "Generate CV & Cover Letter"
2. **Fetch Data**: Get user CV, job description, preferences
3. **Claude API Calls**:
   - Generate tailored CV (JSON structure)
   - Generate cover letter (plain text)
4. **Document Creation**:
   - Create DOCX from CV JSON
   - Create PDF from CV text
   - Format cover letter
5. **Save Artifacts**: Store in database
6. **Return**: Download links to user

## Security Measures

### Authentication
- Bcrypt password hashing (10 rounds)
- JWT session tokens via NextAuth
- Secure cookie storage

### Authorization
- Session validation on all protected routes
- User ID verification for data access
- No cross-user data leakage

### Input Validation
- Zod schemas for all API inputs
- File type verification for uploads
- SQL injection prevention via Prisma
- XSS protection via React

### API Security
- Rate limiting (implement via middleware)
- CORS configuration
- Environment variable protection
- Cron endpoint authentication

## Database Indexes

```prisma
// Optimized for common queries
@@index([userId]) // Quick user data lookups
@@index([active, postingDate]) // Active jobs sorting
@@index([userId, status]) // Ticket filtering
@@index([createdAt]) // Time-based queries
```

## Performance Optimizations

1. **Database**:
   - Efficient indexes on frequently queried fields
   - Pagination for large result sets
   - Selective field loading

2. **API**:
   - Minimal data transfer
   - Parallel processing where possible
   - Caching of static data

3. **Frontend**:
   - Server-side rendering for initial load
   - Client-side fetching for updates
   - Optimistic UI updates
   - Image and asset optimization

4. **AI**:
   - Structured prompts for consistent responses
   - Token limit management
   - Error handling and retries

## Limitations & Future Enhancements

### Current Limitations

1. **Job Scraping**: Placeholder implementation
2. **File Storage**: Database BLOB storage (consider cloud storage)
3. **Real-time Updates**: Polling-based (consider WebSockets)
4. **Analytics**: Basic metrics (consider advanced BI)

### Future Enhancements

1. **Job Sources**:
   - LinkedIn API integration
   - Indeed scraper
   - Company ATS integrations
   - RSS feed parsing

2. **Application Tracking**:
   - Email parsing for responses
   - Interview scheduling
   - Offer management
   - Salary negotiation tools

3. **AI Features**:
   - Interview preparation
   - Salary benchmarking
   - Company research
   - Network analysis

4. **Collaboration**:
   - Share applications with mentors
   - Team job search for couples
   - Recruiter marketplace

5. **Mobile**:
   - React Native app
   - Push notifications
   - Offline mode

## Compliance

### Data Privacy
- GDPR compliance ready
- User data export capability
- Right to be forgotten (delete account)
- Clear privacy policy needed

### Terms of Service
- No warranty on job board scraping
- User responsible for application accuracy
- AI-generated content is suggestive only

## Monitoring & Logging

### Application Logging
- Error tracking (implement Sentry)
- Performance monitoring
- User activity logs
- API usage metrics

### Alerts
- Failed cron jobs
- High error rates
- Database connection issues
- API quota warnings

## Testing Strategy

### Unit Tests
- Utility functions (CV parser, normalizer)
- Scoring logic
- Data transformations

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- User registration
- CV upload
- Job discovery
- Application generation

### Load Tests
- Concurrent users
- Cron job performance
- Database queries

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded (optional)
- [ ] API keys validated
- [ ] Email sending tested
- [ ] Cron job scheduled
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Monitoring setup
- [ ] Backup strategy defined

## Support & Maintenance

### Regular Tasks
- Monitor cron job execution
- Review error logs
- Update dependencies
- Optimize database queries
- Refresh job sources
- Update AI prompts

### User Support
- Email support channel
- FAQ documentation
- Video tutorials
- Community forum (future)

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Production Ready

