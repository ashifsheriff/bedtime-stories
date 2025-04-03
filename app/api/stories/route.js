import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Base directories for stories
const publicStoriesDir = path.join(process.cwd(), 'public', 'output');
const storiesJsonPath = path.join(publicStoriesDir, 'stories.json');

export async function GET() {
  try {
    // First try to read from stories.json
    if (fs.existsSync(storiesJsonPath)) {
      try {
        const storiesData = JSON.parse(fs.readFileSync(storiesJsonPath, 'utf8'));
        
        if (storiesData.stories && Array.isArray(storiesData.stories)) {
          // Convert simple array of folder names to story objects
          const formattedStories = storiesData.stories.map(folderId => {
            // Convert folder ID to a readable title
            const title = folderId
              .replace(/-/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            return {
              id: folderId,
              title: title,
              valid: true,
              isPublic: true,
              baseUrl: '/output'
            };
          });
          
          return NextResponse.json({ stories: formattedStories });
        }
      } catch (error) {
        console.error('Error reading stories.json:', error);
        // Fall through to directory scanning if JSON parsing fails
      }
    }
    
    // Fallback to public directory only (skip the output directory to reduce bundle size)
    if (!fs.existsSync(publicStoriesDir)) {
      fs.mkdirSync(publicStoriesDir, { recursive: true });
      return NextResponse.json({ stories: [] });
    }
    
    // Only scan the public directory to reduce size
    const publicStories = getStoryFolders(publicStoriesDir);
    return NextResponse.json({ stories: publicStories });
    
  } catch (error) {
    console.error('Error accessing stories directories:', error);
    return NextResponse.json({ error: 'Error accessing stories directories' }, { status: 500 });
  }
}

// Function to get story folders from a directory
function getStoryFolders(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const items = fs.readdirSync(directory, { withFileTypes: true });
  return items
    .filter(item => item.isDirectory())
    .map(dir => {
      // Just check if the directory contains a segments file
      // Don't read the file contents to reduce memory usage
      const dirPath = path.join(directory, dir.name);
      const hasSegmentsJson = fs.existsSync(path.join(dirPath, 'story_segments.json'));
      
      // Convert folder name to title without reading JSON
      const title = dir.name
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        id: dir.name,
        title: title,
        valid: hasSegmentsJson,
        isPublic: true,
        baseUrl: '/output'
      };
    })
    .filter(story => story.valid); // Only include folders with the required files
} 