#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder(output_path):
    """Create a standard placeholder image."""
    # Create a placeholder image with text
    width, height = 800, 600
    image = Image.new('RGB', (width, height), color=(25, 25, 112))  # Midnight blue
    
    # Add text
    draw = ImageDraw.Draw(image)
    
    # Draw title
    title_text = "Bedtime Story"
    title_position = (width // 2, height // 3)
    try:
        draw.text(title_position, title_text, fill=(255, 255, 255), anchor="mm")
        
        # Draw segment note
        segment_text = "Image Not Available"
        segment_position = (width // 2, height // 2)
        draw.text(segment_position, segment_text, fill=(200, 200, 200), anchor="mm")
        
        # Draw additional note
        note_text = "Placeholder Image"
        note_position = (width // 2, 2 * height // 3)
        draw.text(note_position, note_text, fill=(150, 150, 150), anchor="mm")
    except TypeError:
        # If anchor not supported (older PIL version), use alternative approach
        draw.text(
            (width // 2 - 60, height // 3), 
            title_text, 
            fill=(255, 255, 255)
        )
        draw.text(
            (width // 2 - 80, height // 2), 
            "Image Not Available", 
            fill=(200, 200, 200)
        )
        draw.text(
            (width // 2 - 70, 2 * height // 3), 
            "Placeholder Image", 
            fill=(150, 150, 150)
        )
    
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save the image
    image.save(output_path)
    print(f"Created placeholder image at {output_path}")

if __name__ == "__main__":
    # Create the standard placeholder image
    create_placeholder("public/placeholder.png")
    print("Done!") 