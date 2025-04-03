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
    
    // First try in the public/output directory (preferred path)
    const baseDir = path.join(process.cwd(), 'public', 'output');
    let fullPath = path.join(baseDir, filePath);
    
    // Log the paths we're checking
    console.log(`Checking primary path: ${fullPath}`);
    
    // If not in public/output, try in the output directory
    if (!fs.existsSync(fullPath)) {
      const altBaseDir = path.join(process.cwd(), 'output');
      const altPath = path.join(altBaseDir, filePath);
      
      console.log(`File not found at primary path, checking alternate path: ${altPath}`);
      
      if (fs.existsSync(altPath)) {
        fullPath = altPath;
      } else {
        // For missing images, return placeholder if needed
        if (filePath.match(/image_\d+\.png$/)) {
          const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.png');
          
          if (fs.existsSync(placeholderPath)) {
            console.log(`Returning placeholder image for missing image: ${filePath}`);
            fullPath = placeholderPath;
          } else {
            // Create a simple placeholder image
            console.error(`File not found at all paths: ${filePath}`);
            return NextResponse.json(
              { error: 'File not found' },
              { status: 404 }
            );
          }
        } else {
          console.error(`File not found at all paths: ${filePath}`);
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }
      }
    }
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase(); // Use filePath, not fullPath to get extension
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
      { error: 'Error serving file: ' + error.message },
      { status: 500 }
    );
  }
} 