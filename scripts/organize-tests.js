#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_DIRS = {
  UNIT: 'tests/unit',
  INTEGRATION: 'tests/integration',
  E2E: 'tests/e2e',
  DB: 'tests/db',
};

// Create test directories if they don't exist
Object.values(TEST_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`✓ Created directory: ${dir}`));
  }
});

// Pattern matchers to categorize tests
const isUnitTest = (filePath) => {
  return (
    filePath.includes('__tests__') || 
    (filePath.includes('.test.') && !filePath.includes('integration') && !filePath.includes('e2e'))
  );
};

const isIntegrationTest = (filePath) => {
  return filePath.includes('integration') || filePath.includes('integration-test');
};

const isE2ETest = (filePath) => {
  return filePath.includes('e2e') || filePath.includes('cypress');
};

const isDbTest = (filePath) => {
  return (
    filePath.includes('db/') || 
    filePath.includes('database') || 
    filePath.includes('supabase') && filePath.includes('test')
  );
};

// Find all test files
function findTestFiles(rootDir) {
  const testFiles = [];
  
  function traverseDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and dist directories
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          traverseDir(fullPath);
        }
      } else if (
        (file.includes('.test.') || file.includes('Test.') || file.includes('_test.')) &&
        (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))
      ) {
        testFiles.push(fullPath);
      }
    }
  }
  
  traverseDir(rootDir);
  return testFiles;
}

// Organize test files into appropriate directories
function organizeTests(srcRoot = '.') {
  console.log(chalk.blue('\n🔍 Finding test files...'));
  const testFiles = findTestFiles(srcRoot);
  console.log(chalk.green(`✓ Found ${testFiles.length} test files`));

  const targetDirs = {
    [TEST_DIRS.UNIT]: [],
    [TEST_DIRS.INTEGRATION]: [],
    [TEST_DIRS.E2E]: [],
    [TEST_DIRS.DB]: [],
  };

  // Categorize each test file
  testFiles.forEach(filePath => {
    let targetDir;
    
    if (isE2ETest(filePath)) {
      targetDir = TEST_DIRS.E2E;
    } else if (isIntegrationTest(filePath)) {
      targetDir = TEST_DIRS.INTEGRATION;
    } else if (isDbTest(filePath)) {
      targetDir = TEST_DIRS.DB;
    } else if (isUnitTest(filePath)) {
      targetDir = TEST_DIRS.UNIT;
    } else {
      // Default to unit tests if unclassified
      targetDir = TEST_DIRS.UNIT;
    }
    
    targetDirs[targetDir].push(filePath);
  });

  // Create a record of where tests are moved for import updates
  const testPathMapping = {};

  // Move each test file to its target directory
  console.log(chalk.blue('\n🚚 Moving test files...'));
  
  Object.entries(targetDirs).forEach(([targetDir, files]) => {
    console.log(chalk.yellow(`\nMoving ${files.length} files to ${targetDir}:`));
    
    files.forEach(sourcePath => {
      // Create subdirectories to match original path structure
      const sourceRelative = path.relative(srcRoot, sourcePath);
      let filename = path.basename(sourcePath);
      
      // Create a directory structure based on the original location
      const sourceDir = path.dirname(sourceRelative);
      const testSubDir = sourceDir.replace(/^src\/|^test\/|^tests\//, '').replace(/__tests__\/?/, '');
      
      // Create target directory
      const targetSubDir = path.join(targetDir, testSubDir);
      if (!fs.existsSync(targetSubDir)) {
        fs.mkdirSync(targetSubDir, { recursive: true });
      }
      
      // Determine target path
      const targetPath = path.join(targetSubDir, filename);
      
      // Check if target file already exists
      if (fs.existsSync(targetPath)) {
        filename = `${path.basename(filename, path.extname(filename))}_moved${path.extname(filename)}`;
        console.log(chalk.yellow(`⚠️ File exists at target, renaming to: ${filename}`));
      }
      
      const finalTargetPath = path.join(targetSubDir, filename);
      
      // Record the mapping for import updates
      testPathMapping[sourcePath] = finalTargetPath;
      
      // Copy the file
      try {
        fs.copyFileSync(sourcePath, finalTargetPath);
        console.log(chalk.green(`✓ Copied: ${sourcePath} -> ${finalTargetPath}`));
      } catch (err) {
        console.error(chalk.red(`❌ Error copying ${sourcePath}: ${err.message}`));
      }
    });
  });

  // Write the path mapping to a file for use in updating imports
  const mappingPath = 'scripts/test-path-mapping.json';
  fs.writeFileSync(mappingPath, JSON.stringify(testPathMapping, null, 2));
  console.log(chalk.green(`\n✓ Wrote test path mapping to ${mappingPath}`));
  
  console.log(chalk.blue('\n📝 Test files have been organized, but not removed from their original locations.'));
  console.log(chalk.yellow('   Run with --remove-originals to delete the original files after organization.'));
  console.log(chalk.yellow('   Run update-imports script to fix import paths in your tests.'));
}

// Main function
function main() {
  const removeOriginals = process.argv.includes('--remove-originals');
  
  console.log(chalk.blue('🧪 Test Organization Tool 🧪'));
  console.log(chalk.yellow('This tool will organize your test files into a consistent structure.'));
  
  if (removeOriginals) {
    console.log(chalk.red('\n⚠️ WARNING: Original test files will be removed after organization.'));
    console.log(chalk.red('   Make sure you have committed your changes before proceeding.'));
  }
  
  organizeTests();
  
  console.log(chalk.green('\n✅ Test organization complete!'));
}

main(); 