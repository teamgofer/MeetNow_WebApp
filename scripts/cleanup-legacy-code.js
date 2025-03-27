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
const BACKUP_EXTENSIONS = ['.bak', '.backup', '.orig', '.original', '.old'];
const TEST_RELATED_PATTERNS = ['test', 'Test', 'mock', 'Mock', 'example', 'Example', 'demo', 'Demo'];
const DEMO_DIR = 'src/routes/demos';

// Ensure demo directory exists
if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
  console.log(chalk.green(`✓ Created directory: ${DEMO_DIR}`));
}

// Find all backup files
function findBackupFiles(rootDir) {
  const backupFiles = [];
  
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
      } else {
        // Check if file has backup extension
        if (BACKUP_EXTENSIONS.some(ext => file.includes(ext))) {
          backupFiles.push(fullPath);
        }
      }
    }
  }
  
  traverseDir(rootDir);
  return backupFiles;
}

// Find demo and test files that aren't in test directories
function findDemoAndTestFiles(rootDir) {
  const demoFiles = [];
  
  function traverseDir(currentPath) {
    // Skip test and __tests__ directories
    if (
      currentPath.includes('/__tests__') || 
      currentPath.includes('/test/') || 
      currentPath.includes('/tests/')
    ) {
      return;
    }
    
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and dist directories
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          traverseDir(fullPath);
        }
      } else {
        // Skip non-source files
        if (!file.endsWith('.js') && !file.endsWith('.jsx') && !file.endsWith('.ts') && !file.endsWith('.tsx')) {
          continue;
        }
        
        // Check if file name contains test-related patterns
        if (TEST_RELATED_PATTERNS.some(pattern => file.toLowerCase().includes(pattern.toLowerCase()))) {
          demoFiles.push(fullPath);
        }
      }
    }
  }
  
  traverseDir(rootDir);
  return demoFiles;
}

// Move demo files to the demo directory
function moveTestAndDemoFiles(files) {
  console.log(chalk.blue('\n🚚 Moving demo and test files...'));
  
  // Create a record of where files are moved for import updates
  const filePathMapping = {};
  
  files.forEach(sourcePath => {
    // Get the relative path for the target
    const filename = path.basename(sourcePath);
    
    // Create a subdirectory structure
    const sourceDir = path.dirname(sourcePath);
    const componentsMatch = sourceDir.match(/\/components\/([^/]+)/);
    const subdirectory = componentsMatch ? componentsMatch[1] : '';
    
    let targetSubDir = DEMO_DIR;
    if (subdirectory) {
      targetSubDir = path.join(DEMO_DIR, subdirectory);
      if (!fs.existsSync(targetSubDir)) {
        fs.mkdirSync(targetSubDir, { recursive: true });
      }
    }
    
    // Determine target path
    let targetPath = path.join(targetSubDir, filename);
    
    // Check if target file already exists
    if (fs.existsSync(targetPath)) {
      const newFilename = `${path.basename(filename, path.extname(filename))}_moved${path.extname(filename)}`;
      console.log(chalk.yellow(`⚠️ File exists at target, renaming to: ${newFilename}`));
      targetPath = path.join(targetSubDir, newFilename);
    }
    
    // Record the mapping for import updates
    filePathMapping[sourcePath] = targetPath;
    
    // Copy the file
    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(chalk.green(`✓ Moved: ${sourcePath} -> ${targetPath}`));
    } catch (err) {
      console.error(chalk.red(`❌ Error moving ${sourcePath}: ${err.message}`));
    }
  });
  
  // Write the path mapping to a file for use in updating imports
  const mappingPath = 'scripts/demo-path-mapping.json';
  fs.writeFileSync(mappingPath, JSON.stringify(filePathMapping, null, 2));
  console.log(chalk.green(`\n✓ Wrote demo path mapping to ${mappingPath}`));
}

// Remove backup files
function removeBackupFiles(files) {
  console.log(chalk.blue('\n🗑️ Removing backup files...'));
  
  files.forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(chalk.green(`✓ Removed: ${file}`));
    } catch (err) {
      console.error(chalk.red(`❌ Error removing ${file}: ${err.message}`));
    }
  });
}

// Main function
function main() {
  const removeBackups = !process.argv.includes('--preview-only');
  const moveDemos = process.argv.includes('--move-demos');
  
  console.log(chalk.blue('🧹 Legacy Code Cleanup Tool 🧹'));
  console.log(chalk.yellow('This tool will identify and clean up legacy code and backup files.'));
  
  if (!removeBackups) {
    console.log(chalk.yellow('\nRunning in preview mode. No files will be removed.'));
  }
  
  // Find backup files
  console.log(chalk.blue('\n🔍 Finding backup files...'));
  const backupFiles = findBackupFiles('.');
  console.log(chalk.green(`✓ Found ${backupFiles.length} backup files`));
  
  // Print out the backup files
  backupFiles.forEach(file => {
    console.log(`  ${file}`);
  });
  
  // Find demo and test files
  if (moveDemos) {
    console.log(chalk.blue('\n🔍 Finding demo and test files...'));
    const demoFiles = findDemoAndTestFiles('src');
    console.log(chalk.green(`✓ Found ${demoFiles.length} demo and test files`));
    
    // Print out the demo files
    demoFiles.forEach(file => {
      console.log(`  ${file}`);
    });
    
    // Move demo files
    if (demoFiles.length > 0) {
      moveTestAndDemoFiles(demoFiles);
    }
  }
  
  // Remove backup files
  if (backupFiles.length > 0 && removeBackups) {
    removeBackupFiles(backupFiles);
  }
  
  console.log(chalk.green('\n✅ Legacy code cleanup complete!'));
  
  if (!removeBackups) {
    console.log(chalk.yellow('\nTo remove the files, run without the --preview-only flag.'));
  }
}

main(); 