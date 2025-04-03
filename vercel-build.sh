#!/bin/bash

# This script runs during Vercel's build process to optimize the project size

echo "Running custom build script for Vercel..."

# Create optimized stories.json based on available story folders
echo "Creating optimized stories.json..."
node -e "
const fs = require('fs');
const path = require('path');
const publicOutputDir = path.join(process.cwd(), 'public', 'output');

// Function to get story directories
function getStoryDirectories() {
  try {
    if (!fs.existsSync(publicOutputDir)) {
      console.log('public/output directory not found, creating it');
      fs.mkdirSync(publicOutputDir, { recursive: true });
      return [];
    }
    
    return fs.readdirSync(publicOutputDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

// Get story directories
const storyDirs = getStoryDirectories();
console.log('Found story directories:', storyDirs);

// Create stories.json
const storiesJson = {
  stories: storyDirs
};

// Write to file
fs.writeFileSync(
  path.join(publicOutputDir, 'stories.json'),
  JSON.stringify(storiesJson, null, 2)
);

console.log('Created stories.json with', storyDirs.length, 'stories');
"

# Run the normal build command
echo "Running Next.js build..."
npm run build

echo "Custom build script completed." 