import * as path from 'path';
import { processCV } from '../lib/cv-parser';

async function main() {
  const cvPath = path.join(process.cwd(), 'source', 'guy_duer_cv.docx');
  
  console.log('Processing CV from:', cvPath);
  console.log('---');

  try {
    const parsedCV = await processCV(cvPath);
    
    console.log('CV processed successfully!');
    console.log('---');
    console.log('Content length:', parsedCV.content.length, 'characters');
    console.log('Skills found:', parsedCV.skills.length);
    console.log('Experience entries:', parsedCV.experience.length);
    console.log('Education entries:', parsedCV.education.length);
    console.log('---');
    console.log('Sample skills:', parsedCV.skills.slice(0, 10).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('CV processing failed:', error);
    process.exit(1);
  }
}

main();

