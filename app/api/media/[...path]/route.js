import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to serve media files (audio, images) from the server
 * This bypasses potential issues with static file serving on Vercel
 * 
 * Access via: /api/media/[story-id]/story_audio.mp3 or /api/media/[story-id]/image_1.png
 */
export async function GET(request, { params }) {
  try {
    // Get the path from the URL parameters
    const pathParts = params.path || [];
    const filePath = pathParts.join('/');
    
    // Validate the path to prevent directory traversal attacks
    if (filePath.includes('..') || !filePath) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    // Set base directory for media files
    const baseDir = path.join(process.cwd(), 'public', 'output');
    const fullPath = path.join(baseDir, filePath);
    
    console.log(`Attempting to serve media file: ${fullPath}`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (ext === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.json') {
      contentType = 'application/json';
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Return file with appropriate content type
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    );
  }
} 