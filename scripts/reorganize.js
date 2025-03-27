#!/usr/bin/env node

/**
 * Project Structure Reorganization Script
 * 
 * This script reorganizes the MeetNow project files according to the 
 * improved folder structure. It creates directories, moves files,
 * and updates import paths as needed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output for better visibility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Starting folder structure reorganization...${colors.reset}\n`);

// Define folder structure to create
const folders = [
  'src/assets',
  'src/assets/images',
  'src/assets/fonts',
  'src/components/layout',
  'src/features',
  'src/features/auth',
  'src/features/map',
  'src/features/search',
  'src/services/api',
  'src/services/storage',
  'src/styles',
  'src/utils/performance',
  'src/utils/format',
  'scripts',
];

// Create required directories
folders.forEach(folder => {
  const folderPath = path.resolve(process.cwd(), folder);
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`${colors.green}Created directory:${colors.reset} ${folder}`);
  } else {
    console.log(`${colors.yellow}Directory already exists:${colors.reset} ${folder}`);
  }
});

// File moves to perform
const fileMoves = [
  // Move image assets
  { from: 'src/images', to: 'src/assets/images', pattern: '*.{png,jpg,svg,gif}' },
  
  // Move performance utilities
  { from: 'src/utils/performanceTracker.js', to: 'src/utils/performance/performanceTracker.js' },
  { from: 'src/utils/performanceMonitor.js', to: 'src/utils/performance/performanceMonitor.js' },
  
  // Move formatting utilities
  { from: 'src/utils/dateFormat.js', to: 'src/utils/format/dateFormat.js' },
  { from: 'src/utils/numberFormat.js', to: 'src/utils/format/numberFormat.js' },
  { from: 'src/utils/stringFormat.js', to: 'src/utils/format/stringFormat.js' },
  
  // Move API services
  { from: 'src/services/api.js', to: 'src/services/api/index.js' },
  { from: 'src/services/meetupApi.js', to: 'src/services/api/meetupApi.js' },
  { from: 'src/services/userApi.js', to: 'src/services/api/userApi.js' },
  
  // Move storage services
  { from: 'src/services/storage.js', to: 'src/services/storage/index.js' },
  { from: 'src/services/imageStorage.js', to: 'src/services/storage/imageStorage.js' },
  
  // Move feature modules
  { from: 'src/components/auth', to: 'src/features/auth/components' },
  { from: 'src/components/map', to: 'src/features/map/components' },
  { from: 'src/components/search', to: 'src/features/search/components' },
  
  // Move layout components
  { from: 'src/components/common/Header.jsx', to: 'src/components/layout/Header.jsx' },
  { from: 'src/components/common/Footer.jsx', to: 'src/components/layout/Footer.jsx' },
  { from: 'src/components/common/Sidebar.jsx', to: 'src/components/layout/Sidebar.jsx' },
  { from: 'src/components/common/Navigation.jsx', to: 'src/components/layout/Navigation.jsx' },
  
  // Move style files
  { from: 'src/styles.css', to: 'src/styles/global.css' },
  { from: 'src/theme.js', to: 'src/styles/theme.js' },
];

// Function to move files
function moveFile(from, to) {
  const fromPath = path.resolve(process.cwd(), from);
  const toPath = path.resolve(process.cwd(), to);
  
  // Make sure the source file exists
  if (!fs.existsSync(fromPath)) {
    console.log(`${colors.yellow}Skipping:${colors.reset} ${from} (not found)`);
    return;
  }
  
  // Make sure target directory exists
  const toDir = path.dirname(toPath);
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }
  
  // Move the file
  try {
    fs.copyFileSync(fromPath, toPath);
    console.log(`${colors.green}Moved:${colors.reset} ${from} → ${to}`);
  } catch (error) {
    console.log(`${colors.red}Error moving ${from} to ${to}:${colors.reset} ${error.message}`);
  }
}

// Process file moves
fileMoves.forEach(move => {
  if (move.pattern) {
    // Handle pattern-based moves
    try {
      const fromDir = path.resolve(process.cwd(), move.from);
      if (fs.existsSync(fromDir) && fs.statSync(fromDir).isDirectory()) {
        const files = fs.readdirSync(fromDir);
        const pattern = new RegExp(move.pattern.replace(/\*/g, '.*'));
        
        files.forEach(file => {
          if (pattern.test(file)) {
            const fromPath = path.join(move.from, file);
            const toPath = path.join(move.to, file);
            moveFile(fromPath, toPath);
          }
        });
      }
    } catch (error) {
      console.log(`${colors.red}Error processing pattern ${move.pattern}:${colors.reset} ${error.message}`);
    }
  } else {
    // Handle direct file moves
    moveFile(move.from, move.to);
  }
});

// Create an index.js for each feature folder
const featureFolders = ['auth', 'map', 'search'];
featureFolders.forEach(feature => {
  const indexPath = path.resolve(process.cwd(), `src/features/${feature}/index.js`);
  
  if (!fs.existsSync(indexPath)) {
    const content = `/**
 * ${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature Module
 * 
 * This module exports all components, hooks, and utilities related to the ${feature} feature.
 */

// Export components
export * from './components';

// Add hooks and utilities as they are moved into this feature
`;
    
    fs.writeFileSync(indexPath, content);
    console.log(`${colors.green}Created:${colors.reset} src/features/${feature}/index.js`);
  }
});

// Update the package.json to add a script for running this reorganization
try {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts.reorganize) {
    packageJson.scripts.reorganize = 'node scripts/reorganize.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}Updated:${colors.reset} package.json with reorganize script`);
  }
} catch (error) {
  console.log(`${colors.red}Error updating package.json:${colors.reset} ${error.message}`);
}

console.log(`\n${colors.cyan}Folder reorganization completed!${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`1. Update import paths in files that reference moved modules`);
console.log(`2. Run tests to ensure everything still works correctly`);
console.log(`3. Commit the changes with git`); 