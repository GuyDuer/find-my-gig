import { supabaseAdmin, Job } from './supabase';
import { ScrapedJob } from './job-scraper';

export interface DiffResult {
  newJobs: ScrapedJob[];
  updatedJobs: Array<{ scraped: ScrapedJob; existing: Job }>;
  unchangedJobs: Job[];
  removedJobs: Job[];
  stats: {
    total: number;
    new: number;
    updated: number;
    unchanged: number;
    removed: number;
  };
}

/**
 * Compare scraped jobs against database and determine changes
 */
export async function diffJobs(
  companyId: string,
  scrapedJobs: ScrapedJob[]
): Promise<DiffResult> {
  console.log(`Diffing ${scrapedJobs.length} scraped jobs for company ${companyId}...`);

  // Fetch existing jobs for this company
  const { data: existingJobs, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching existing jobs:', error);
    throw error;
  }

  const existingJobsMap = new Map<string, Job>();
  for (const job of existingJobs || []) {
    existingJobsMap.set(job.job_key, job);
  }

  const newJobs: ScrapedJob[] = [];
  const updatedJobs: Array<{ scraped: ScrapedJob; existing: Job }> = [];
  const unchangedJobs: Job[] = [];
  const scrapedJobKeys = new Set<string>();

  // Compare scraped jobs against existing
  for (const scrapedJob of scrapedJobs) {
    scrapedJobKeys.add(scrapedJob.jobKey);
    const existing = existingJobsMap.get(scrapedJob.jobKey);

    if (!existing) {
      // New job
      newJobs.push(scrapedJob);
    } else if (existing.content_hash !== scrapedJob.contentHash) {
      // Job content changed
      updatedJobs.push({ scraped: scrapedJob, existing });
    } else {
      // Job unchanged (but update last_seen_at)
      unchangedJobs.push(existing);
    }
  }

  // Find jobs that were not in the scraped results
  const removedJobs: Job[] = [];
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  for (const existing of existingJobs || []) {
    if (!scrapedJobKeys.has(existing.job_key) && existing.status === 'active') {
      // Job not found in latest scrape
      const lastSeen = new Date(existing.last_seen_at);
      
      // Only mark as removed if not seen for more than 48 hours
      if (lastSeen < twoDaysAgo) {
        removedJobs.push(existing);
      }
    }
  }

  const stats = {
    total: scrapedJobs.length,
    new: newJobs.length,
    updated: updatedJobs.length,
    unchanged: unchangedJobs.length,
    removed: removedJobs.length,
  };

  console.log(`Diff results:`, stats);

  return {
    newJobs,
    updatedJobs,
    unchangedJobs,
    removedJobs,
    stats,
  };
}

/**
 * Apply diff results to database
 */
export async function applyDiff(
  companyId: string,
  diffResult: DiffResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Insert new jobs
    if (diffResult.newJobs.length > 0) {
      const newJobRecords = diffResult.newJobs.map(job => ({
        company_id: companyId,
        job_key: job.jobKey,
        title: job.title,
        url: job.url,
        location: job.location,
        description: job.description,
        employment_type: job.employmentType,
        posted_date: job.postedDate,
        content_hash: job.contentHash,
        status: 'active',
        raw_html: job.rawHtml,
        first_seen_at: now,
        last_seen_at: now,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('jobs')
        .insert(newJobRecords);

      if (insertError) {
        console.error('Error inserting new jobs:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${diffResult.newJobs.length} new jobs`);
    }

    // Update changed jobs
    if (diffResult.updatedJobs.length > 0) {
      for (const { scraped, existing } of diffResult.updatedJobs) {
        const { error: updateError } = await supabaseAdmin
          .from('jobs')
          .update({
            title: scraped.title,
            url: scraped.url,
            location: scraped.location,
            description: scraped.description,
            employment_type: scraped.employmentType,
            posted_date: scraped.postedDate,
            content_hash: scraped.contentHash,
            raw_html: scraped.rawHtml,
            last_seen_at: now,
            updated_at: now,
            status: 'active', // Reactivate if it was removed
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`Error updating job ${existing.id}:`, updateError);
        }
      }

      console.log(`Updated ${diffResult.updatedJobs.length} jobs`);
    }

    // Update last_seen_at for unchanged jobs
    if (diffResult.unchangedJobs.length > 0) {
      const unchangedIds = diffResult.unchangedJobs.map(job => job.id);

      const { error: touchError } = await supabaseAdmin
        .from('jobs')
        .update({ last_seen_at: now })
        .in('id', unchangedIds);

      if (touchError) {
        console.error('Error updating last_seen_at for unchanged jobs:', touchError);
      }

      console.log(`Updated last_seen_at for ${diffResult.unchangedJobs.length} unchanged jobs`);
    }

    // Mark removed jobs
    if (diffResult.removedJobs.length > 0) {
      const removedIds = diffResult.removedJobs.map(job => job.id);

      const { error: removeError } = await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'removed',
          updated_at: now,
        })
        .in('id', removedIds);

      if (removeError) {
        console.error('Error marking jobs as removed:', removeError);
      }

      console.log(`Marked ${diffResult.removedJobs.length} jobs as removed`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error applying diff:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get jobs that need scoring (new or updated, without scores)
 */
export async function getJobsNeedingScoring(companyId?: string): Promise<Job[]> {
  let query = supabaseAdmin
    .from('jobs')
    .select(`
      *,
      job_scores(id)
    `)
    .eq('status', 'active');

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data: jobs, error } = await query;

  if (error) {
    console.error('Error fetching jobs needing scoring:', error);
    return [];
  }

  // Filter to only jobs without scores
  const jobsNeedingScoring = (jobs || []).filter((job: any) => {
    return !job.job_scores || job.job_scores.length === 0;
  });

  console.log(`Found ${jobsNeedingScoring.length} jobs needing scoring`);
  return jobsNeedingScoring as Job[];
}

