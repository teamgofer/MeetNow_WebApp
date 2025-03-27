#!/usr/bin/env node

/**
 * Import Path Updater
 * 
 * This script updates import paths across the codebase
 * after files have been reorganized.
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

console.log(`${colors.cyan}Starting import path updates...${colors.reset}\n`);

// Map of old paths to new paths
const importPathMappings = [
  // Utilities
  { from: '../utils/performanceTracker', to: '../utils/performance/performanceTracker' },
  { from: '../utils/performanceMonitor', to: '../utils/performance/performanceMonitor' },
  { from: '../utils/dateFormat', to: '../utils/format/dateFormat' },
  { from: '../utils/numberFormat', to: '../utils/format/numberFormat' },
  { from: '../utils/stringFormat', to: '../utils/format/stringFormat' },
  { from: './utils/performanceTracker', to: './utils/performance/performanceTracker' },
  { from: './utils/performanceMonitor', to: './utils/performance/performanceMonitor' },
  { from: './utils/dateFormat', to: './utils/format/dateFormat' },
  { from: './utils/numberFormat', to: './utils/format/numberFormat' },
  { from: './utils/stringFormat', to: './utils/format/stringFormat' },
  
  // Services
  { from: '../services/api', to: '../services/api/index' },
  { from: '../services/meetupApi', to: '../services/api/meetupApi' },
  { from: '../services/userApi', to: '../services/api/userApi' },
  { from: '../services/storage', to: '../services/storage/index' },
  { from: '../services/imageStorage', to: '../services/storage/imageStorage' },
  { from: './services/api', to: './services/api/index' },
  { from: './services/meetupApi', to: './services/api/meetupApi' },
  { from: './services/userApi', to: './services/api/userApi' },
  { from: './services/storage', to: './services/storage/index' },
  { from: './services/imageStorage', to: './services/storage/imageStorage' },
  
  // Layout components
  { from: '../components/common/Header', to: '../components/layout/Header' },
  { from: '../components/common/Footer', to: '../components/layout/Footer' },
  { from: '../components/common/Sidebar', to: '../components/layout/Sidebar' },
  { from: '../components/common/Navigation', to: '../components/layout/Navigation' },
  { from: './components/common/Header', to: './components/layout/Header' },
  { from: './components/common/Footer', to: './components/layout/Footer' },
  { from: './components/common/Sidebar', to: './components/layout/Sidebar' },
  { from: './components/common/Navigation', to: './components/layout/Navigation' },
  
  // Feature components
  { from: '../components/auth', to: '../features/auth/components' },
  { from: '../components/map', to: '../features/map/components' },
  { from: '../components/search', to: '../features/search/components' },
  { from: './components/auth', to: './features/auth/components' },
  { from: './components/map', to: './features/map/components' },
  { from: './components/search', to: './features/search/components' },
  
  // Style files
  { from: '../styles.css', to: '../styles/global.css' },
  { from: '../theme', to: '../styles/theme' },
  { from: './styles.css', to: './styles/global.css' },
  { from: './theme', to: './styles/theme' },
  
  // Assets
  { from: '../images/', to: '../assets/images/' },
  { from: './images/', to: './assets/images/' },
];

// Get all JavaScript and JSX files in src directory
function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      getAllJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Update import paths in a file
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileUpdated = false;
    
    // Look for import statements
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    let replacements = [];
    
    while ((match = importRegex.exec(content)) !== null) {
      const fullImport = match[0];
      const importPath = match[1];
      
      // Check if this import path needs to be updated
      importPathMappings.forEach(mapping => {
        if (importPath === mapping.from || importPath.startsWith(`${mapping.from}/`)) {
          const newImportPath = importPath.replace(mapping.from, mapping.to);
          const newImport = fullImport.replace(importPath, newImportPath);
          
          replacements.push({
            original: fullImport,
            updated: newImport,
            originalPath: importPath,
            updatedPath: newImportPath
          });
        }
      });
    }
    
    // Apply replacements if needed
    if (replacements.length > 0) {
      console.log(`${colors.yellow}Updating imports in:${colors.reset} ${filePath}`);
      
      replacements.forEach(replacement => {
        content = content.replace(replacement.original, replacement.updated);
        console.log(`  ${colors.green}→${colors.reset} ${replacement.originalPath} ${colors.yellow}to${colors.reset} ${replacement.updatedPath}`);
      });
      
      fs.writeFileSync(filePath, content);
      fileUpdated = true;
    }
    
    return fileUpdated;
  } catch (error) {
    console.log(`${colors.red}Error updating ${filePath}:${colors.reset} ${error.message}`);
    return false;
  }
}

// Find and update all JS files
try {
  const srcDir = path.resolve(process.cwd(), 'src');
  const jsFiles = getAllJSFiles(srcDir);
  
  console.log(`${colors.blue}Found ${jsFiles.length} JavaScript/JSX files to process${colors.reset}\n`);
  
  let updatedFiles = 0;
  
  jsFiles.forEach(file => {
    if (updateImportsInFile(file)) {
      updatedFiles++;
    }
  });
  
  console.log(`\n${colors.green}Updated import paths in ${updatedFiles} files${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}Error:${colors.reset} ${error.message}`);
}

// Update the package.json to add a script for running this import updater
try {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts['update-imports']) {
    packageJson.scripts['update-imports'] = 'node scripts/update-imports.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}Updated:${colors.reset} package.json with update-imports script`);
  }
} catch (error) {
  console.log(`${colors.red}Error updating package.json:${colors.reset} ${error.message}`);
}

console.log(`\n${colors.cyan}Import path update completed!${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`1. Run tests to verify applications still works correctly`);
console.log(`2. Check for any imports that might need manual updating`);
console.log(`3. Commit the changes`); 