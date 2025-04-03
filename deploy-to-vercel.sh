#!/usr/bin/env bash

# Script to deploy the application to Vercel
# This will prepare the project and push the latest changes directly to Vercel

# Set error handling
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing to deploy to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI is not installed. Installing...${NC}"
    npm install -g vercel
fi

# Create backup directory for large files
echo -e "${YELLOW}Creating a backup of large files to reduce function size...${NC}"
mkdir -p .deploy_backup

# Back up the output directory temporarily
if [ -d "output" ]; then
    echo -e "${YELLOW}Backing up output directory...${NC}"
    mv output .deploy_backup/
fi

# Create or update .vercelignore file
echo -e "${YELLOW}Updating .vercelignore file...${NC}"
cat > .vercelignore << EOL
# Exclude large directories from serverless functions
.git
.deploy_backup
public/output/**/*.mp3
public/output/**/*.png
node_modules
.next
.venv
*.mp3
*.png
EOL

# Make sure all changes are committed
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}You have uncommitted changes. Committing them before deployment...${NC}"
    git add .
    git commit -m "Auto-commit before Vercel deployment"
fi

# Deploy to Vercel (production)
echo -e "${YELLOW}Deploying to Vercel production...${NC}"
vercel --prod

# Restore backed up files
echo -e "${YELLOW}Restoring backed up files...${NC}"
if [ -d ".deploy_backup/output" ]; then
    mv .deploy_backup/output ./
fi

# Clean up backup directory
rmdir .deploy_backup 2>/dev/null || true

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app should be available at: multi-modal-n9xye3wao-ashifsheriffs-projects.vercel.app${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for changes to propagate.${NC}"

# Make the script executable
chmod +x deploy-to-vercel.sh 