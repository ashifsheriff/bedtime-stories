import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Base directory for story files - Using absolute path for macOS
const storyDir = '/Users/ashifsheriff/Documents/AI projects/Multi modal/output';

// Ensure the directory exists
try {
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
    console.log(`Created directory: ${storyDir}`);
  }
} catch (error) {
  console.error(`Error creating directory: ${storyDir}`, error);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  
  if (!file) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  }
  
  // Sanitize filename to prevent path traversal
  const sanitizedFile = path.basename(file);
  const filePath = path.join(storyDir, sanitizedFile);
  
  try {
    // For JSON files, return the parsed JSON
    if (sanitizedFile === 'story_segments.json') {
      const data = await fsPromises.readFile(filePath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    
    // For images and audio, stream the binary data
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const fileStats = await fsPromises.stat(filePath);
    const fileBuffer = await fsPromises.readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(sanitizedFile).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      contentType = `image/${ext.substring(1)}`;
    } else if (ext === '.mp3') {
      contentType = 'audio/mpeg';
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error accessing file:', error);
    return NextResponse.json({ error: 'Error accessing file' }, { status: 500 });
  }
} 