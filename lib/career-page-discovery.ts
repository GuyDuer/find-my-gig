import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabaseAdmin, Company } from './supabase';

const TIMEOUT = 10000; // 10 seconds
const USER_AGENT = 'JobScanner/1.0 (Personal Project)';

interface DiscoveryResult {
  careerPageUrl: string | null;
  careerPageType: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'custom' | 'unknown';
  scrapeConfig: Record<string, any>;
  status: 'found' | 'not_found' | 'error';
  message?: string;
}

/**
 * Common career page URL patterns to try
 */
const CAREER_URL_PATTERNS = [
  '/careers',
  '/jobs',
  '/careers/jobs',
  '/about/careers',
  '/company/careers',
  '/work-with-us',
  '/join-us',
  '/opportunities',
  '/career',
  '/join',
  '/hiring',
];

/**
 * Normalize URL by ensuring it has a protocol
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extract base URL from a company website
 */
function getBaseUrl(website: string): string | null {
  try {
    const normalized = normalizeUrl(website);
    const url = new URL(normalized);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a known ATS platform
 */
function detectATSPlatform(url: string, html: string): { 
  type: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'custom' | 'unknown';
  scrapeConfig: Record<string, any>;
} {
  const lowerUrl = url.toLowerCase();
  const $ = cheerio.load(html);

  // Greenhouse
  if (lowerUrl.includes('greenhouse.io') || lowerUrl.includes('boards.greenhouse.io')) {
    return {
      type: 'greenhouse',
      scrapeConfig: {
        jobItemSelector: '.opening',
        titleSelector: 'a',
        urlSelector: 'a',
        locationSelector: '.location',
        paginationType: 'none',
      },
    };
  }

  // Lever
  if (lowerUrl.includes('lever.co') || lowerUrl.includes('jobs.lever.co')) {
    return {
      type: 'lever',
      scrapeConfig: {
        jobItemSelector: '.posting',
        titleSelector: '.posting-title h5',
        urlSelector: 'a.posting-btn-submit',
        locationSelector: '.posting-categories .location',
        paginationType: 'none',
      },
    };
  }

  // Workday
  if (lowerUrl.includes('myworkdayjobs.com') || html.includes('workday')) {
    return {
      type: 'workday',
      scrapeConfig: {
        note: 'Workday requires JavaScript, may need manual configuration',
        paginationType: 'none',
      },
    };
  }

  // Ashby
  if (lowerUrl.includes('ashbyhq.com') || html.includes('ashby')) {
    return {
      type: 'ashby',
      scrapeConfig: {
        jobItemSelector: '[class*="job-posting"]',
        paginationType: 'none',
      },
    };
  }

  // Try to detect generic job listings
  const possibleSelectors = [
    '.job-listing',
    '.job-item',
    '.position',
    '.opening',
    '.career-item',
    '[class*="job"]',
    '[class*="position"]',
    '[class*="career"]',
  ];

  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      return {
        type: 'custom',
        scrapeConfig: {
          jobItemSelector: selector,
          note: 'Auto-detected, may need manual refinement',
          paginationType: 'unknown',
        },
      };
    }
  }

  return {
    type: 'unknown',
    scrapeConfig: {
      note: 'Could not auto-detect job listings structure',
    },
  };
}

/**
 * Try to fetch a URL and check if it's a valid career page
 */
async function tryCareerUrl(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Check if page likely contains job listings
    const text = $('body').text().toLowerCase();
    const hasJobKeywords = 
      text.includes('job') ||
      text.includes('career') ||
      text.includes('position') ||
      text.includes('opening') ||
      text.includes('opportunit');

    if (hasJobKeywords) {
      return { success: true, html };
    } else {
      return { success: false, error: 'Page does not appear to contain job listings' };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.status === 404 ? 'Page not found' : error.message 
    };
  }
}

/**
 * Discover career page for a single company
 */
export async function discoverCareerPage(company: Company): Promise<DiscoveryResult> {
  const website = company.website || company.domain;
  
  if (!website) {
    return {
      careerPageUrl: null,
      careerPageType: 'unknown',
      scrapeConfig: {},
      status: 'not_found',
      message: 'No website or domain available',
    };
  }

  const baseUrl = getBaseUrl(website);
  if (!baseUrl) {
    return {
      careerPageUrl: null,
      careerPageType: 'unknown',
      scrapeConfig: {},
      status: 'error',
      message: 'Invalid website URL',
    };
  }

  console.log(`Discovering career page for ${company.name}...`);

  // Try each pattern
  for (const pattern of CAREER_URL_PATTERNS) {
    const testUrl = `${baseUrl}${pattern}`;
    console.log(`  Trying: ${testUrl}`);

    const result = await tryCareerUrl(testUrl);
    
    if (result.success && result.html) {
      const detection = detectATSPlatform(testUrl, result.html);
      console.log(`  ✓ Found career page at ${testUrl} (${detection.type})`);
      
      return {
        careerPageUrl: testUrl,
        careerPageType: detection.type,
        scrapeConfig: detection.scrapeConfig,
        status: 'found',
        message: `Found at ${pattern}`,
      };
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`  ✗ No career page found for ${company.name}`);

  return {
    careerPageUrl: null,
    careerPageType: 'unknown',
    scrapeConfig: {},
    status: 'not_found',
    message: 'Tried all common patterns without success',
  };
}

/**
 * Discover career pages for multiple companies
 */
export async function discoverCareerPages(companies: Company[]): Promise<void> {
  console.log(`Starting career page discovery for ${companies.length} companies...`);
  console.log('---');

  let found = 0;
  let notFound = 0;
  let errors = 0;

  for (const company of companies) {
    try {
      const result = await discoverCareerPage(company);

      // Update company in database
      await supabaseAdmin
        .from('companies')
        .update({
          career_page_url: result.careerPageUrl,
          career_page_type: result.careerPageType,
          scrape_config: result.scrapeConfig,
          discovery_status: result.status,
          last_discovery_attempt: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (result.status === 'found') found++;
      else if (result.status === 'not_found') notFound++;
      else errors++;

      // Rate limiting: wait between companies
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`Error discovering career page for ${company.name}:`, error.message);
      errors++;

      // Update with error status
      await supabaseAdmin
        .from('companies')
        .update({
          discovery_status: 'error',
          last_discovery_attempt: new Date().toISOString(),
        })
        .eq('id', company.id);
    }
  }

  console.log('---');
  console.log('Career page discovery complete!');
  console.log(`Found: ${found}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log(`Success rate: ${((found / companies.length) * 100).toFixed(1)}%`);
}

/**
 * Rediscover career pages for companies that don't have one
 */
export async function rediscoverMissingCareerPages(): Promise<void> {
  const { data: companies, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .is('career_page_url', null)
    .eq('active', true)
    .limit(50); // Limit to avoid long runs

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  if (!companies || companies.length === 0) {
    console.log('No companies need career page discovery');
    return;
  }

  await discoverCareerPages(companies);
}

