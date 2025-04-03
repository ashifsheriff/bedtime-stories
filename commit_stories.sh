#!/usr/bin/env bash

# Script to commit and push story files in public/output directory
# Safely handles repeated runs and error cases

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print error and exit
error_exit() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

# Check if git is initialized
if [ ! -d .git ]; then
  error_exit "Not a git repository. Please run this script from the root of a git repository."
fi

# Check if public/output directory exists
if [ ! -d "public/output" ]; then
  error_exit "Directory 'public/output' not found. Please run this script from the root of your project."
fi

# Get current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ $? -ne 0 ]; then
  error_exit "Failed to determine current branch. Make sure you're not in a detached HEAD state."
fi

echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Add all files in public/output
echo -e "${YELLOW}Adding story files in public/output...${NC}"
git add public/output/

# Check if there are changes to be committed
if git diff --cached --quiet; then
  echo -e "${YELLOW}No changes to commit. Stories are already up to date.${NC}"
  exit 0
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Add/update bedtime stories from generator"

# Push changes
echo -e "${YELLOW}Pushing to ${CURRENT_BRANCH}...${NC}"
git push origin "$CURRENT_BRANCH"

# Success message
echo -e "${GREEN}Success! Stories have been committed and pushed to ${CURRENT_BRANCH}.${NC}"
echo -e "${GREEN}Summary of changes:${NC}"
git show --stat HEAD

# Make the script executable when created
chmod +x commit_stories.sh

exit 0 