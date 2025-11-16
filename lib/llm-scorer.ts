import Anthropic from '@anthropic-ai/sdk';
import { Job, supabaseAdmin } from './supabase';
import { getLatestCV } from './cv-parser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 4096;
const BATCH_SIZE = 12; // Process 12 jobs per API call

export interface JobScore {
  jobId: string;
  isRelevant: boolean;
  matchScore: number;
  reasoning: string;
  keySkillsMatched: string[];
}

interface JobForScoring {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
}

/**
 * Build the system prompt for job scoring
 */
function buildSystemPrompt(): string {
  return `You are an expert job matching assistant. Your task is to evaluate job postings against a candidate's CV and determine relevance and fit.

For each job, you must return a JSON object with exactly these fields:
- job_id: string (the job ID provided)
- is_relevant: boolean (true if the job is a good match for the candidate)
- match_score: number (0-100, where 100 is perfect match)
- reasoning: string (2-3 sentences explaining your assessment)
- key_skills_matched: array of strings (3-5 specific skills or experiences from the CV that match this job)

Focus on:
1. Role alignment (RevOps, Operations, Program Management focus)
2. Skills match (technical, business, leadership)
3. Experience level fit
4. Company stage/industry fit

Be selective - only mark as relevant if it's truly a good fit.`;
}

/**
 * Build the user prompt with CV and jobs
 */
function buildUserPrompt(cvContent: string, jobs: JobForScoring[]): string {
  const jobsJson = JSON.stringify(jobs, null, 2);
  
  return `Here is the candidate's CV:

---
${cvContent.substring(0, 4000)} 
---

Now evaluate these job postings:

${jobsJson}

Return a JSON array with one scoring object for each job, in the same order as provided.`;
}

/**
 * Parse and validate LLM response
 */
function parseLLMResponse(response: string): JobScore[] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array');
      return null;
    }

    // Validate structure
    const scores: JobScore[] = [];
    for (const item of parsed) {
      if (!item.job_id || typeof item.is_relevant !== 'boolean' || typeof item.match_score !== 'number') {
        console.error('Invalid item structure:', item);
        continue;
      }

      scores.push({
        jobId: item.job_id,
        isRelevant: item.is_relevant,
        matchScore: Math.max(0, Math.min(100, item.match_score)), // Clamp to 0-100
        reasoning: item.reasoning || '',
        keySkillsMatched: Array.isArray(item.key_skills_matched) ? item.key_skills_matched : [],
      });
    }

    return scores;
  } catch (error: any) {
    console.error('Error parsing LLM response:', error.message);
    console.error('Response:', response);
    return null;
  }
}

/**
 * Score a batch of jobs using Claude
 */
async function scoreBatch(
  cvContent: string,
  cvHash: string,
  jobs: JobForScoring[]
): Promise<JobScore[]> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(cvContent, jobs);

  console.log(`Scoring batch of ${jobs.length} jobs with Claude...`);

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    const scores = parseLLMResponse(responseText);
    
    if (!scores) {
      console.error('Failed to parse LLM response');
      return [];
    }

    console.log(`Successfully scored ${scores.length} jobs`);
    return scores;
  } catch (error: any) {
    console.error('Error calling Claude API:', error.message);
    return [];
  }
}

/**
 * Score multiple jobs, processing in batches
 */
export async function scoreJobs(jobs: Job[]): Promise<{ 
  success: boolean; 
  scored: number; 
  failed: number;
}> {
  if (jobs.length === 0) {
    console.log('No jobs to score');
    return { success: true, scored: 0, failed: 0 };
  }

  console.log(`Starting LLM scoring for ${jobs.length} jobs...`);

  // Get latest CV
  const cv = await getLatestCV();
  if (!cv) {
    console.error('No CV found in database. Please upload a CV first.');
    return { success: false, scored: 0, failed: jobs.length };
  }

  // Get company names for context
  const companyIds = [...new Set(jobs.map(job => job.company_id))];
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .in('id', companyIds);

  const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

  // Prepare jobs for scoring
  const jobsForScoring: JobForScoring[] = jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: companyMap.get(job.company_id) || 'Unknown',
    location: job.location,
    description: job.description ? job.description.substring(0, 2000) : null, // Limit description length
  }));

  let scored = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < jobsForScoring.length; i += BATCH_SIZE) {
    const batch = jobsForScoring.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(jobsForScoring.length / BATCH_SIZE)}...`);

    const scores = await scoreBatch(cv.content, cv.contentHash, batch);

    // Save scores to database
    for (const score of scores) {
      try {
        const { error } = await supabaseAdmin
          .from('job_scores')
          .insert({
            job_id: score.jobId,
            is_relevant: score.isRelevant,
            match_score: score.matchScore,
            reasoning: score.reasoning,
            key_skills_matched: score.keySkillsMatched,
            cv_version_hash: cv.contentHash,
          });

        if (error) {
          console.error(`Error saving score for job ${score.jobId}:`, error);
          failed++;
        } else {
          scored++;
        }
      } catch (error: any) {
        console.error(`Error saving score:`, error.message);
        failed++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < jobsForScoring.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`LLM scoring complete: ${scored} scored, ${failed} failed`);

  return { success: true, scored, failed };
}

/**
 * Re-score all active jobs (useful after CV update)
 */
export async function rescoreAllJobs(): Promise<void> {
  console.log('Re-scoring all active jobs...');

  // Delete existing scores
  const { error: deleteError } = await supabaseAdmin
    .from('job_scores')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error deleting old scores:', deleteError);
  }

  // Get all active jobs
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No active jobs to score');
    return;
  }

  await scoreJobs(jobs);
}

