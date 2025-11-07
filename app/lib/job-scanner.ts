/**
 * Job Scanning Service
 * Handles daily job discovery and ticket creation
 */

import { prisma } from './prisma';
import { extractJobData, scoreJobFit } from './claude';
import { sendHighFitNotification } from './email';
import crypto from 'crypto';

interface ScanResult {
  jobsScanned: number;
  ticketsCreated: number;
  errors: string[];
}

/**
 * Mock job scraping function
 * In production, this would use actual scraping/API integrations
 */
async function scrapeJobs(): Promise<Array<{
  title: string;
  company: string;
  description: string;
  url: string;
  source: string;
}>> {
  // TODO: Implement actual job scraping logic
  // This is a placeholder that returns empty results
  // In production, integrate with job boards APIs:
  // - LinkedIn Jobs API
  // - Indeed API
  // - Glassdoor API
  // - Company career pages scraping
  
  console.log('Job scraping not yet implemented. Add API integrations here.');
  return [];
}

/**
 * Process a single job posting
 */
async function processJob(
  rawJob: {
    title: string;
    company: string;
    description: string;
    url: string;
    source: string;
  },
  userId: string,
  userCV: string,
  userPreferences: {
    roles: string[];
    locations: string[];
    companies: string[];
  },
  threshold: number
): Promise<boolean> {
  try {
    // Extract structured data from job description
    const jobData = await extractJobData(rawJob.description);

    // Create hash for deduplication
    const descriptionHash = crypto
      .createHash('md5')
      .update(jobData.description)
      .digest('hex');

    // Check if job already exists
    const existingJob = await prisma.job.findUnique({
      where: {
        title_company_descriptionHash: {
          title: jobData.title,
          company: jobData.company,
          descriptionHash,
        },
      },
    });

    let job;
    if (existingJob) {
      // Update existing job
      job = await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          active: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new job
      job = await prisma.job.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          descriptionHash,
          url: rawJob.url,
          locations: jobData.locations,
          roleTags: jobData.roleTags,
          workMode: jobData.workMode,
          postingDate: jobData.postingDate ? new Date(jobData.postingDate) : null,
          source: rawJob.source,
          rawData: rawJob as any,
          active: true,
        },
      });
    }

    // Check if ticket already exists for this user-job pair
    const existingTicket = await prisma.ticket.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    });

    if (existingTicket) {
      return false; // Already processed
    }

    // Score the job fit
    const scoring = await scoreJobFit(userCV, job.description, userPreferences, {
      title: job.title,
      company: job.company,
      locations: job.locations,
      roleTags: job.roleTags,
    });

    // Only create ticket if meets threshold
    if (scoring.overallScore < threshold) {
      return false;
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        jobId: job.id,
        status: 'IDENTIFIED',
        userToJobScore: scoring.userToJobScore,
        jobToUserScore: scoring.jobToUserScore,
        overallScore: scoring.overallScore,
        scoringExplanation: scoring.explanation,
        tags: scoring.tags,
      },
      include: {
        job: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'NEW_TICKET',
        title: `New Job Match: ${job.title}`,
        message: `${job.company} - Score: ${Math.round(scoring.overallScore)}`,
        data: {
          ticketId: ticket.id,
          jobId: job.id,
        },
      },
    });

    // Send high-fit notification if applicable
    if (scoring.overallScore >= 85) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        await sendHighFitNotification(user.email, user.name || 'User', {
          id: ticket.id,
          jobTitle: job.title,
          company: job.company,
          overallScore: scoring.overallScore,
          tags: scoring.tags,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
}

/**
 * Run job scan for a single user
 */
export async function scanJobsForUser(userId: string): Promise<ScanResult> {
  const result: ScanResult = {
    jobsScanned: 0,
    ticketsCreated: 0,
    errors: [],
  };

  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: { where: { active: true } },
        scanConfig: true,
      },
    });

    if (!user || !user.scanConfig?.enabled || !user.baseCV) {
      console.log(`Skipping scan for user ${userId}: not configured or CV missing`);
      return result;
    }

    // Check if snoozed
    if (user.scanConfig.snoozeUntil && new Date(user.scanConfig.snoozeUntil) > new Date()) {
      console.log(`Skipping scan for user ${userId}: snoozed until ${user.scanConfig.snoozeUntil}`);
      return result;
    }

    // Merge all active preferences (union logic)
    const allRoles = new Set<string>();
    const allLocations = new Set<string>();
    const allCompanies = new Set<string>();

    user.preferences.forEach((pref) => {
      pref.roles.forEach((role) => allRoles.add(role));
      pref.locations.forEach((loc) => allLocations.add(loc));
      pref.companies.forEach((comp) => allCompanies.add(comp));
    });

    const userPreferences = {
      roles: Array.from(allRoles),
      locations: Array.from(allLocations),
      companies: Array.from(allCompanies),
    };

    // Scrape jobs
    const rawJobs = await scrapeJobs();
    result.jobsScanned = rawJobs.length;

    // Process each job
    for (const rawJob of rawJobs) {
      try {
        const created = await processJob(
          rawJob,
          userId,
          user.baseCV,
          userPreferences,
          user.scanConfig.threshold
        );

        if (created) {
          result.ticketsCreated++;
        }
      } catch (error) {
        const errorMsg = `Error processing job ${rawJob.title} at ${rawJob.company}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // Update scan config
    await prisma.scanConfig.update({
      where: { id: user.scanConfig.id },
      data: {
        lastScanAt: new Date(),
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
      },
    });

    return result;
  } catch (error) {
    console.error(`Error scanning jobs for user ${userId}:`, error);
    result.errors.push(`Scan failed: ${error}`);
    return result;
  }
}

/**
 * Run job scan for all active users
 */
export async function scanJobsForAllUsers(): Promise<{
  usersScanned: number;
  totalTicketsCreated: number;
  errors: string[];
}> {
  const summary = {
    usersScanned: 0,
    totalTicketsCreated: 0,
    errors: [] as string[],
  };

  try {
    // Get all users with active scan configs
    const users = await prisma.user.findMany({
      where: {
        scanConfig: {
          enabled: true,
        },
      },
      select: { id: true },
    });

    for (const user of users) {
      const result = await scanJobsForUser(user.id);
      summary.usersScanned++;
      summary.totalTicketsCreated += result.ticketsCreated;
      summary.errors.push(...result.errors);
    }

    // Deactivate expired jobs
    await prisma.job.updateMany({
      where: {
        active: true,
        expiryDate: {
          lt: new Date(),
        },
      },
      data: {
        active: false,
      },
    });

    console.log('Job scan complete:', summary);
    return summary;
  } catch (error) {
    console.error('Error in scanJobsForAllUsers:', error);
    summary.errors.push(`Global scan error: ${error}`);
    return summary;
  }
}

