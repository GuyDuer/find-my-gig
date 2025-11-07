/**
 * Claude API Service
 * Handles all interactions with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

export interface JobExtractionResult {
  title: string;
  company: string;
  description: string;
  locations: string[];
  roleTags: string[];
  postingDate: string | null;
  workMode: string | null;
}

export interface ScoringResult {
  userToJobScore: number;
  jobToUserScore: number;
  overallScore: number;
  explanation: string;
  tags: string[];
}

export interface CVGenerationResult {
  sections: {
    summary?: string;
    experience: string[];
    education: string[];
    skills: string[];
  };
  fullText: string;
}

/**
 * Extract structured data from a job description
 */
export async function extractJobData(
  jobDescription: string
): Promise<JobExtractionResult> {
  const prompt = `Extract structured information from this job description. Map the role to one of these taxonomies: RevOps, BizOps, CX Ops, GTM Ops, Strategy & Ops, Sales Ops, Chief of Staff, Product Ops, Data Ops, Marketing Ops.

Job Description:
${jobDescription}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "extracted job title",
  "company": "company name",
  "description": "full description text",
  "locations": ["location1", "location2"],
  "roleTags": ["tag1", "tag2"],
  "postingDate": "YYYY-MM-DD or null",
  "workMode": "Remote|Hybrid|Onsite or null"
}

Rules:
- Never hallucinate or invent information
- Use null for missing fields
- Map role to closest taxonomy match
- Include all mentioned locations
- Return ONLY valid JSON, no markdown or explanations`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error('Error extracting job data:', error);
    throw new Error('Failed to extract job data from description');
  }
}

/**
 * Score the fit between a user's CV and a job description
 */
export async function scoreJobFit(
  userCV: string,
  jobDescription: string,
  userPreferences: {
    roles: string[];
    locations: string[];
    companies: string[];
  },
  jobData: {
    title: string;
    company: string;
    locations: string[];
    roleTags: string[];
  }
): Promise<ScoringResult> {
  const prompt = `Score the fit between this candidate's CV and the job description.

CANDIDATE CV:
${userCV}

JOB DESCRIPTION:
Title: ${jobData.title}
Company: ${jobData.company}
Locations: ${jobData.locations.join(', ')}
Role Tags: ${jobData.roleTags.join(', ')}

${jobDescription}

USER PREFERENCES:
Preferred Roles: ${userPreferences.roles.join(', ')}
Preferred Locations: ${userPreferences.locations.join(', ')}
High-Interest Companies: ${userPreferences.companies.join(', ')}

Calculate two scores (0-100):

1. User→Job Fit (60% weight): How well does the CV match the JD requirements?
   - Consider explicit skills, experience, and qualifications ONLY
   - Never invent experience or metrics
   - Base score purely on what's documented in the CV

2. Job→User Fit (40% weight): How well does the job match user preferences?
   - Role taxonomy match
   - Location match
   - Company match (high-interest companies boost score)
   - Unlisted companies should lower this score

Overall Score = min(0.6 × User→Job + 0.4 × Job→User, 100)

Provide 5-7 lines of explanation for both scores.

Return ONLY valid JSON:
{
  "userToJobScore": <number 0-100>,
  "jobToUserScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "explanation": "5-7 lines explaining both scores",
  "reasoning": {
    "userToJob": "brief explanation",
    "jobToUser": "brief explanation"
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonText);

    // Calculate tags based on scores
    const tags: string[] = [];
    if (result.userToJobScore >= 90) tags.push("You're a High Fit!");
    if (result.jobToUserScore >= 90) tags.push("They're a High Fit for you!");
    if (result.userToJobScore >= 90 && result.jobToUserScore >= 90) {
      tags.push("That's a Match!");
    }
    
    // Add wildcard tags
    if (result.userToJobScore >= 70 && result.userToJobScore < 85) {
      tags.push("Stretch Role");
    }
    if (result.jobToUserScore < 60 && result.userToJobScore >= 75) {
      tags.push("Left Field");
    }

    return {
      userToJobScore: result.userToJobScore,
      jobToUserScore: result.jobToUserScore,
      overallScore: result.overallScore,
      explanation: result.explanation,
      tags,
    };
  } catch (error) {
    console.error('Error scoring job fit:', error);
    throw new Error('Failed to score job fit');
  }
}

/**
 * Generate a tailored CV for a specific job
 */
export async function generateTailoredCV(
  baseCV: string,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<CVGenerationResult> {
  const prompt = `Rewrite this CV for the "${jobTitle}" role at ${company}.

BASE CV (canonical source):
${baseCV}

TARGET JOB:
${jobDescription}

Rules:
1. Use ONLY content from the base CV - never invent experience, metrics, or dates
2. Never alter job titles, dates, or company names
3. Reorder and rephrase content to highlight relevant experience
4. Inject keywords from the JD naturally
5. Keep under 1000 words
6. Make it ATS-friendly
7. Maintain professional tone

Return ONLY valid JSON:
{
  "sections": {
    "summary": "2-3 sentence summary (optional)",
    "experience": ["experience item 1", "experience item 2", ...],
    "education": ["education item 1", ...],
    "skills": ["skill1", "skill2", ...]
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const sections = JSON.parse(jsonText).sections;
    
    // Generate full text from sections
    let fullText = '';
    if (sections.summary) {
      fullText += sections.summary + '\n\n';
    }
    if (sections.experience?.length) {
      fullText += 'EXPERIENCE\n' + sections.experience.join('\n\n') + '\n\n';
    }
    if (sections.education?.length) {
      fullText += 'EDUCATION\n' + sections.education.join('\n') + '\n\n';
    }
    if (sections.skills?.length) {
      fullText += 'SKILLS\n' + sections.skills.join(', ');
    }

    return { sections, fullText };
  } catch (error) {
    console.error('Error generating CV:', error);
    throw new Error('Failed to generate tailored CV');
  }
}

/**
 * Generate a cover letter for a specific job
 */
export async function generateCoverLetter(
  baseCV: string,
  jobDescription: string,
  jobTitle: string,
  company: string,
  userName: string,
  exampleCoverLetter: string
): Promise<string> {
  const prompt = `Write a cover letter for ${userName} applying to the "${jobTitle}" role at ${company}.

CANDIDATE CV:
${baseCV}

JOB DESCRIPTION:
${jobDescription}

STYLE REFERENCE (match this tone and voice):
${exampleCoverLetter}

Requirements:
- Maximum 200 words
- Short, punchy, direct
- Match the reference style: confident, a bit salty, no fluff
- Reference specific achievements from CV
- Show genuine interest in the company/role
- No generic platitudes

Return ONLY the cover letter text, no JSON, no markdown.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw new Error('Failed to generate cover letter');
  }
}

