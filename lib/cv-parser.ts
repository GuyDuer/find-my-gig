import mammoth from 'mammoth';
import * as crypto from 'crypto';
import { supabaseAdmin } from './supabase';

export interface ParsedCV {
  content: string;
  contentHash: string;
  skills: string[];
  experience: string[];
  education: string[];
}

/**
 * Parses a DOCX file and extracts text content
 */
export async function parseDocxFile(filePath: string): Promise<ParsedCV> {
  try {
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;

    // Generate content hash for change detection
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Extract sections (basic pattern matching)
    const skills = extractSkills(content);
    const experience = extractExperience(content);
    const education = extractEducation(content);

    return {
      content,
      contentHash,
      skills,
      experience,
      education,
    };
  } catch (error) {
    console.error('Error parsing DOCX file:', error);
    throw new Error(`Failed to parse CV: ${error}`);
  }
}

/**
 * Extract skills from CV content
 */
function extractSkills(content: string): string[] {
  const skills: string[] = [];
  
  // Look for skills section
  const skillsMatch = content.match(/(?:Skills?|Technical Skills?|Core Competencies)[:\s]+([\s\S]*?)(?:\n\n|\n[A-Z])/i);
  
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    // Split by common delimiters
    const extracted = skillsText
      .split(/[,;•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 50);
    
    skills.push(...extracted);
  }

  // Common tech/business skills to look for anywhere in the document
  const commonSkills = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'Azure', 'GCP',
    'Salesforce', 'HubSpot', 'Data Analysis', 'Project Management', 'Agile', 'Scrum',
    'RevOps', 'Sales Operations', 'Marketing Operations', 'Business Intelligence',
    'CRM', 'Excel', 'Tableau', 'PowerBI', 'Looker', 'Analytics', 'API', 'ETL',
    'Team Leadership', 'Cross-functional Collaboration', 'Process Optimization',
    'Strategic Planning', 'Stakeholder Management', 'Revenue Optimization'
  ];

  for (const skill of commonSkills) {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(content) && !skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Extract experience entries from CV content
 */
function extractExperience(content: string): string[] {
  const experience: string[] = [];
  
  // Look for experience section
  const expMatch = content.match(/(?:Experience|Work Experience|Professional Experience)[:\s]+([\s\S]*?)(?:\n\n[A-Z]|Education|Skills)/i);
  
  if (expMatch) {
    const expText = expMatch[1];
    // Split by job entries (usually separated by double newlines or dates)
    const entries = expText.split(/\n\n+/);
    
    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length > 20) {
        experience.push(trimmed);
      }
    }
  }

  return experience;
}

/**
 * Extract education entries from CV content
 */
function extractEducation(content: string): string[] {
  const education: string[] = [];
  
  // Look for education section
  const eduMatch = content.match(/(?:Education|Academic Background)[:\s]+([\s\S]*?)(?:\n\n[A-Z]|$)/i);
  
  if (eduMatch) {
    const eduText = eduMatch[1];
    const entries = eduText.split(/\n\n+/);
    
    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length > 10) {
        education.push(trimmed);
      }
    }
  }

  return education;
}

/**
 * Save parsed CV to database
 */
export async function saveCVToDatabase(parsedCV: ParsedCV, filePath: string): Promise<void> {
  try {
    // Check if CV already exists with same hash
    const { data: existingCV } = await supabaseAdmin
      .from('user_cv')
      .select('id, content_hash')
      .eq('content_hash', parsedCV.contentHash)
      .single();

    if (existingCV) {
      console.log('CV with same content already exists in database');
      return;
    }

    // Insert new CV
    const { error } = await supabaseAdmin
      .from('user_cv')
      .insert({
        content: parsedCV.content,
        file_path: filePath,
        content_hash: parsedCV.contentHash,
      });

    if (error) {
      throw error;
    }

    console.log('CV successfully saved to database');
  } catch (error) {
    console.error('Error saving CV to database:', error);
    throw error;
  }
}

/**
 * Get the latest CV from database
 */
export async function getLatestCV(): Promise<{ content: string; contentHash: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_cv')
      .select('content, content_hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No CV found
        return null;
      }
      throw error;
    }

    return {
      content: data.content,
      contentHash: data.content_hash,
    };
  } catch (error) {
    console.error('Error getting latest CV:', error);
    return null;
  }
}

/**
 * Main function to parse and save CV
 */
export async function processCV(filePath: string): Promise<ParsedCV> {
  const parsedCV = await parseDocxFile(filePath);
  await saveCVToDatabase(parsedCV, filePath);
  return parsedCV;
}

