import { Job } from './supabase';

/**
 * Comprehensive keyword lists for job filtering
 */
const KEYWORDS = {
  // Revenue Operations
  revops: [
    'revenue operations',
    'revops',
    'rev ops',
    'sales operations',
    'sales ops',
    'marketing operations',
    'marketing ops',
    'go-to-market operations',
    'gtm operations',
    'commercial operations',
  ],
  
  // Business Operations
  operations: [
    'business operations',
    'bizops',
    'biz ops',
    'operations manager',
    'operations lead',
    'operations director',
    'ops lead',
    'ops manager',
    'ops director',
    'chief operating officer',
    'coo',
    'head of operations',
    'vp operations',
    'vp of operations',
  ],
  
  // Program Management
  programManagement: [
    'program manager',
    'programme manager',
    'program management',
    'technical program manager',
    'tpm',
    'project manager',
    'pmo',
    'project management office',
    'delivery manager',
    'program lead',
    'program director',
    'portfolio manager',
  ],
  
  // Strategic Roles
  strategic: [
    'strategy and operations',
    'strategy & operations',
    'strategic operations',
    'chief of staff',
    'cos',
    'business partner',
    'strategic initiatives',
    'transformation',
    'business transformation',
  ],
  
  // Product Operations
  productOps: [
    'product operations',
    'productops',
    'product ops',
  ],
  
  // Customer Operations
  customerOps: [
    'customer operations',
    'customer success operations',
    'cs operations',
    'cs ops',
    'customer ops',
  ],
  
  // Analytics & Data Operations
  analyticsOps: [
    'analytics operations',
    'data operations',
    'dataops',
    'business intelligence',
    'bi operations',
  ],
  
  // General Ops
  general: [
    'operational excellence',
    'process optimization',
    'process improvement',
    'operational efficiency',
  ],
};

// Flatten all keywords into a single array
const ALL_KEYWORDS = [
  ...KEYWORDS.revops,
  ...KEYWORDS.operations,
  ...KEYWORDS.programManagement,
  ...KEYWORDS.strategic,
  ...KEYWORDS.productOps,
  ...KEYWORDS.customerOps,
  ...KEYWORDS.analyticsOps,
  ...KEYWORDS.general,
];

/**
 * Check if text contains any of the keywords
 */
function containsKeywords(text: string | null, keywords: string[]): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    
    // Word boundary check for better matching
    const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Get which keyword categories matched
 */
function getMatchedCategories(text: string | null): string[] {
  const matched: string[] = [];
  
  if (containsKeywords(text, KEYWORDS.revops)) matched.push('RevOps');
  if (containsKeywords(text, KEYWORDS.operations)) matched.push('Operations');
  if (containsKeywords(text, KEYWORDS.programManagement)) matched.push('Program Management');
  if (containsKeywords(text, KEYWORDS.strategic)) matched.push('Strategic');
  if (containsKeywords(text, KEYWORDS.productOps)) matched.push('Product Ops');
  if (containsKeywords(text, KEYWORDS.customerOps)) matched.push('Customer Ops');
  if (containsKeywords(text, KEYWORDS.analyticsOps)) matched.push('Analytics Ops');
  if (containsKeywords(text, KEYWORDS.general)) matched.push('General Ops');
  
  return matched;
}

/**
 * Filter a single job based on keywords
 */
export function filterJob(job: Job): { 
  passes: boolean; 
  matchedCategories: string[];
  matchConfidence: 'high' | 'medium' | 'low';
} {
  const titleMatches = containsKeywords(job.title, ALL_KEYWORDS);
  const descriptionMatches = containsKeywords(job.description, ALL_KEYWORDS);
  
  const passes = titleMatches || descriptionMatches;
  
  if (!passes) {
    return { passes: false, matchedCategories: [], matchConfidence: 'low' };
  }
  
  // Determine confidence based on where matches were found
  let matchConfidence: 'high' | 'medium' | 'low' = 'low';
  
  if (titleMatches && descriptionMatches) {
    matchConfidence = 'high';
  } else if (titleMatches) {
    matchConfidence = 'high'; // Title match is strong signal
  } else if (descriptionMatches) {
    matchConfidence = 'medium'; // Description match is moderate signal
  }
  
  const matchedCategories = getMatchedCategories(`${job.title} ${job.description}`);
  
  return { passes, matchedCategories, matchConfidence };
}

/**
 * Filter multiple jobs
 */
export function filterJobs(jobs: Job[]): {
  filtered: Job[];
  rejected: Job[];
  stats: {
    total: number;
    passed: number;
    rejected: number;
    passRate: number;
  };
} {
  const filtered: Job[] = [];
  const rejected: Job[] = [];
  
  for (const job of jobs) {
    const result = filterJob(job);
    
    if (result.passes) {
      filtered.push(job);
    } else {
      rejected.push(job);
    }
  }
  
  const stats = {
    total: jobs.length,
    passed: filtered.length,
    rejected: rejected.length,
    passRate: jobs.length > 0 ? (filtered.length / jobs.length) * 100 : 0,
  };
  
  console.log(`Keyword filter: ${stats.passed}/${stats.total} jobs passed (${stats.passRate.toFixed(1)}%)`);
  
  return { filtered, rejected, stats };
}

/**
 * Get keyword statistics for a job
 */
export function getJobKeywordStats(job: Job): {
  matchedKeywords: string[];
  matchedCategories: string[];
  titleMatches: string[];
  descriptionMatches: string[];
} {
  const matchedKeywords: string[] = [];
  const titleMatches: string[] = [];
  const descriptionMatches: string[] = [];
  
  const titleLower = job.title?.toLowerCase() || '';
  const descLower = job.description?.toLowerCase() || '';
  
  for (const keyword of ALL_KEYWORDS) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    if (regex.test(titleLower)) {
      matchedKeywords.push(keyword);
      titleMatches.push(keyword);
    } else if (regex.test(descLower)) {
      matchedKeywords.push(keyword);
      descriptionMatches.push(keyword);
    }
  }
  
  const matchedCategories = getMatchedCategories(`${job.title} ${job.description}`);
  
  return {
    matchedKeywords: [...new Set(matchedKeywords)], // Remove duplicates
    matchedCategories,
    titleMatches,
    descriptionMatches,
  };
}

/**
 * Export keywords for reference
 */
export { KEYWORDS, ALL_KEYWORDS };

