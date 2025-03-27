#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to generate a relative import path
function getRelativeImportPath(fromPath, toPath) {
  const fromDir = path.dirname(fromPath);
  let relativePath = path.relative(fromDir, toPath);
  
  // Ensure the path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }
  
  // Remove file extension for JS/TS imports
  const extname = path.extname(relativePath);
  if (['.js', '.jsx', '.ts', '.tsx'].includes(extname)) {
    relativePath = relativePath.slice(0, -extname.length);
  }
  
  return relativePath;
}

// Read a mapping file
function readMappingFile(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(chalk.red(`Error reading mapping file ${filename}: ${err.message}`));
    return {};
  }
}

// Update imports in a file
function updateImportsInFile(filePath, pathMappings) {
  console.log(chalk.blue(`\nUpdating imports in ${filePath}...`));
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Process each import statement
    const importRegex = /import\s+(?:(?:{[^}]+})|(?:[^{}]+))\s+from\s+(['"])([^'"]+)(['"])/g;
    
    // Create a map of original source paths to their new locations
    const sourcePaths = Object.keys(pathMappings);
    
    content = content.replace(importRegex, (match, quote1, importPath, quote2) => {
      // Skip absolute imports and node_modules
      if (importPath.startsWith('/') || !importPath.startsWith('.')) {
        return match;
      }
      
      // Resolve the absolute path of the imported file
      const currentDir = path.dirname(filePath);
      const absoluteImportPath = path.resolve(currentDir, importPath);
      
      // Check if the imported file has been moved
      const matchedSourcePath = sourcePaths.find(sourcePath => {
        // Remove extension for comparison
        const sourcePathNoExt = sourcePath.replace(/\.(js|jsx|ts|tsx)$/, '');
        const absoluteImportPathNoExt = absoluteImportPath.replace(/\.(js|jsx|ts|tsx)$/, '');
        return sourcePathNoExt === absoluteImportPathNoExt;
      });
      
      if (matchedSourcePath) {
        const newPath = pathMappings[matchedSourcePath];
        const newRelativePath = getRelativeImportPath(filePath, newPath);
        
        console.log(chalk.green(`  ${importPath} -> ${newRelativePath}`));
        modified = true;
        
        return `import ${quote1}${newRelativePath}${quote2}`;
      }
      
      return match;
    });
    
    // Write back the file if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(`✓ Updated imports in ${filePath}`));
    } else {
      console.log(chalk.yellow(`  No imports needed updating in ${filePath}`));
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error updating imports in ${filePath}: ${err.message}`));
  }
}

// Update imports in all test files
function updateAllImports() {
  console.log(chalk.blue('🔄 Updating import paths in moved files...'));
  
  // Read the mapping files
  console.log(chalk.blue('\nReading path mappings...'));
  
  const testPathMappings = readMappingFile('scripts/test-path-mapping.json');
  console.log(chalk.green(`✓ Found ${Object.keys(testPathMappings).length} test path mappings`));
  
  const demoPathMappings = readMappingFile('scripts/demo-path-mapping.json');
  console.log(chalk.green(`✓ Found ${Object.keys(demoPathMappings).length} demo path mappings`));
  
  // Combine all mappings
  const allMappings = { ...testPathMappings, ...demoPathMappings };
  
  // Update imports in each moved file
  const targetFiles = Object.values(allMappings);
  
  if (targetFiles.length === 0) {
    console.log(chalk.yellow('\nNo files to update.'));
    return;
  }
  
  // Update imports in each moved file
  targetFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      updateImportsInFile(filePath, allMappings);
    } else {
      console.log(chalk.yellow(`⚠️ File does not exist: ${filePath}`));
    }
  });
  
  console.log(chalk.green('\n✅ Import paths have been updated!'));
}

// Main function
function main() {
  console.log(chalk.blue('🔗 Import Path Update Tool 🔗'));
  console.log(chalk.yellow('This tool will update import paths in moved test and demo files.'));
  
  updateAllImports();
}

main(); 