# Story Regeneration Script

This Python script automates the process of generating new bedtime stories for children based on folder names, using OpenAI's GPT-4 and Text-to-Speech APIs.

## What It Does

1. **Recursively searches** through the `public/output/` directory to find story folders
2. **Converts folder names** into readable story titles (e.g., "lilys-mirror-world" → "Lily's Mirror World")
3. **Generates new stories** using GPT-4 based on the parsed titles
4. **Creates audio narration** using OpenAI's Text-to-Speech API
5. **Preserves** all existing image files and segment structure

## Requirements

- Python 3.8 or higher
- OpenAI API key with access to GPT-4 and TTS-1 models
- Existing story folders in the `public/output/` directory

## Installation

1. Clone the repository or download the script files
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit the .env file with your preferred text editor
   ```

## Usage

Run the script from the command line:

```bash
python regenerate_stories.py
```

The script will:
1. Find all folders containing `story_segments.json` files
2. Display the total number of story folders found
3. Ask for confirmation before proceeding
4. Generate new stories and audio files, displaying progress along the way
5. Report success/failure statistics upon completion

## How It Works

For each story folder, the script:

1. Extracts the folder name (e.g., "lilys-mirror-world")
2. Converts it to a readable title (e.g., "Lily's Mirror World")
3. Uses GPT-4 to generate a ~300-word children's story
4. Saves the story as `story.txt`
5. Creates an audio narration file named `story_audio.mp3`
6. Updates the title in the existing `story_segments.json` file

## Notes

- **Caution:** This script will overwrite existing `story.txt` and `story_audio.mp3` files.
- Folders without a `story_segments.json` file will be skipped.
- The script includes retry logic for API calls (3 attempts with delays).
- API usage incurs costs according to OpenAI's pricing model.

## Customization

You can modify the script to:
- Change the storytelling style or length by editing the prompt in the `generate_story()` function
- Use a different voice for the audio narration by changing the `voice` parameter in the `generate_audio()` function
- Adjust retry parameters by modifying the `MAX_RETRIES` and `RETRY_DELAY` constants

## Troubleshooting

- **API Key Issues:** Ensure your OpenAI API key is valid and has sufficient credits.
- **Rate Limits:** If you hit rate limits, increase the delay between stories.
- **File Access Errors:** Check folder permissions if you encounter file access issues. 