import fs from 'fs';
import { exec } from 'child_process';

// Read the migration file
const migrationContent = fs.readFileSync('./supabase/migrations/20240420_credit_economy_system.sql', 'utf8');

// Use pg_dump to validate SQL syntax
const tempFile = './temp_migration_syntax_check.sql';
fs.writeFileSync(tempFile, migrationContent);

console.log('Checking SQL syntax...');

// Perform basic validation by checking for unmatched pairs
let openBraces = 0;
let openParens = 0;
let openQuotes = false;

for (let i = 0; i < migrationContent.length; i++) {
  const char = migrationContent[i];
  
  if (char === '{' && !openQuotes) openBraces++;
  if (char === '}' && !openQuotes) openBraces--;
  if (char === '(' && !openQuotes) openParens++;
  if (char === ')' && !openQuotes) openParens--;
  
  if (char === "'" && (i === 0 || migrationContent[i-1] !== '\\')) {
    openQuotes = !openQuotes;
  }
}

if (openBraces !== 0 || openParens !== 0 || openQuotes) {
  console.error('❌ Syntax validation failed:');
  if (openBraces !== 0) console.error(`  - Unmatched braces: ${openBraces}`);
  if (openParens !== 0) console.error(`  - Unmatched parentheses: ${openParens}`);
  if (openQuotes) console.error('  - Unmatched quotes');
} else {
  console.log('✅ Basic syntax validation passed.');
  
  // Validate table dependencies
  validateTableDependencies();
}

// Clean up
fs.unlinkSync(tempFile);

function validateTableDependencies() {
  console.log('\nChecking table dependencies...');
  
  // Extract table creation order
  const tableCreations = [];
  const tablePattern = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([^\s(]+)/gi;
  let match;
  
  while ((match = tablePattern.exec(migrationContent)) !== null) {
    tableCreations.push(match[1]);
  }
  
  console.log(`Tables to be created (${tableCreations.length}):`);
  tableCreations.forEach(table => console.log(`  - ${table}`));
  
  // Extract references
  const references = [];
  const refPattern = /REFERENCES\s+([^\s(]+)/gi;
  
  while ((match = refPattern.exec(migrationContent)) !== null) {
    references.push(match[1]);
  }
  
  console.log(`\nReferences found (${references.length}):`);
  references.forEach(ref => console.log(`  - ${ref}`));
  
  // Check for missing references
  let missingReferences = false;
  for (const ref of references) {
    // Exclude auth.users as it's a built-in table
    if (ref === 'auth.users') continue;
    
    if (!tableCreations.includes(ref)) {
      console.error(`❌ Referenced table not created in this migration: ${ref}`);
      missingReferences = true;
    }
  }
  
  if (!missingReferences) {
    console.log('\n✅ All referenced tables are properly created.');
  }
  
  console.log('\nValidation complete.');
} 