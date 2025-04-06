import os
import requests

# --- 🔧 CONFIGURATION ---
GITHUB_REPO = "ashifsheriff/bedtime-stories"
VERCEL_BASE_URL = "https://bedtime-stories.vercel.app"
BRANCH = "main"
STORY_ROOT = "public/output"
REQUIRED_FILES = [
    "story_audio.mp3", "story.txt", "story_segments.json"
] + [f"image_{i}.png" for i in range(1, 11)]

# --- 🔍 UTILITIES ---
def check_github_url(story, file):
    url = f"https://raw.githubusercontent.com/{GITHUB_REPO}/{BRANCH}/public/output/{story}/{file}"
    response = requests.head(url)
    return response.status_code == 200

def check_vercel_url(story, file):
    url = f"{VERCEL_BASE_URL}/output/{story}/{file}"
    response = requests.head(url)
    return response.status_code == 200

# --- 🔍 MAIN CHECKER ---
def main():
    print(f"🔍 Scanning static files in `{STORY_ROOT}`...\n")
    stories = [d for d in os.listdir(STORY_ROOT) if os.path.isdir(os.path.join(STORY_ROOT, d))]

    broken_stories = []

    for story in stories:
        story_path = os.path.join(STORY_ROOT, story)
        local_files = os.listdir(story_path)

        print(f"📘 Story: {story}")
        all_found_locally = True
        all_on_github = True
        all_on_vercel = True

        for file in REQUIRED_FILES:
            local = file in local_files
            github = check_github_url(story, file)
            vercel = check_vercel_url(story, file)

            if not local:
                print(f"   ❌ Missing locally: {file}")
                all_found_locally = False
            elif not github:
                print(f"   ⚠️ Not on GitHub: {file}")
                all_on_github = False
            elif not vercel:
                print(f"   🛑 Not on Vercel: {file}")
                all_on_vercel = False

        if all_found_locally and all_on_github and all_on_vercel:
            print("   ✅ Everything looks good!\n")
        else:
            broken_stories.append(story)
            print("")

    print("\n🧾 Summary:")
    print(f"   Total stories scanned: {len(stories)}")
    print(f"   Stories with Vercel 404s: {len(broken_stories)}")
    for s in broken_stories:
        print(f"   ❌ {s}")

    if broken_stories:
        print("\n📌 Fix Suggestions:")
        print(" - Make sure all files are committed to GitHub inside /public/output/")
        print(" - Remove *.mp3 or /public/output from .gitignore (if present)")
        print(" - Trigger a clean deploy: `vercel --prod --force`")
        print(" - If using Next.js, ensure assets are accessed via `/output/...` paths")
    else:
        print(" ✅ All stories passed checks!")

if __name__ == "__main__":
    main()
