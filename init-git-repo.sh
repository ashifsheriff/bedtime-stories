#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display error messages and exit
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Function to display success messages
success_msg() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to display info messages
info_msg() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Function to display warning messages
warning_msg() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Check if we're in the project root (contains public/output and Next.js files)
check_project_root() {
    if [ ! -d "public/output" ]; then
        error_exit "Directory 'public/output' not found. Please run this script from the root of your project."
    fi
    
    # Check for either package.json or next.config.js to confirm it's a Next.js app
    if [ ! -f "package.json" ] && [ ! -f "next.config.js" ]; then
        error_exit "This doesn't appear to be a Next.js project. Please run this script from the project root."
    fi
    
    success_msg "Confirmed we're in the project root directory."
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error_exit "GitHub CLI (gh) is not installed. Please install it first:
        - macOS: brew install gh
        - Windows: winget install --id GitHub.cli
        - Linux: Follow instructions at https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    fi
    
    # Check if the user is logged in
    if ! gh auth status &> /dev/null; then
        error_exit "You're not logged in to GitHub CLI. Please run 'gh auth login' first."
    fi
    
    success_msg "GitHub CLI is installed and you're logged in."
}

# Initialize Git repository if needed
init_git() {
    if [ -d ".git" ]; then
        warning_msg "Git repository already initialized."
    else
        info_msg "Initializing Git repository..."
        git init
        if [ $? -ne 0 ]; then
            error_exit "Failed to initialize Git repository."
        fi
        success_msg "Git repository initialized."
    fi
}

# Create .gitignore file
create_gitignore() {
    info_msg "Creating .gitignore file..."
    cat > .gitignore << EOL
# Dependencies
/node_modules
/.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
/.next/
/out/
/build

# Misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Deployment
.deploy_backup/
.vercel
EOL
    success_msg ".gitignore file created."
}

# Create GitHub repository
create_github_repo() {
    info_msg "Setting up GitHub repository..."
    
    # Ask for repo name
    read -p "Enter a name for your GitHub repository: " repo_name
    
    if [ -z "$repo_name" ]; then
        error_exit "Repository name cannot be empty."
    fi
    
    # Ask if the repo should be private
    read -p "Should the repository be private? (y/n): " private_choice
    
    privacy_flag=""
    if [[ $private_choice =~ ^[Yy]$ ]]; then
        privacy_flag="--private"
        info_msg "Creating private GitHub repository: $repo_name"
    else
        privacy_flag="--public"
        info_msg "Creating public GitHub repository: $repo_name"
    fi
    
    # Create the repository
    gh repo create "$repo_name" $privacy_flag --source=. --remote=origin
    
    if [ $? -ne 0 ]; then
        error_exit "Failed to create GitHub repository."
    fi
    
    success_msg "GitHub repository '$repo_name' created successfully."
}

# Add and commit files
add_and_commit() {
    info_msg "Adding all files to Git..."
    git add .
    
    if [ $? -ne 0 ]; then
        error_exit "Failed to add files to Git."
    fi
    
    # Check specifically for public/output
    if [ -d "public/output" ]; then
        info_msg "Ensuring public/output directory is included..."
        git add public/output/
    fi
    
    info_msg "Committing files..."
    git commit -m "Initial commit with app and story content"
    
    if [ $? -ne 0 ]; then
        error_exit "Failed to commit files."
    fi
    
    success_msg "Files committed successfully."
}

# Push to GitHub
push_to_github() {
    info_msg "Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -ne 0 ]; then
        # Try pushing to master if main fails
        warning_msg "Failed to push to 'main' branch. Trying 'master' branch..."
        git push -u origin master
        
        if [ $? -ne 0 ]; then
            error_exit "Failed to push to GitHub."
        fi
    fi
    
    success_msg "Code pushed to GitHub successfully."
}

# Main execution
echo -e "${BLUE}=== Initializing Git Repository and GitHub Integration ===${NC}"

# Check prerequisites
check_project_root
check_gh_cli

# Initialize Git repository
init_git

# Create .gitignore
create_gitignore

# Create GitHub repository
create_github_repo

# Add and commit files
add_and_commit

# Push to GitHub
push_to_github

echo -e "${GREEN}=== Repository setup complete! ===${NC}"
echo -e "Your project is now version-controlled and pushed to GitHub." 