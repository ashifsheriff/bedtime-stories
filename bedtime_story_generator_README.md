# Bedtime Story Generator

A Python script that generates complete bedtime stories for children, including text, images, and audio narration using OpenAI's APIs.

## Features

- Generates 10 unique, creative bedtime stories for children
- Each story includes:
  - A creative title
  - 10 segments of text forming a complete story
  - An illustrative image for each segment
  - Audio narration of the full story
- All content is saved in a structured format for easy integration with the story viewer UI
- Robust error handling with retry logic for API calls
- Command-line options to customize the number of stories and segments

## Requirements

- Python 3.8 or higher
- OpenAI API key with access to GPT-4, DALL-E 3, and TTS-1 models
- Internet connection

## Installation

1. Clone this repository or download the script

2. Install the required dependencies:
   ```bash
   pip install openai python-dotenv pillow requests
   ```

3. Copy the `.env.example` file to `.env` and add your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit the .env file with your API key
   ```

## Usage

Run the script with default settings (generates 10 stories, each with 10 segments):
```bash
python bedtime_story_generator.py
```

Customize the number of stories or segments:
```bash
python bedtime_story_generator.py --stories 5 --segments 8
```

## Output Structure

The script creates the following directory structure for each story:

```
public/
└── output/
    ├── story-title-one/
    │   ├── story.txt           # Complete story text
    │   ├── story_audio.mp3     # Audio narration
    │   ├── story_segments.json # Story data with timing info
    │   ├── image_1.png         # First segment illustration
    │   ├── image_2.png
    │   └── ... (10 images total)
    ├── story-title-two/
    │   └── ...
    └── ...
```

### story_segments.json Format

Each story's `story_segments.json` file follows this format:

```json
{
  "title": "The Story Title",
  "segments": [
    {
      "text": "First segment text...",
      "image": "image_1.png",
      "start": 0,
      "end": 5
    },
    {
      "text": "Second segment text...",
      "image": "image_2.png",
      "start": 5,
      "end": 10
    },
    ...
  ]
}
```

## Warning

This script makes multiple API calls to OpenAI's services, which may incur costs based on your OpenAI account plan. The script includes:
- 10 GPT-4 calls for story ideas (small)
- 10 GPT-4 calls for story generation (medium)
- 100 DALL-E 3 image generation calls (larger cost)
- 10 Text-to-Speech API calls (small to medium)

Please be aware of your usage limits and associated costs.

## Customizing Content

You can modify the prompts in the script to change the style, theme, or format of the generated stories. Look for the following functions:
- `generate_story_ideas()` - For customizing the type of story ideas
- `generate_story_with_segments()` - For changing the story format and style
- `generate_image_for_segment()` - For modifying image style and content

## Troubleshooting

If you encounter errors:

1. Ensure your OpenAI API key is valid and has sufficient credits
2. Check your internet connection
3. If rate-limited by OpenAI, try reducing the number of stories or increasing the delay between API calls
4. For API errors, the script includes retry logic and will attempt 3 times before creating placeholder content

## License

This project is released under the MIT License. 