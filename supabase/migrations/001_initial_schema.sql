-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    description TEXT,
    linkedin_url TEXT,
    website TEXT,
    career_page_url TEXT,
    career_page_type TEXT CHECK (career_page_type IN ('greenhouse', 'lever', 'workday', 'ashby', 'custom', 'unknown')),
    scrape_config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    last_discovery_attempt TIMESTAMP WITH TIME ZONE,
    discovery_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_key TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    description TEXT,
    employment_type TEXT,
    posted_date TIMESTAMP WITH TIME ZONE,
    content_hash TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'removed')) DEFAULT 'active',
    raw_html TEXT,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, job_key)
);

-- Job scores table
CREATE TABLE IF NOT EXISTS job_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    is_relevant BOOLEAN NOT NULL DEFAULT false,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    reasoning TEXT,
    key_skills_matched JSONB DEFAULT '[]'::jsonb,
    cv_version_hash TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape logs table
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('success', 'partial', 'error')) NOT NULL,
    error_message TEXT,
    jobs_found INTEGER DEFAULT 0,
    jobs_new INTEGER DEFAULT 0,
    jobs_updated INTEGER DEFAULT 0,
    jobs_removed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User CV table
CREATE TABLE IF NOT EXISTS user_cv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    file_path TEXT,
    content_hash TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email digests table
CREATE TABLE IF NOT EXISTS email_digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    jobs_included JSONB DEFAULT '[]'::jsonb,
    status TEXT CHECK (status IN ('sent', 'failed')) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_career_page_url ON companies(career_page_url);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_first_seen_at ON jobs(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);

CREATE INDEX IF NOT EXISTS idx_job_scores_job_id ON job_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_scores_is_relevant ON job_scores(is_relevant);
CREATE INDEX IF NOT EXISTS idx_job_scores_match_score ON job_scores(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_scores_relevant_score ON job_scores(is_relevant, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_company_id ON scrape_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started_at ON scrape_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON scrape_logs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for service role, which we'll use via service key)
-- For a single-user app, we'll use service key for all operations

-- Allow all operations via service role
CREATE POLICY "Enable all for service role" ON companies FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON jobs FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON job_scores FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON scrape_logs FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON user_cv FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON email_digests FOR ALL USING (true);

