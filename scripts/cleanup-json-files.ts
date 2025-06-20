import * as fs from 'fs';
import * as path from 'path';

const filesToRemove = [
  'users-data.json',
  'reviews-data.json',
  'data/users-data.json',
  'data/reviews-data.json',
  'data/audit-logs-data.json',
  'data/voting-sessions-data.json'
];

console.log('🚀 Starting cleanup of old JSON data files...\n');

let removedCount = 0;

filesToRemove.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Removed: ${filePath}`);
      removedCount++;
      
      // If this was the last file in the data directory, remove the directory if empty
      if (filePath.startsWith('data/')) {
        const dirPath = path.dirname(fullPath);
        if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
          fs.rmdirSync(dirPath);
          console.log(`✅ Removed empty directory: data/`);
        }
      }
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error);
    }
  } else {
    console.log(`ℹ️  Not found (skipping): ${filePath}`);
  }
});

console.log(`\n✨ Cleanup complete. Removed ${removedCount} file(s).`);

// Check for any remaining references to the old JSON files
console.log('\n🔍 Checking for remaining references to old JSON files...');

const checkFiles = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.json',
  '!node_modules/**',
  '!.next/**',
  '!dist/**',
  '!scripts/cleanup-json-files.ts'
];

const filePatterns = [
  /users-data\.json/,
  /reviews-data\.json/,
  /audit-logs-data\.json/,
  /voting-sessions-data\.json/
];

import { glob } from 'glob';

async function checkForReferences() {
  const files = await glob(checkFiles, { nodir: true });
  let foundReferences = false;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = filePatterns.some(pattern => pattern.test(content));
      
      if (matches) {
        console.warn(`⚠️  Found reference in: ${file}`);
        foundReferences = true;
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error);
    }
  }

  if (!foundReferences) {
    console.log('✅ No references to old JSON files found in the codebase.');
  } else {
    console.log('\n⚠️  Warning: Found references to old JSON files. Please update these to use the database instead.');
  }
}

checkForReferences().catch(console.error);
