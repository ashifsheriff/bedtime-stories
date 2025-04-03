#!/usr/bin/env python3
"""
Story Regeneration Script

This script recursively iterates through folders in the public/output directory:
1. Parses folder names into readable story titles
2. Uses OpenAI GPT-4 to generate new stories based on titles
3. Overwrites story.txt with the generated content
4. Creates new audio narration using OpenAI's Text-to-Speech API
5. Preserves all other files (images, JSON structure)
"""

import os
import json
import time
import re
import requests
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
RETRY_DELAY = 5  # seconds
DELAY_BETWEEN_STORIES = 2  # seconds

def parse_title_from_folder_name(folder_name):
    """Convert folder name to a readable story title."""
    # Replace hyphens with spaces
    title = folder_name.replace('-', ' ')
    
    # Capitalize words
    title = ' '.join(word.capitalize() for word in title.split())
    
    # Fix apostrophes for possessives and contractions (e.g., "lilys" → "Lily's")
    title = re.sub(r'(\w)s\s', r'\1\'s ', title)
    
    return title

def generate_story(title):
    """Generate a bedtime story based on the title using GPT-4."""
    print(f"Generating story based on title: \"{title}\"...")
    
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a talented children's story writer."},
                    {"role": "user", "content": f"""Write a short bedtime story for children titled "{title}".
                    
                    Requirements:
                    - Around 300 words in length
                    - Appropriate for children aged 4-8
                    - Warm, gentle tone suitable for bedtime
                    - Include a beginning, middle, and end
                    - End with a positive, peaceful resolution
                    - Use simple language but vivid descriptions
                    - Incorporate gentle life lessons or positive values
                    
                    Format the story in clear paragraphs with the title at the top.
                    """}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            story = response.choices[0].message.content.strip()
            print(f"✓ Successfully generated story ({len(story.split())} words)")
            return story
            
        except Exception as e:
            print(f"Error generating story (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Failed to generate story after {MAX_RETRIES} attempts.")
                return None

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
    print(f"\nProcessing story folder: {folder_name}")
    
    # Check if the folder exists
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"Error: Folder {folder_path} does not exist or is not a directory.")
        return False
    
    # Skip if it's not a story folder (check for story_segments.json)
    json_path = folder_path / "story_segments.json"
    if not json_path.exists():
        print(f"Skipping folder {folder_name}: Not a story folder (missing story_segments.json)")
        return False
    
    try:
        # Parse title from folder name
        story_title = parse_title_from_folder_name(folder_name)
        print(f"Story title: \"{story_title}\"")
        
        # Generate story
        story_text = generate_story(story_title)
        if not story_text:
            print(f"× Failed to generate story for: {story_title}")
            return False
        
        # Save story text
        txt_path = folder_path / "story.txt"
        with open(txt_path, 'w') as f:
            f.write(story_text)
        print(f"✓ Saved story text to {txt_path}")
        
        # Generate audio narration
        audio_path = folder_path / "story_audio.mp3"
        success = generate_audio(story_text, audio_path)
        
        if success:
            print(f"✓ Completed processing story: {story_title}")
            
            # Optionally update the story_segments.json with the new story text
            # We'll preserve the existing file structure but just update the "title" field
            try:
                with open(json_path, 'r') as f:
                    segments_data = json.load(f)
                
                # Update title
                segments_data["title"] = story_title
                
                with open(json_path, 'w') as f:
                    json.dump(segments_data, f, indent=2)
                print(f"✓ Updated title in story_segments.json")
            except Exception as e:
                print(f"Note: Could not update story_segments.json title: {e}")
            
            return True
        else:
            print(f"× Failed to generate audio for story: {story_title}")
            return False
        
    except Exception as e:
        print(f"Error processing story in {folder_path}: {e}")
        return False

def process_all_folders(root_dir):
    """Recursively process all folders inside the root directory."""
    all_folders = []
    
    # Collect story folders
    for item in root_dir.iterdir():
        if item.is_dir():
            # Check if this is a direct story folder
            if (item / "story_segments.json").exists():
                all_folders.append(item)
                
            # Check subdirectories recursively
            for subfolder in process_all_folders(item):
                all_folders.append(subfolder)
    
    return all_folders

def main():
    # Check if output directory exists
    if not OUTPUT_DIR.exists() or not OUTPUT_DIR.is_dir():
        print(f"Error: Directory {OUTPUT_DIR} does not exist or is not a directory.")
        return
    
    print(f"Story Regeneration Script")
    print(f"========================")
    print(f"Root directory: {OUTPUT_DIR.absolute()}")
    print(f"This will regenerate story.txt and story_audio.mp3 files for each folder.")
    print(f"IMPORTANT: Existing story files will be overwritten!")
    print(f"========================\n")
    
    # Get all story folders recursively
    story_folders = process_all_folders(OUTPUT_DIR)
    
    if not story_folders:
        print(f"No story folders found in {OUTPUT_DIR}")
        return
    
    print(f"Found {len(story_folders)} story folders to process.")
    
    # Check with user before proceeding
    confirmation = input(f"Regenerate stories for {len(story_folders)} folders? (y/N): ")
    if confirmation.lower() != 'y':
        print("Operation cancelled.")
        return
    
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
            delay = 5  # 5 seconds between stories
            print(f"Waiting {delay} seconds before processing the next story...")
            time.sleep(delay)
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed: {successful} stories")
    print(f"Failed to process: {failed} stories")

if __name__ == "__main__":
    main() 