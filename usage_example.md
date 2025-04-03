# Story Regeneration: Usage Example

This document demonstrates how to use the `regenerate_stories.py` script to refresh story content and audio for existing story folders in your application.

## Prerequisites

Ensure you have:
- Python 3.8+ installed
- OpenAI API key with access to GPT-4 and TTS APIs
- Setup your environment by copying `.env.example` to `.env` and adding your API key

## Step 1: Verify Existing Stories

First, check your existing story folders:

```bash
ls -la public/output
```

Example output:
```
drwxr-xr-x  5 user  staff  160 May 15 10:42 dragon-story
drwxr-xr-x  5 user  staff  160 May 15 10:43 space-adventure
drwxr-xr-x  5 user  staff  160 May 15 10:44 lilys-mirror-world
```

## Step 2: Run the Regeneration Script

Execute the script:

```bash
python regenerate_stories.py
```

You'll see output like this:

```
Story Regeneration Script
========================
Root directory: /Users/username/project/public/output
This will regenerate story.txt and story_audio.mp3 files for each folder.
IMPORTANT: Existing story files will be overwritten!
========================

Found 3 story folders to process.
Regenerate stories for 3 folders? (y/N): y

[1/3] Processing: dragon-story
Story title: "Dragon Story"
Generating story based on title: "Dragon Story"...
✓ Successfully generated story (302 words)
✓ Saved story text to public/output/dragon-story/story.txt
Generating audio narration...
✓ Saved audio narration to public/output/dragon-story/story_audio.mp3
✓ Updated title in story_segments.json
✓ Completed processing story: Dragon Story
Waiting 5 seconds before processing the next story...

[2/3] Processing: space-adventure
...

Processing complete!
Successfully processed: 3 stories
Failed to process: 0 stories
```

## Step 3: Verify the Results

After running the script, verify that new stories have been generated:

```bash
cat public/output/dragon-story/story.txt
```

You should see a fresh bedtime story with the title "Dragon Story".

## Step 4: Listen to the Audio

You can play the new audio files using any media player:

```bash
# On macOS:
afplay public/output/dragon-story/story_audio.mp3

# On Linux:
mpg123 public/output/dragon-story/story_audio.mp3

# On Windows:
start public/output/dragon-story/story_audio.mp3
```

## Common Issues

1. **API Key Error**: If you see "Error: OPENAI_API_KEY environment variable is not set", check your `.env` file.

2. **Rate Limits**: If you hit OpenAI rate limits, edit the `.env` file to increase `DELAY_BETWEEN_STORIES`.

3. **File Access Error**: Ensure your user has read/write permissions to the output directory.

## Next Steps

After regenerating all stories, restart your Next.js application to see the changes:

```bash
npm run dev
```

Visit http://localhost:3000 to see your refreshed stories. 