import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scrapeJobs } from '@/lib/job-scraper';
import { diffJobs, applyDiff, getJobsNeedingScoring } from '@/lib/job-differ';
import { filterJobs } from '@/lib/job-filter';
import { scoreJobs } from '@/lib/llm-scorer';

export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('company_id');
  const limit = parseInt(searchParams.get('limit') || '10');

  console.log('=== Starting scrape job ===');
  console.log(`Company ID filter: ${companyId || 'all'}`);
  console.log(`Limit: ${limit}`);

  try {
    // Get companies to scrape
    let query = supabaseAdmin
      .from('companies')
      .select('*')
      .eq('active', true)
      .not('career_page_url', 'is', null);

    if (companyId) {
      query = query.eq('id', companyId);
    } else {
      query = query.limit(limit);
    }

    const { data: companies, error: companiesError } = await query;

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ 
        message: 'No companies to scrape',
        stats: { companies: 0, jobs: 0, new: 0, updated: 0 }
      });
    }

    console.log(`Found ${companies.length} companies to scrape`);

    const results = {
      companiesProcessed: 0,
      companiesSucceeded: 0,
      companiesFailed: 0,
      totalJobsFound: 0,
      totalJobsNew: 0,
      totalJobsUpdated: 0,
      totalJobsFiltered: 0,
      totalJobsScored: 0,
      errors: [] as string[],
    };

    // Process each company
    for (const company of companies) {
      const startTime = new Date();
      
      try {
        console.log(`\n--- Processing: ${company.name} ---`);
        
        // Create scrape log entry
        const { data: logEntry, error: logError } = await supabaseAdmin
          .from('scrape_logs')
          .insert({
            company_id: company.id,
            started_at: startTime.toISOString(),
            status: 'success',
          })
          .select()
          .single();

        if (logError) {
          console.error(`Error creating scrape log for ${company.name}:`, logError);
        }

        // Step 1: Scrape jobs
        const scrapedJobs = await scrapeJobs(company);
        results.totalJobsFound += scrapedJobs.length;

        if (scrapedJobs.length === 0) {
          console.log(`No jobs found for ${company.name}`);
          
          // Update log
          if (logEntry) {
            await supabaseAdmin
              .from('scrape_logs')
              .update({
                finished_at: new Date().toISOString(),
                status: 'success',
                jobs_found: 0,
              })
              .eq('id', logEntry.id);
          }
          
          results.companiesProcessed++;
          results.companiesSucceeded++;
          continue;
        }

        // Step 2: Diff against database
        const diffResult = await diffJobs(company.id, scrapedJobs);
        results.totalJobsNew += diffResult.stats.new;
        results.totalJobsUpdated += diffResult.stats.updated;

        // Step 3: Apply diff to database
        const applyResult = await applyDiff(company.id, diffResult);
        
        if (!applyResult.success) {
          throw new Error(`Failed to apply diff: ${applyResult.error}`);
        }

        // Update scrape log
        if (logEntry) {
          await supabaseAdmin
            .from('scrape_logs')
            .update({
              finished_at: new Date().toISOString(),
              status: 'success',
              jobs_found: scrapedJobs.length,
              jobs_new: diffResult.stats.new,
              jobs_updated: diffResult.stats.updated,
              jobs_removed: diffResult.stats.removed,
            })
            .eq('id', logEntry.id);
        }

        results.companiesProcessed++;
        results.companiesSucceeded++;

        console.log(`✓ ${company.name} completed successfully`);
        
        // Small delay between companies
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`✗ Error processing ${company.name}:`, error.message);
        results.companiesFailed++;
        results.errors.push(`${company.name}: ${error.message}`);

        // Update scrape log with error
        await supabaseAdmin
          .from('scrape_logs')
          .insert({
            company_id: company.id,
            started_at: startTime.toISOString(),
            finished_at: new Date().toISOString(),
            status: 'error',
            error_message: error.message,
            jobs_found: 0,
          });
      }
    }

    // Step 4: Get jobs needing scoring (new/updated without scores)
    console.log('\n--- Filtering and scoring jobs ---');
    const jobsNeedingScoring = await getJobsNeedingScoring();
    
    if (jobsNeedingScoring.length > 0) {
      console.log(`Found ${jobsNeedingScoring.length} jobs needing scoring`);
      
      // Apply keyword filter first
      const filterResult = filterJobs(jobsNeedingScoring);
      results.totalJobsFiltered = filterResult.filtered.length;
      
      console.log(`${filterResult.filtered.length} jobs passed keyword filter`);
      
      // Score filtered jobs with LLM
      if (filterResult.filtered.length > 0) {
        const scoreResult = await scoreJobs(filterResult.filtered);
        results.totalJobsScored = scoreResult.scored;
        
        console.log(`Scored ${scoreResult.scored} jobs`);
      }
    }

    console.log('\n=== Scrape job complete ===');
    console.log('Results:', results);

    return NextResponse.json({
      success: true,
      message: 'Scrape completed',
      stats: results,
    });
  } catch (error: any) {
    console.error('Fatal error during scrape:', error);
    return NextResponse.json({ 
      error: 'Scrape failed', 
      message: error.message 
    }, { status: 500 });
  }
}

