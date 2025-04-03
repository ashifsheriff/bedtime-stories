import os
import json
import time
import random
import argparse
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import requests
from PIL import Image
import io
import re
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
NUM_STORIES = 10
NUM_SEGMENTS = 10
SEGMENT_DURATION = 5  # seconds per segment
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def slugify(text):
    """Convert text to a URL and filesystem-friendly format."""
    # Remove special characters and convert to lowercase
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    # Replace spaces with hyphens
    slug = re.sub(r'[\s]+', '-', slug)
    # Remove consecutive hyphens
    slug = re.sub(r'[-]+', '-', slug)
    # Remove leading and trailing hyphens
    slug = slug.strip('-')
    return slug

def create_output_directory(story_title):
    """Create output directory for a story with a safe name."""
    # Create safe folder name
    safe_title = slugify(story_title)
    
    # Create directory
    story_dir = OUTPUT_DIR / safe_title
    story_dir.mkdir(parents=True, exist_ok=True)
    return story_dir

def generate_story_ideas(num_ideas=10):
    """Generate unique bedtime story ideas using GPT-4."""
    print("Generating story ideas...")
    
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a creative children's book author."},
                    {"role": "user", "content": f"Generate {num_ideas} unique, creative, and wholesome bedtime story ideas for children ages 4-8. Each idea should be exactly 1 sentence with a title in quotes followed by a brief premise. Make them varied in themes (adventure, friendship, animals, fantasy, etc.) and suitable for bedtime reading. Format as a numbered list."}
                ],
                temperature=0.9,
                max_tokens=500
            )
            
            # Parse the ideas from the response
            ideas_text = response.choices[0].message.content
            
            # Extract ideas using regex
            ideas = re.findall(r'\d+\.\s+"([^"]+)":\s*([^\n]+)', ideas_text)
            
            if not ideas or len(ideas) < num_ideas:
                # Fallback parsing if pattern matching fails
                lines = ideas_text.split('\n')
                ideas = []
                for line in lines:
                    if line.strip() and re.match(r'\d+\.', line):
                        title_match = re.search(r'"([^"]+)"', line)
                        if title_match:
                            title = title_match.group(1)
                            # Get everything after the title
                            premise = line.split('"')[2].strip()
                            if premise.startswith(':'):
                                premise = premise[1:].strip()
                            ideas.append((title, premise))
            
            return [(title, premise) for title, premise in ideas[:num_ideas]]
        
        except Exception as e:
            print(f"Error generating story ideas (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print("Failed to generate story ideas after multiple attempts.")
                # Return some default ideas if API calls fail
                return [
                    (f"The Adventure of Sammy {i}", f"A simple story about adventure {i}") 
                    for i in range(1, num_ideas + 1)
                ]

def generate_story_with_segments(title, premise, num_segments=10):
    """Generate a complete story divided into segments using GPT-4."""
    print(f"Generating story: '{title}'...")
    
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a talented children's story writer."},
                    {"role": "user", "content": f"""Write a bedtime story titled "{title}" based on this premise: {premise}. 
                    
                    The story should be 300-400 words total, divided into exactly {num_segments} segments of roughly equal length.
                    
                    Format your response as a JSON object with the following structure:
                    {{
                      "title": "The story title",
                      "segments": [
                        {{ "text": "First segment text..." }},
                        {{ "text": "Second segment text..." }},
                        ...
                      ]
                    }}
                    
                    Make sure each segment logically flows into the next and together they form a complete, engaging bedtime story with a beginning, middle, and end.
                    The story should be child-friendly, warm, and end on a positive, peaceful note suitable for bedtime.
                    Each segment should be 30-40 words.
                    """}
                ],
                temperature=0.7,
                max_tokens=1200,
                response_format={"type": "json_object"}
            )
            
            story_data = json.loads(response.choices[0].message.content)
            return story_data
        
        except Exception as e:
            print(f"Error generating story for '{title}' (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Failed to generate story after {MAX_RETRIES} attempts.")
                # Create a simple fallback story
                segments = [{"text": f"Segment {i} for the story about {title}."} for i in range(1, num_segments + 1)]
                return {"title": title, "segments": segments}

