/**
 * CV Parser Service
 * Handles DOCX parsing and conversion to plain text
 */

import mammoth from 'mammoth';

export interface ParsedCV {
  text: string;
  sections: {
    experience?: string[];
    education?: string[];
    skills?: string[];
  };
}

/**
 * Parse a DOCX file to plain text
 */
export async function parseDocxToText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Parse CV with basic section detection
 */
export async function parseCV(buffer: Buffer): Promise<ParsedCV> {
  const text = await parseDocxToText(buffer);
  
  // Basic section detection (can be enhanced)
  const sections: ParsedCV['sections'] = {};
  
  // Split by common section headers
  const lines = text.split('\n');
  let currentSection: 'experience' | 'education' | 'skills' | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      sections.experience = [];
    } else if (lowerLine.includes('education')) {
      currentSection = 'education';
      sections.education = [];
    } else if (lowerLine.includes('skills')) {
      currentSection = 'skills';
      sections.skills = [];
    } else if (currentSection && line.trim()) {
      sections[currentSection]?.push(line.trim());
    }
  }
  
  return { text, sections };
}

/**
 * Normalize company names (handle subsidiaries and aliases)
 */
export function normalizeCompanyName(company: string): string {
  const normalized = company.toLowerCase().trim();
  
  // Define known subsidiaries and aliases
  const subsidiaries: Record<string, string> = {
    'google': 'alphabet',
    'youtube': 'alphabet',
    'meta': 'meta',
    'facebook': 'meta',
    'instagram': 'meta',
    'whatsapp': 'meta',
  };
  
  for (const [alias, parent] of Object.entries(subsidiaries)) {
    if (normalized.includes(alias)) {
      return parent;
    }
  }
  
  return normalized;
}

/**
 * Extract key phrases and keywords from CV
 */
export function extractKeywords(text: string): string[] {
  // Remove common stop words and extract meaningful phrases
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can'
  ]);
  
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
}

