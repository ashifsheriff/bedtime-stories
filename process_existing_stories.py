#!/usr/bin/env python3
"""
Process Existing Stories Script

This script processes existing story folders in the public/output directory:
1. Reads story_segments.json
2. Creates a properly formatted story.txt file
3. Generates audio narration using OpenAI's Text-to-Speech API
4. Saves the audio as story_audio.mp3
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import sys

# Load environment variables
load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY environment variable is not set.")
    print("Please create a .env file with your OpenAI API key or set it in your environment.")
    print("Example: OPENAI_API_KEY=your_api_key_here")
    sys.exit(1)

client = OpenAI(api_key=api_key)

# Constants
OUTPUT_DIR = Path("public/output")
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def generate_audio(story_text, output_path):
    """Generate audio narration using OpenAI's Text-to-Speech API."""
    for attempt in range(MAX_RETRIES):
        try:
            print("Generating audio narration...")
            response = client.audio.speech.create(
                model="tts-1",
                voice="nova",  # A soothing voice good for bedtime stories
                input=story_text
            )
            
            response.stream_to_file(output_path)
            print(f"✓ Saved audio narration to {output_path}")
            return True
            
        except Exception as e:
            print(f"Error generating audio (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Failed to generate audio after {MAX_RETRIES} attempts.")
                return False

def process_story_folder(folder_path):
    """Process a single story folder."""
    folder_name = folder_path.name
    print(f"\nProcessing story: {folder_name}")
    
    # Check if the folder exists
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"Error: Folder {folder_path} does not exist or is not a directory.")
        return False
    
    # 1. Read story_segments.json
    json_path = folder_path / "story_segments.json"
    if not json_path.exists():
        print(f"Error: story_segments.json not found in {folder_path}")
        return False
    
    try:
        with open(json_path, 'r') as f:
            story_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {json_path}: {e}")
        return False
    except Exception as e:
        print(f"Error reading {json_path}: {e}")
        return False
    
    # 2. Concatenate segments into a full story
    try:
        story_title = story_data.get("title", folder_name)
        segments = story_data.get("segments", [])
        
        if not segments:
            print(f"Error: No story segments found in {json_path}")
            return False
        
        full_story = story_title + "\n\n"
        full_story += "\n\n".join([segment.get("text", "") for segment in segments])
        
        # 3. Save as story.txt
        txt_path = folder_path / "story.txt"
        with open(txt_path, 'w') as f:
            f.write(full_story)
        print(f"✓ Saved story text to {txt_path}")
        
        # 4. Generate audio narration
        audio_path = folder_path / "story_audio.mp3"
        success = generate_audio(full_story, audio_path)
        
        if success:
            print(f"✓ Completed processing story: {story_title}")
            return True
        else:
            print(f"× Failed to generate audio for story: {story_title}")
            return False
        
    except Exception as e:
        print(f"Error processing story in {folder_path}: {e}")
        return False

def main():
    # Check if output directory exists
    if not OUTPUT_DIR.exists() or not OUTPUT_DIR.is_dir():
        print(f"Error: Directory {OUTPUT_DIR} does not exist or is not a directory.")
        return
    
    print(f"Story Processor")
    print(f"==============")
    print(f"Processing stories in directory: {OUTPUT_DIR.absolute()}")
    print(f"This will regenerate story.txt and story_audio.mp3 files for each story folder.")
    print(f"==============\n")
    
    # Get all directories in the output folder
    story_folders = [d for d in OUTPUT_DIR.iterdir() if d.is_dir()]
    
    if not story_folders:
        print(f"No story folders found in {OUTPUT_DIR}")
        return
    
    print(f"Found {len(story_folders)} story folders to process.")
    
    # Track success/failure
    successful = 0
    failed = 0
    
    # Process each story folder
    for i, folder in enumerate(story_folders):
        print(f"\n[{i+1}/{len(story_folders)}] Processing: {folder.name}")
        if process_story_folder(folder):
            successful += 1
        else:
            failed += 1
        
        # Add a delay between stories to manage API rate limits
        if i < len(story_folders) - 1:
            delay = 2  # 2 seconds between stories
            print(f"Waiting {delay} seconds before processing the next story...")
            time.sleep(delay)
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed: {successful} stories")
    print(f"Failed to process: {failed} stories")

if __name__ == "__main__":
    main() 