import { supabaseAdmin } from '../lib/supabase';
import { rediscoverMissingCareerPages } from '../lib/career-page-discovery';

async function main() {
  console.log('Starting career page discovery...');
  console.log('This will attempt to find career pages for companies without one.');
  console.log('---');

  try {
    await rediscoverMissingCareerPages();
    console.log('---');
    console.log('Career page discovery complete!');
    process.exit(0);
  } catch (error) {
    console.error('Discovery failed:', error);
    process.exit(1);
  }
}

main();

