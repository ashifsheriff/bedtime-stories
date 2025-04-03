# Deployment Instructions

This document explains how to deploy the bedtime story application to Vercel.

## Using the Deployment Script

The simplest way to deploy is to use the included script:

```bash
# Make the script executable (first time only)
chmod +x deploy-to-vercel.sh

# Run the deployment script
./deploy-to-vercel.sh
```

This will:
1. Check for and install the Vercel CLI if needed
2. Commit any pending changes
3. Deploy to Vercel production
4. Provide the URL when complete

## Manual Deployment

If you prefer to deploy manually:

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. **Deploy using the Vercel CLI**:
   ```bash
   vercel --prod
   ```

3. **Or deploy from GitHub**:
   - Push your changes to GitHub
   - Vercel will automatically deploy from the connected GitHub repository

## Verifying the Deployment

After deployment, your application should be available at:
[https://multi-modal-n9xye3wao-ashifsheriffs-projects.vercel.app](https://multi-modal-n9xye3wao-ashifsheriffs-projects.vercel.app)

It may take a few minutes for the changes to propagate.

## Troubleshooting

If you don't see the "Next Story" button:

1. Check that `stories.json` exists in the `/public/output/` directory
2. Verify that it contains an array of your actual story folder names
3. Make sure the stories in the JSON file match the folder names exactly
4. Confirm that each story folder contains:
   - `story_segments.json`
   - `story_audio.mp3`
   - The image files referenced in the segments JSON

## Validating the Next Story Button

The Next Story button should appear in the top-right corner of the UI (or centered on mobile). When clicked, it should:

1. Show a loading state with a spinner
2. Load the next story in the list
3. Update the audio, images, and text
4. Loop back to the first story after reaching the end 