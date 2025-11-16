import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relevantOnly = searchParams.get('relevant') === 'true';
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          website
        ),
        job_scores (
          id,
          is_relevant,
          match_score,
          reasoning,
          key_skills_matched,
          evaluated_at
        )
      `)
      .eq('status', 'active')
      .order('first_seen_at', { ascending: false })
      .limit(limit);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to relevant jobs if requested
    let filteredJobs = jobs || [];
    if (relevantOnly) {
      filteredJobs = filteredJobs.filter((job: any) => {
        return job.job_scores?.some((score: any) => score.is_relevant);
      });
    }

    return NextResponse.json({ jobs: filteredJobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

