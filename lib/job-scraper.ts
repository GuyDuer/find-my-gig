import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { Company } from './supabase';

const TIMEOUT = 10000; // 10 seconds
const USER_AGENT = 'JobScanner/1.0 (Personal Project)';
const MAX_PAGES = 5;
const MAX_RETRIES = 3;

export interface ScrapedJob {
  jobKey: string;
  title: string;
  url: string;
  location: string | null;
  description: string | null;
  employmentType: string | null;
  postedDate: string | null;
  contentHash: string;
  rawHtml: string | null;
}

/**
 * Generate a unique job key from URL or title
 */
function generateJobKey(url: string, title: string, companyId: string): string {
  // Try to extract ID from URL
  const urlMatch = url.match(/\/(\d+)$/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Generate hash from URL or title
  const source = url || `${companyId}-${title}`;
  return crypto
    .createHash('md5')
    .update(source)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Calculate content hash for change detection
 */
function calculateContentHash(job: Partial<ScrapedJob>): string {
  const content = `${job.title}|${job.location}|${job.description}`;
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Fetch HTML with retries and error handling
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        maxRedirects: 5,
      });

      return response.data;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`Failed to fetch ${url} after ${retries} attempts:`, error.message);
        return null;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Extract jobs from Greenhouse
 */
function scrapeGreenhouse($: cheerio.CheerioAPI, baseUrl: string): Partial<ScrapedJob>[] {
  const jobs: Partial<ScrapedJob>[] = [];

  $('.opening').each((_, element) => {
    const $el = $(element);
    const $link = $el.find('a');
    
    const title = $link.text().trim();
    const relativeUrl = $link.attr('href');
    const url = relativeUrl ? new URL(relativeUrl, baseUrl).toString() : '';
    const location = $el.find('.location').text().trim() || null;

    if (title && url) {
      jobs.push({ title, url, location });
    }
  });

  return jobs;
}

/**
 * Extract jobs from Lever
 */
function scrapeLever($: cheerio.CheerioAPI, baseUrl: string): Partial<ScrapedJob>[] {
  const jobs: Partial<ScrapedJob>[] = [];

  $('.posting').each((_, element) => {
    const $el = $(element);
    
    const title = $el.find('.posting-title h5').text().trim();
    const $link = $el.find('a.posting-btn-submit');
    const url = $link.attr('href') || '';
    const location = $el.find('.posting-categories .location').text().trim() || null;

    if (title && url) {
      jobs.push({ title, url, location });
    }
  });

  return jobs;
}

/**
 * Extract jobs using custom config
 */
function scrapeCustom($: cheerio.CheerioAPI, baseUrl: string, config: Record<string, any>): Partial<ScrapedJob>[] {
  const jobs: Partial<ScrapedJob>[] = [];

  if (!config.jobItemSelector) {
    return jobs;
  }

  $(config.jobItemSelector).each((_, element) => {
    const $el = $(element);
    
    let title = '';
    let url = '';
    let location = null;

    // Extract title
    if (config.titleSelector) {
      title = $el.find(config.titleSelector).text().trim();
    } else {
      // Try common patterns
      title = $el.find('h2, h3, .title, .job-title').first().text().trim();
    }

    // Extract URL
    if (config.urlSelector) {
      url = $el.find(config.urlSelector).attr('href') || '';
    } else {
      url = $el.find('a').first().attr('href') || '';
    }

    // Make URL absolute
    if (url && !url.startsWith('http')) {
      url = new URL(url, baseUrl).toString();
    }

    // Extract location
    if (config.locationSelector) {
      location = $el.find(config.locationSelector).text().trim() || null;
    } else {
      location = $el.find('.location, .job-location, [class*="location"]').first().text().trim() || null;
    }

    if (title && url) {
      jobs.push({ title, url, location });
    }
  });

  return jobs;
}

/**
 * Scrape jobs from a career page
 */
export async function scrapeJobs(company: Company): Promise<ScrapedJob[]> {
  if (!company.career_page_url) {
    console.log(`No career page URL for ${company.name}`);
    return [];
  }

  console.log(`Scraping jobs for ${company.name} from ${company.career_page_url}...`);

  const html = await fetchWithRetry(company.career_page_url);
  if (!html) {
    console.error(`Failed to fetch career page for ${company.name}`);
    return [];
  }

  const $ = cheerio.load(html);
  const baseUrl = company.career_page_url;

  let partialJobs: Partial<ScrapedJob>[] = [];

  // Extract jobs based on platform type
  switch (company.career_page_type) {
    case 'greenhouse':
      partialJobs = scrapeGreenhouse($, baseUrl);
      break;
    case 'lever':
      partialJobs = scrapeLever($, baseUrl);
      break;
    case 'custom':
      partialJobs = scrapeCustom($, baseUrl, company.scrape_config || {});
      break;
    default:
      // Try generic extraction
      partialJobs = scrapeCustom($, baseUrl, {
        jobItemSelector: '.job-listing, .job-item, .position, .opening, [class*="job"]',
      });
  }

  console.log(`  Found ${partialJobs.length} job listings`);

  // Enrich with additional details
  const enrichedJobs: ScrapedJob[] = [];

  for (const partialJob of partialJobs) {
    if (!partialJob.title || !partialJob.url) continue;

    // Try to fetch job details
    let description = null;
    let rawHtml = null;

    try {
      const jobHtml = await fetchWithRetry(partialJob.url);
      if (jobHtml) {
        const $job = cheerio.load(jobHtml);
        
        // Extract description (try multiple selectors)
        const descriptionSelectors = [
          '.job-description',
          '.description',
          '[class*="description"]',
          '.content',
          'main',
        ];

        for (const selector of descriptionSelectors) {
          const text = $job(selector).first().text().trim();
          if (text.length > 100) {
            description = text.substring(0, 5000); // Limit to 5000 chars
            break;
          }
        }

        // Store limited raw HTML (first 10KB)
        rawHtml = jobHtml.substring(0, 10000);
      }
    } catch (error: any) {
      console.error(`  Error fetching job details for ${partialJob.url}:`, error.message);
    }

    // Wait between job detail requests
    await new Promise(resolve => setTimeout(resolve, 500));

    const job: ScrapedJob = {
      jobKey: generateJobKey(partialJob.url, partialJob.title, company.id),
      title: partialJob.title,
      url: partialJob.url,
      location: partialJob.location || null,
      description,
      employmentType: null, // Could extract from description if needed
      postedDate: null, // Could extract if available
      contentHash: '',
      rawHtml,
    };

    job.contentHash = calculateContentHash(job);
    enrichedJobs.push(job);
  }

  console.log(`  Enriched ${enrichedJobs.length} jobs with details`);
  return enrichedJobs;
}

/**
 * Scrape jobs with pagination support
 */
export async function scrapeJobsWithPagination(company: Company): Promise<ScrapedJob[]> {
  // For now, most career pages don't need pagination or have it built into their platform
  // This can be extended in the future
  return scrapeJobs(company);
}

