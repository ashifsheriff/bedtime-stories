#!/usr/bin/env python3
"""
Simple script to verify your OpenAI API key is working properly.
This checks access to GPT, DALL-E, and TTS models needed for the bedtime story generator.
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Get API key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("Error: OPENAI_API_KEY environment variable is not set.")
    print("Please create a .env file with your OpenAI API key or set it in your environment.")
    print("Example: OPENAI_API_KEY=your_api_key_here")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

def check_gpt_access():
    """Check if we can access GPT models."""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello, please respond with the word 'success' only."}],
            max_tokens=10
        )
        if "success" in response.choices[0].message.content.lower():
            return True
        return False
    except Exception as e:
        print(f"Error accessing GPT model: {e}")
        return False

def check_dalle_access():
    """Check if we can access DALL-E models."""
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt="A simple blue dot on a white background, minimalist",
            size="1024x1024",
            quality="standard",
            n=1
        )
        # If we get a URL, it worked
        return bool(response.data[0].url)
    except Exception as e:
        print(f"Error accessing DALL-E model: {e}")
        return False

def check_tts_access():
    """Check if we can access TTS models."""
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input="This is a test of the OpenAI text to speech API."
        )
        # If we get content back, it worked
        return bool(response.content)
    except Exception as e:
        print(f"Error accessing TTS model: {e}")
        return False

def main():
    print("Verifying OpenAI API key and model access...")
    
    # Check each model
    gpt_access = check_gpt_access()
    print(f"✓ GPT-4 model access: {'SUCCESS' if gpt_access else 'FAILED'}")
    
    dalle_access = check_dalle_access()
    print(f"✓ DALL-E 3 model access: {'SUCCESS' if dalle_access else 'FAILED'}")
    
    tts_access = check_tts_access()
    print(f"✓ TTS-1 model access: {'SUCCESS' if tts_access else 'FAILED'}")
    
    # Overall status
    if gpt_access and dalle_access and tts_access:
        print("\n✅ All models are accessible! You're ready to run the bedtime story generator.")
        return 0
    else:
        print("\n❌ Some models could not be accessed. Please check your API key and permissions.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 