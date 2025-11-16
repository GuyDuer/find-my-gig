import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY');
}

// Service client for server-side operations (has full access)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Types for our database tables
export interface Company {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  linkedin_url: string | null;
  website: string | null;
  career_page_url: string | null;
  career_page_type: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'custom' | 'unknown' | null;
  scrape_config: Record<string, any>;
  active: boolean;
  last_discovery_attempt: string | null;
  discovery_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  job_key: string;
  title: string;
  url: string;
  location: string | null;
  description: string | null;
  employment_type: string | null;
  posted_date: string | null;
  content_hash: string;
  status: 'active' | 'removed';
  raw_html: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface JobScore {
  id: string;
  job_id: string;
  is_relevant: boolean;
  match_score: number | null;
  reasoning: string | null;
  key_skills_matched: string[];
  cv_version_hash: string | null;
  evaluated_at: string;
  created_at: string;
}

export interface ScrapeLog {
  id: string;
  company_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: 'success' | 'partial' | 'error';
  error_message: string | null;
  jobs_found: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_removed: number;
  created_at: string;
}

export interface UserCV {
  id: string;
  content: string;
  file_path: string | null;
  content_hash: string;
  uploaded_at: string;
  created_at: string;
}

export interface EmailDigest {
  id: string;
  sent_at: string;
  jobs_included: string[];
  status: 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
}

