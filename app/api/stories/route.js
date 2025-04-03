import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Base directory for stories
const storiesDir = path.join(process.cwd(), 'public', 'output');

export async function GET() {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(storiesDir)) {
      fs.mkdirSync(storiesDir, { recursive: true });
      return NextResponse.json({ stories: [] });
    }

    // Get all directories in the stories folder
    const items = fs.readdirSync(storiesDir, { withFileTypes: true });
    const storyFolders = items
      .filter(item => item.isDirectory())
      .map(dir => {
        // Check if the directory contains the required files
        const dirPath = path.join(storiesDir, dir.name);
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
        
        return {
          id: dir.name,
          title: title,
          valid: hasSegmentsJson && hasAudio
        };
      })
      .filter(story => story.valid); // Only include folders with the required files

    return NextResponse.json({ stories: storyFolders });
    
  } catch (error) {
    console.error('Error accessing stories directory:', error);
    return NextResponse.json({ error: 'Error accessing stories directory' }, { status: 500 });
  }
} 