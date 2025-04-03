# Bedtime Story Generator

This Python script automatically generates 10 unique bedtime stories for children, complete with text, images, and audio narration.

## Features

- Generates 10 unique bedtime story ideas
- Creates short, child-friendly stories (200-300 words each)
- Divides each story into 10 segments
- Generates a custom image for each segment using DALL·E
- Creates audio narration using OpenAI's Text-to-Speech API
- Saves everything in an organized directory structure

## Requirements

- Python 3.7 or later
- OpenAI API key with access to:
  - GPT-4
  - DALL·E 3
  - TTS-1 (Text-to-Speech)

## Installation

1. Clone this repository
2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

Run the script:
```bash
python story_generator.py
```

The script will:
1. Generate 10 unique bedtime story ideas
2. For each story:
   - Create a complete 10-segment story
   - Generate 10 illustrations (one per segment)
   - Create audio narration for the entire story
   - Save everything to a directory named after the story

## Output Structure

```
output/
├── story-one-title/
│   ├── story.txt                 # Complete story text
│   ├── story_segments.json       # Story segments with timing data
│   ├── story_audio.mp3           # Audio narration
│   ├── image_1.png               # Illustrations for each segment
│   ├── image_2.png
│   └── ...
├── story-two-title/
│   └── ...
└── ...
```

## Story Segments JSON Format

Each `story_segments.json` file has this structure:

```json
{
  "title": "Story Title",
  "segments": [
    {
      "text": "Text for the first segment...",
      "image": "image_1.png",
      "start": 0,
      "end": 5
    },
    {
      "text": "Text for the second segment...",
      "image": "image_2.png",
      "start": 5,
      "end": 10
    },
    ...
  ]
}
```

## Notes

- The script includes retry logic for API calls
- Story generation takes time due to multiple API calls (especially for images)
- API usage will incur costs according to OpenAI's pricing
- Segments have fixed timing (5 seconds each by default)

## Customization

You can modify these constants at the top of the script:

```python
NUM_STORIES = 10      # Number of stories to generate
NUM_SEGMENTS = 10     # Segments per story
SEGMENT_DURATION = 5  # Seconds per segment
``` 