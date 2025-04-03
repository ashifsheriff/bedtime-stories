# Multi-Story Bedtime Slideshow

A Next.js application that displays multiple bedtime stories with synchronized audio narration.

## Features

- Multiple story support with "Next Story" navigation
- Automatic story detection from folders in public/output
- Dynamic loading of story content (text, images, audio)
- Responsive slideshow that automatically advances with audio
- Playback controls with progress bar
- Smooth fade transitions between slides and stories
- Loading animations when switching between stories

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create story folders in the `public/output` directory:
   ```
   public/output/
   ├── story-one/
   │   ├── story_segments.json
   │   ├── story_audio.mp3
   │   ├── image_1.png
   │   ├── image_2.png
   │   └── ...
   ├── story-two/
   │   ├── story_segments.json
   │   ├── story_audio.mp3
   │   ├── image_1.png
   │   └── ...
   └── ...
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to [http://localhost:3000](http://localhost:3000)

## JSON Format

Each `story_segments.json` file should have this structure:

```json
{
  "title": "Story Title",
  "segments": [
    {
      "text": "Text to display for this segment",
      "image": "image_1.png",
      "start": 0,
      "end": 15
    },
    ...
  ]
}
```

Each story should include:
- Optional `title` field (will use folder name if not provided)
- `segments` array with text, image filename, and timing information

## Usage

- Click the play button to start the current story
- Use the progress bar to skip to different parts of the story
- Click "Next Story" to advance to the next available story
- Each story automatically navigates through slides based on the audio timing

## Notes

- The application serves files from a directory outside the Next.js public folder
- If files are missing, appropriate error messages will be displayed
- Image errors are handled on a per-slide basis

## Customization

You can customize the appearance by modifying:
- `StoryViewer.jsx`: Main component for layout and functionality
- `tailwind.config.js`: Color scheme and typography
- `styles/globals.css`: Global styles and overrides 