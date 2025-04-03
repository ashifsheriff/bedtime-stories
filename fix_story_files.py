#!/usr/bin/env python3
import os
import json
import logging
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Set, Tuple
from dotenv import load_dotenv
import requests
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OPENAI_API_KEY not found in .env file")
    exit(1)

# Set up OpenAI client
client = OpenAI(api_key=api_key)

# TTS voice options from .env or use defaults
tts_voice = os.getenv("TTS_VOICE", "alloy")
tts_model = os.getenv("TTS_MODEL", "tts-1")

# Define the base directory
base_dir = Path("public/output")

def check_required_files(story_dir: Path) -> Dict[str, bool]:
    """Check for required files in the story directory."""
    status = {
        "story_segments.json": os.path.exists(story_dir / "story_segments.json"),
        "story.txt": os.path.exists(story_dir / "story.txt"),
        "story_audio.mp3": os.path.exists(story_dir / "story_audio.mp3"),
    }
    
    # Check for images
    missing_images = []
    for i in range(1, 11):
        image_path = story_dir / f"image_{i}.png"
        if not image_path.exists():
            missing_images.append(f"image_{i}.png")
    
    status["missing_images"] = missing_images
    
    return status

def fix_segment_timings(story_dir: Path) -> bool:
    """Fix segment timings in story_segments.json if needed."""
    try:
        json_path = story_dir / "story_segments.json"
        with open(json_path, "r") as f:
            data = json.load(f)
        
        if "segments" not in data:
            logger.error(f"Invalid story_segments.json format in {story_dir.name}: missing 'segments' key")
            return False
        
        segments = data["segments"]
        if not segments or not isinstance(segments, list):
            logger.error(f"Invalid segments format in {story_dir.name}")
            return False
        
        # Check if we need to fix the timings
        needs_fixing = False
        for i, segment in enumerate(segments):
            if "start" not in segment or "end" not in segment:
                needs_fixing = True
                break
            
            # Check for invalid timing values
            if segment["end"] <= segment["start"] or (i > 0 and segment["start"] != segments[i-1]["end"]):
                needs_fixing = True
                break
        
        if needs_fixing:
            logger.info(f"Fixing segment timings for {story_dir.name}")
            
            # Estimate total duration based on text length
            total_text = ""
            for segment in segments:
                if "text" in segment:
                    total_text += segment["text"]
            
            # Average reading speed: ~150 words per minute
            words = len(total_text.split())
            estimated_duration = max(30, words / 150 * 60)  # Minimum 30 seconds
            segment_duration = estimated_duration / len(segments)
            
            # Update segments with proper timings
            for i, segment in enumerate(segments):
                segment["start"] = i * segment_duration
                segment["end"] = (i + 1) * segment_duration
            
            # Save updated JSON
            with open(json_path, "w") as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Updated segment timings for {story_dir.name}")
            return True
        
        return False
    except Exception as e:
        logger.error(f"Error fixing segment timings for {story_dir.name}: {e}")
        return False

