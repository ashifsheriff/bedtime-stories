#!/usr/bin/env bash

# Script to deploy the application to Vercel
# This will push the latest changes directly to Vercel

# Set error handling
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI is not installed. Installing...${NC}"
    npm install -g vercel
fi

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

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app should be available at: multi-modal-n9xye3wao-ashifsheriffs-projects.vercel.app${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for changes to propagate.${NC}"

# Make the script executable
chmod +x deploy-to-vercel.sh 