def generate_image_for_segment(story_title, segment_text, index, output_path):
    """Generate an image for a story segment using DALL-E."""
    prompt = f"Create a colorful, child-friendly illustration for a bedtime story titled '{story_title}'. Scene: {segment_text}"
    
    for attempt in range(MAX_RETRIES):
        try:
            print(f"Generating image {index}/{NUM_SEGMENTS} for '{story_title}'...")
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            image_url = response.data[0].url
            
            # Download and save the image
            image_response = requests.get(image_url)
            image = Image.open(io.BytesIO(image_response.content))
            image.save(output_path)
            
            print(f"✓ Saved image {index} to {output_path}")
            # Sleep briefly to avoid rate limits
            time.sleep(1)
            return True
            
        except Exception as e:
            print(f"Error generating image {index} (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Failed to generate image after {MAX_RETRIES} attempts.")
                # Create an empty placeholder image
                try:
                    placeholder = Image.new('RGB', (1024, 1024), color='lightgray')
                    placeholder.save(output_path)
                    print(f"Created placeholder image at {output_path}")
                    return True
                except Exception as e:
                    print(f"Error creating placeholder image: {e}")
                    return False

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
                # Create an empty audio file as placeholder
                try:
                    with open(output_path, 'wb') as f:
                        f.write(b'')  # Empty file
                    print(f"Created placeholder audio file at {output_path}")
                    return True
                except Exception as e:
                    print(f"Error creating placeholder audio file: {e}")
                    return False

def prepare_story_segments_json(story_data):
    """Prepare the story_segments.json data with timing information."""
    segments = story_data["segments"]
    
    # Add timing and image filename to each segment
    for i, segment in enumerate(segments):
        segment["image"] = f"image_{i+1}.png"
        segment["start"] = i * SEGMENT_DURATION
        segment["end"] = (i + 1) * SEGMENT_DURATION
    
    return story_data

def process_story(title, premise, index, total):
    """Process a single story from idea to finished files."""
    print(f"\n[{index}/{total}] Processing story: '{title}'")
    
    # 1. Generate the story with segments
    story_data = generate_story_with_segments(title, premise, NUM_SEGMENTS)
    
    # 2. Create output directory
    story_dir = create_output_directory(story_data["title"])
    print(f"Created directory: {story_dir}")
    
    # 3. Create the full story text
    full_story = story_data["title"] + "\n\n"
    full_story += "\n\n".join([segment["text"] for segment in story_data["segments"]])
    
    # 4. Save the full story as text
    with open(story_dir / "story.txt", "w") as f:
        f.write(full_story)
    print(f"✓ Saved story text to {story_dir / 'story.txt'}")
    
    # 5. Prepare and save story_segments.json
    segments_data = prepare_story_segments_json(story_data)
    with open(story_dir / "story_segments.json", "w") as f:
        json.dump(segments_data, f, indent=2)
    print(f"✓ Saved story segments to {story_dir / 'story_segments.json'}")
    
    # 6. Generate images for each segment
    for j, segment in enumerate(story_data["segments"]):
        image_path = story_dir / f"image_{j+1}.png"
        success = generate_image_for_segment(
            story_data["title"], 
            segment["text"], 
            j+1, 
            image_path
        )
        
        if not success:
            print(f"Warning: Failed to generate image {j+1}")
    
    # 7. Generate audio for the full story
    audio_path = story_dir / "story_audio.mp3"
    generate_audio(full_story, audio_path)
    
    print(f"✓ Completed story {index}/{total}: '{story_data['title']}'")
    print(f"  Saved to: {story_dir}")
    
    return story_dir

def main():
    parser = argparse.ArgumentParser(description='Generate bedtime stories with images and audio')
    parser.add_argument('--stories', type=int, default=NUM_STORIES, help=f'Number of stories to generate (default: {NUM_STORIES})')
    parser.add_argument('--segments', type=int, default=NUM_SEGMENTS, help=f'Number of segments per story (default: {NUM_SEGMENTS})')
    args = parser.parse_args()
    
    num_stories = args.stories
    num_segments = args.segments
    
    # Create main output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Bedtime Story Generator")
    print(f"======================")
    print(f"Generating {num_stories} stories with {num_segments} segments each.")
    print(f"Output directory: {OUTPUT_DIR.absolute()}")
    print(f"This will make multiple calls to OpenAI's API and may take some time.")
    print(f"======================\n")
    
    # Generate story ideas
    story_ideas = generate_story_ideas(num_stories)
    
    # Process each story
    for i, (title, premise) in enumerate(story_ideas):
        story_dir = process_story(title, premise, i+1, num_stories)
        
        # Add a delay between stories to manage API rate limits
        if i < len(story_ideas) - 1:
            delay = random.randint(5, 15)  # Randomized delay
            print(f"Waiting {delay} seconds before starting the next story...")
            time.sleep(delay)
    
    print("\nAll stories generated successfully!")
    print(f"Stories are saved in the '{OUTPUT_DIR}' directory.")

if __name__ == "__main__":
    main() 