def create_placeholder_image(story_dir: Path, image_name: str) -> bool:
    """Create a placeholder image file."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Extract story name from directory
        story_name = story_dir.name.replace('-', ' ').title()
        
        # Extract segment number from image name
        segment_num = image_name.replace("image_", "").replace(".png", "")
        
        # Create a placeholder image with text
        width, height = 800, 600
        image = Image.new('RGB', (width, height), color=(25, 25, 112))  # Midnight blue
        
        # Add text
        draw = ImageDraw.Draw(image)
        
        # Draw title
        title_text = f"{story_name}"
        title_position = (width // 2, height // 3)
        draw.text(title_position, title_text, fill=(255, 255, 255), anchor="mm")
        
        # Draw segment number
        segment_text = f"Segment {segment_num}"
        segment_position = (width // 2, height // 2)
        draw.text(segment_position, segment_text, fill=(200, 200, 200), anchor="mm")
        
        # Draw note
        note_text = "Placeholder image"
        note_position = (width // 2, 2 * height // 3)
        draw.text(note_position, note_text, fill=(150, 150, 150), anchor="mm")
        
        # Save the image
        image_path = story_dir / image_name
        image.save(image_path)
        
        logger.info(f"Created placeholder image: {image_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating placeholder image {image_name} for {story_dir.name}: {e}")
        return False

def create_story_txt(story_dir: Path) -> bool:
    """Create story.txt from story_segments.json."""
    try:
        with open(story_dir / "story_segments.json", "r") as f:
            data = json.load(f)
        
        if "segments" in data:
            segments = data["segments"]
        else:
            # Handle case where the JSON might be just an array
            segments = data
        
        full_story = "\n\n".join(segment["text"] for segment in segments if "text" in segment)
        
        with open(story_dir / "story.txt", "w") as f:
            f.write(full_story)
        
        logger.info(f"Created story.txt for {story_dir.name}")
        return True
    except Exception as e:
        logger.error(f"Error creating story.txt for {story_dir.name}: {e}")
        return False

def generate_story_audio(story_dir: Path) -> bool:
    """Generate story_audio.mp3 using OpenAI TTS API."""
    try:
        story_path = story_dir / "story.txt"
        
        if not story_path.exists():
            logger.error(f"Cannot generate audio: story.txt not found in {story_dir.name}")
            return False
        
        with open(story_path, "r") as f:
            story_text = f.read()
        
        if not story_text.strip():
            logger.error(f"Cannot generate audio: story.txt is empty in {story_dir.name}")
            return False
        
        logger.info(f"Generating audio for {story_dir.name} using OpenAI TTS API...")
        
        audio_file = client.audio.speech.create(
            model=tts_model,
            voice=tts_voice,
            input=story_text
        )
        
        # Save the audio file
        audio_path = story_dir / "story_audio.mp3"
        audio_file.stream_to_file(str(audio_path))
        
        logger.info(f"Created story_audio.mp3 for {story_dir.name}")
        
        # Wait a bit for the filesystem to catch up
        time.sleep(1)
        
        return True
    except Exception as e:
        logger.error(f"Error generating audio for {story_dir.name}: {e}")
        return False

def run_git_command(command: List[str]) -> Tuple[int, str, str]:
    """Run a git command and return exit code, stdout, and stderr."""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr

def commit_changes() -> bool:
    """Commit and push changes if any were made."""
    # Check if there are changes to commit
    returncode, stdout, stderr = run_git_command(["git", "status", "--porcelain", "public/output"])
    
    if not stdout.strip():
        logger.info("No changes to commit")
        return False
    
    # Add changes
    returncode, stdout, stderr = run_git_command(["git", "add", "public/output"])
    if returncode != 0:
        logger.error(f"Error adding files to git: {stderr}")
        return False
    
    # Commit changes
    returncode, stdout, stderr = run_git_command(["git", "commit", "-m", "Fix and update story files"])
    if returncode != 0:
        logger.error(f"Error committing changes: {stderr}")
        return False
    
    # Push changes
    returncode, stdout, stderr = run_git_command(["git", "push", "origin", "main"])
    if returncode != 0:
        logger.error(f"Error pushing changes: {stderr}")
        return False
    
    logger.info("Successfully committed and pushed changes")
    return True

def main():
    """Main function to process all story folders."""
    if not base_dir.exists():
        logger.error(f"Base directory {base_dir} does not exist")
        return
    
    # Track changes for git
    changes_made = False
    
    # Process each story folder
    story_folders = [f for f in base_dir.iterdir() if f.is_dir()]
    total_folders = len(story_folders)
    
    if total_folders == 0:
        logger.warning(f"No story folders found in {base_dir}")
        return
    
    logger.info(f"Found {total_folders} story folders to process")
    
    for i, story_dir in enumerate(story_folders, 1):
        logger.info(f"Processing folder {i}/{total_folders}: {story_dir.name}")
        
        # Check required files
        status = check_required_files(story_dir)
        
        # Fix segment timings if needed
        if status["story_segments.json"]:
            if fix_segment_timings(story_dir):
                changes_made = True
        
        # Create missing placeholder images
        if status["missing_images"]:
            logger.warning(f"Missing images in {story_dir.name}: {', '.join(status['missing_images'])}")
            for image_name in status["missing_images"]:
                if create_placeholder_image(story_dir, image_name):
                    changes_made = True
        
        # Check and create story.txt if needed
        if not status["story.txt"] and status["story_segments.json"]:
            if create_story_txt(story_dir):
                changes_made = True
        
        # Check and create story_audio.mp3 if needed
        if not status["story_audio.mp3"]:
            # Ensure story.txt exists first
            if not status["story.txt"]:
                if not create_story_txt(story_dir):
                    logger.error(f"Cannot proceed with audio generation: Failed to create story.txt for {story_dir.name}")
                    continue
            
            # Now try to generate audio
            if generate_story_audio(story_dir):
                changes_made = True
    
    # Commit changes if any were made
    if changes_made:
        logger.info("Attempting to commit and push changes...")
        commit_changes()
    else:
        logger.info("No changes were made, skipping git operations")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"Unexpected error: {e}", exc_info=True) 