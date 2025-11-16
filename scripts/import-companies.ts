import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { supabaseAdmin } from '../lib/supabase';
import * as path from 'path';

interface CompanyRow {
  'Company Name': string;
  'Description': string;
  'Area': string;
  'Reasoning': string;
  'Company Domain': string;
  'Company Description': string;
  'Company Year Founded': string;
  'Company Website': string;
  'Company Number of Employees': string;
  'Company Revenue': string;
  'Company linkedin URL': string;
  'Total Funding Amount': string;
  'Total Number of Rounds': string;
  'Last Round/Event Amount': string;
  'Last Round/Event Type': string;
  'Last Round/Event Date': string;
  'IPO Status': string;
  'Company Main Industry': string;
  'Company Sub Industry': string;
  'Company SIC (Standard Industrial Classification)': string;
  'Company NAIC (North American Industry Classification)': string;
  'Company Specialties': string;
  'Company Continent': string;
  'Company Country': string;
  'Company City': string;
  'Company Country ISO': string;
}

async function importCompanies() {
  const csvPath = path.join(process.cwd(), 'source', 'company_data.csv');
  
  console.log('Starting company import from:', csvPath);
  console.log('---');

  const companies: any[] = [];
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser as AsyncIterable<CompanyRow>) {
    const name = row['Company Name'];
    
    // Skip if no company name
    if (!name || name.trim() === '') {
      continue;
    }

    const company = {
      name: name.trim(),
      domain: row['Company Domain'] || null,
      description: row['Company Description'] || row['Description'] || null,
      linkedin_url: row['Company linkedin URL'] || null,
      website: row['Company Website'] || null,
      active: true,
      career_page_url: null,
      career_page_type: null,
      scrape_config: {},
      discovery_status: null,
      last_discovery_attempt: null,
    };

    companies.push(company);
  }

  console.log(`Parsed ${companies.length} companies from CSV`);
  console.log('---');

  // Insert companies in batches
  const batchSize = 100;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabaseAdmin
        .from('companies')
        .upsert(batch, {
          onConflict: 'name',
          ignoreDuplicates: false,
        });

      if (error) {
        // If error is about duplicate, try inserting one by one
        if (error.code === '23505') {
          for (const company of batch) {
            const { error: singleError } = await supabaseAdmin
              .from('companies')
              .insert(company);
            
            if (singleError) {
              if (singleError.code === '23505') {
                skipped++;
                console.log(`Skipped duplicate: ${company.name}`);
              } else {
                console.error(`Error importing ${company.name}:`, singleError.message);
              }
            } else {
              imported++;
            }
          }
        } else {
          console.error('Batch insert error:', error);
          throw error;
        }
      } else {
        imported += batch.length;
        console.log(`Imported batch: ${i + batch.length}/${companies.length}`);
      }
    } catch (error) {
      console.error(`Failed to import batch starting at index ${i}:`, error);
    }
  }

  console.log('---');
  console.log(`Import complete!`);
  console.log(`Imported: ${imported} companies`);
  console.log(`Skipped: ${skipped} companies (duplicates)`);
  console.log('---');

  // Get summary stats
  const { count } = await supabaseAdmin
    .from('companies')
    .select('*', { count: 'exact', head: true });

  console.log(`Total companies in database: ${count}`);
}

// Run the import
importCompanies()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });

