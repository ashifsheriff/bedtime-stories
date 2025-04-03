# Story Navigation Feature

The "Next Story" feature allows users to cycle through multiple bedtime stories in the application.

## How It Works

1. **Story Discovery**: The application loads stories in the following order:
   - First, it tries to load from `/public/output/stories.json` which contains a simple array of folder names.
   - If that fails, it falls back to the API endpoint at `/api/stories` which scans folders.

2. **Story Format**: Each story needs:
   - A folder in `/public/output/` (e.g., `dragon-story`)
   - A `story_segments.json` file with story text and timing information
   - A `story_audio.mp3` file for narration
   - Image files referenced in the segments JSON (typically `image_1.png`, `image_2.png`, etc.)

3. **Story Navigation**: 
   - The "Next Story" button in the top-right corner advances to the next story
   - When at the last story, it cycles back to the first story
   - A loading state is shown during story transitions

## Setting Up stories.json

The `stories.json` file is a simple way to control which stories appear and in what order:

```json
{
  "stories": [
    "dragon-story",
    "space-adventure",
    "lilys-mirror-world"
  ]
}
```

Place this file in `/public/output/stories.json`. The application will:
1. Convert folder names to readable titles (e.g., "dragon-story" becomes "Dragon Story")
2. Load each story in the order specified

## Troubleshooting

If stories aren't appearing:

1. Check that your stories.json contains the correct folder names
2. Verify that each folder in `/public/output/` contains:
   - `story_segments.json`
   - `story_audio.mp3` 
   - The image files referenced in the segments

3. Check browser console for any loading errors

## Custom Title

By default, the title is generated from the folder name, but you can set a custom title in your `story_segments.json` file:

```json
{
  "title": "Your Custom Story Title",
  "segments": [
    ...
  ]
}
```

## Mobile Support

The UI is fully responsive and works well on mobile devices, with:
- Stacked layout for the title and "Next Story" button on small screens
- Appropriate text sizing and padding
- Touch-friendly controls 