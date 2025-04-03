import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Base directories for stories
const publicStoriesDir = path.join(process.cwd(), 'public', 'output');
const outputStoriesDir = path.join(process.cwd(), 'output');

// Function to get story folders from a directory
function getStoryFolders(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const items = fs.readdirSync(directory, { withFileTypes: true });
  return items
    .filter(item => item.isDirectory())
    .map(dir => {
      // Check if the directory contains the required files
      const dirPath = path.join(directory, dir.name);
      const hasSegmentsJson = fs.existsSync(path.join(dirPath, 'story_segments.json'));
      const hasAudio = fs.existsSync(path.join(dirPath, 'story_audio.mp3'));
      
      // Try to get a title from the JSON file if it exists
      let title = dir.name;
      if (hasSegmentsJson) {
        try {
          const jsonData = JSON.parse(fs.readFileSync(path.join(dirPath, 'story_segments.json'), 'utf8'));
          if (jsonData.title) {
            title = jsonData.title;
          }
        } catch (e) {
          // If there's an error reading the JSON, just use the directory name
          console.error(`Error reading JSON from ${dir.name}:`, e);
        }
      }
      
      // Determine if this is from public directory or regular output
      const isPublic = directory.includes('public');
      const baseUrl = isPublic ? '/public/output' : '/output';
      
      return {
        id: dir.name,
        title: title,
        valid: hasSegmentsJson && hasAudio,
        isPublic: isPublic,
        baseUrl: baseUrl
      };
    })
    .filter(story => story.valid); // Only include folders with the required files
}

export async function GET() {
  try {
    // Ensure the directories exist
    if (!fs.existsSync(publicStoriesDir)) {
      fs.mkdirSync(publicStoriesDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputStoriesDir)) {
      fs.mkdirSync(outputStoriesDir, { recursive: true });
    }

    // Get stories from both directories
    const publicStories = getStoryFolders(publicStoriesDir);
    const outputStories = getStoryFolders(outputStoriesDir);
    
    // Combine all stories
    const allStories = [...publicStories, ...outputStories];
    
    return NextResponse.json({ stories: allStories });
    
  } catch (error) {
    console.error('Error accessing stories directories:', error);
    return NextResponse.json({ error: 'Error accessing stories directories' }, { status: 500 });
  }
} 