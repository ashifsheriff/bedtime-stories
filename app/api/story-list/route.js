import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to stories.json file
const storiesJsonPath = path.join(process.cwd(), 'public', 'output', 'stories.json');

export async function GET() {
  try {
    // Check if stories.json exists
    if (fs.existsSync(storiesJsonPath)) {
      try {
        // Read and parse the stories.json file
        const storiesData = JSON.parse(fs.readFileSync(storiesJsonPath, 'utf8'));
        
        if (storiesData.stories && Array.isArray(storiesData.stories)) {
          // Convert folder names to story objects
          const formattedStories = storiesData.stories.map(folderId => {
            // Convert folder name to readable title
            const title = folderId
              .replace(/-/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            return {
              id: folderId,
              title: title,
              baseUrl: '/output'
            };
          });
          
          return NextResponse.json({ stories: formattedStories });
        }
      } catch (error) {
        console.error('Error reading stories.json:', error);
        return NextResponse.json({ error: 'Error parsing stories.json file' }, { status: 500 });
      }
    }
    
    // If no stories.json, return empty array
    return NextResponse.json({ stories: [] });
    
  } catch (error) {
    console.error('Error in story-list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 