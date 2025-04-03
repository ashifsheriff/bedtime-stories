import os
import json
import time
import random
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import requests
from PIL import Image
import io
import re
import base64

# Load environment variables
load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")
client = OpenAI(api_key=api_key)

# Constants
OUTPUT_DIR = Path("output")
NUM_STORIES = 10
NUM_SEGMENTS = 10
SEGMENT_DURATION = 5  # seconds per segment

def create_output_directory(story_title):
    """Create output directory for a story with a safe name."""
    # Create safe folder name (slugify)
    safe_title = re.sub(r'[^\w\s-]', '', story_title.lower())
    safe_title = re.sub(r'[\s]+', '-', safe_title)
    
    # Create directory
    story_dir = OUTPUT_DIR / safe_title
    story_dir.mkdir(parents=True, exist_ok=True)
    return story_dir

def generate_story_ideas(num_ideas=10):
    """Generate unique bedtime story ideas using GPT-4."""
    print("Generating story ideas...")
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a creative children's book author."},
                {"role": "user", "content": f"Generate {num_ideas} unique, creative, and wholesome bedtime story ideas for children ages 4-8. Each idea should be 1-2 sentences with a title and brief premise. Make them varied in themes (adventure, friendship, animals, fantasy, etc.) and suitable for bedtime reading. Format as a numbered list with the title in quotes followed by the premise."}
            ],
            temperature=0.9,
            max_tokens=500
        )
        
        # Parse the ideas from the response
        ideas_text = response.choices[0].message.content
        # Extract ideas by looking for numbered items
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
        print(f"Error generating story ideas: {e}")
        # Generate some default ideas if API call fails
        return [
            (f"Story {i}", f"A simple premise for story {i}") 
            for i in range(1, num_ideas + 1)
        ]

def generate_story_with_segments(title, premise, num_segments=10):
    """Generate a complete story divided into segments using GPT-4."""
    print(f"Generating story: '{title}'...")
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a talented children's story writer."},
                {"role": "user", "content": f"""Write a bedtime story titled "{title}" based on this premise: {premise}. 
                
                The story should be 200-300 words total, divided into exactly {num_segments} segments of roughly equal length.
                
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
                Each segment should be 20-30 words.
                """}
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        story_data = json.loads(response.choices[0].message.content)
        return story_data
    
    except Exception as e:
        print(f"Error generating story for '{title}': {e}")
        # Create a simple fallback story if API call fails
        segments = [{"text": f"Segment {i} for the story about {title}."} for i in range(1, num_segments + 1)]
        return {"title": title, "segments": segments}

def generate_image_for_segment(story_title, segment_text, index, output_path, retries=2):
    """Generate an image for a story segment using DALL-E."""
    prompt = f"Create a colorful, child-friendly illustration for a bedtime story titled '{story_title}'. Scene: {segment_text}"
    
    for attempt in range(retries + 1):
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
            
            # Sleep briefly to avoid rate limits
            time.sleep(1)
            return True
            
        except Exception as e:
            print(f"Error generating image {index} (attempt {attempt+1}/{retries+1}): {e}")
            if attempt < retries:
                print(f"Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print(f"Failed to generate image after {retries+1} attempts.")
                return False

def generate_audio(story_text, output_path, retries=2):
    """Generate audio narration using OpenAI's Text-to-Speech API."""
    for attempt in range(retries + 1):
        try:
            print("Generating audio narration...")
            response = client.audio.speech.create(
                model="tts-1",
                voice="nova",  # A soothing voice good for bedtime stories
                input=story_text
            )
            
            response.stream_to_file(output_path)
            return True
            
        except Exception as e:
            print(f"Error generating audio (attempt {attempt+1}/{retries+1}): {e}")
            if attempt < retries:
                print(f"Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print(f"Failed to generate audio after {retries+1} attempts.")
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

def main():
    # Create main output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Generate story ideas
    story_ideas = generate_story_ideas(NUM_STORIES)
    
    # Process each story
    for i, (title, premise) in enumerate(story_ideas):
        print(f"\n[{i+1}/{NUM_STORIES}] Processing story: '{title}'")
        
        # Generate story with segments
        story_data = generate_story_with_segments(title, premise, NUM_SEGMENTS)
        
        # Create output directory for this story
        story_dir = create_output_directory(story_data["title"])
        
        # Create the full story text
        full_story = story_data["title"] + "\n\n"
        full_story += "\n\n".join([segment["text"] for segment in story_data["segments"]])
        
        # Save the full story as text
        with open(story_dir / "story.txt", "w") as f:
            f.write(full_story)
        
        # Prepare and save story_segments.json
        segments_data = prepare_story_segments_json(story_data)
        with open(story_dir / "story_segments.json", "w") as f:
            json.dump(segments_data, f, indent=2)
        
        # Generate images for each segment
        for j, segment in enumerate(story_data["segments"]):
            image_path = story_dir / f"image_{j+1}.png"
            success = generate_image_for_segment(
                story_data["title"], 
                segment["text"], 
                j+1, 
                image_path
            )
            
            if not success:
                print(f"Skipping image {j+1} due to generation failure.")
        
        # Generate audio for the full story
        audio_path = story_dir / "story_audio.mp3"
        generate_audio(full_story, audio_path)
        
        print(f"Completed story {i+1}/{NUM_STORIES}: '{story_data['title']}'")
        print(f"Saved to: {story_dir}")
        
        # Add a delay between stories to manage API rate limits
        if i < len(story_ideas) - 1:
            print("Waiting 10 seconds before starting the next story...")
            time.sleep(10)
    
    print("\nAll stories generated successfully!")
    print(f"Stories are saved in the '{OUTPUT_DIR}' directory.")

if __name__ == "__main__":
    main() 