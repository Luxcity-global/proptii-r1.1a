#!/bin/bash

# Proptii Project Initialization Script
# This script helps new developers set up the project and ensures all settings are properly configured

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to update settings
update_settings() {
    local settings_file=".proptii-settings"
    local current_time=$(date +%Y-%m-%d_%H-%M-%S)
    
    # Create or update settings file
    cat > "$settings_file" << EOF
# Proptii Project Settings
# Last updated: $current_time

# Environment Variables
ENV_VARS=(
    "VITE_API_URL"
    "VITE_AZURE_OPENAI_API_KEY"
    "VITE_AZURE_STORAGE_ACCOUNT"
    "VITE_AZURE_STORAGE_CONTAINER_NAME"
    "VITE_AZURE_STORAGE_SAS_TOKEN"
)

# Required Tools
REQUIRED_TOOLS=(
    "node"
    "npm"
    "git"
    "docker"
)

# Project Structure
PROJECT_STRUCTURE=(
    "src/components"
    "src/hooks"
    "src/services"
    "src/utils"
    "src/pages"
    "src/docs"
    "src/tests"
)

# Database Configuration
DB_CONFIG=(
    "host=localhost"
    "port=5432"
    "database=proptii"
    "user=postgres"
    "password=postgres"
)

# API Endpoints
API_ENDPOINTS=(
    "/api/listings"
    "/api/search"
    "/api/images"
    "/api/auth"
)

# Documentation Files
DOCS_FILES=(
    "docs/best-practices/maintenance.md"
    "docs/features/agent-portal.md"
    "docs/features/ai-search-input.md"
    "docs/development/DevelopmentSetup.md"
    "docs/backend-integration.md"
)
EOF

    print_status "Settings file updated with current configuration"
}

# Main initialization function
init_project() {
    echo -e "${GREEN}Starting Proptii Project Initialization...${NC}"
    
    # Check for required tools
    print_status "Checking required tools..."
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if ! command_exists "$tool"; then
            print_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Clone repository if not already cloned
    if [ ! -d ".git" ]; then
        print_status "Cloning repository..."
        git clone https://github.com/your-organization/proptii.git .
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Create environment files
    print_status "Setting up environment files..."
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        print_warning "Please update .env.local with your environment variables"
    fi
    
    # Setup database
    print_status "Setting up database..."
    if command_exists "docker"; then
        docker-compose up -d db
        sleep 5 # Wait for database to start
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    npm run migrate
    
    # Build project
    print_status "Building project..."
    npm run build
    
    # Run tests
    print_status "Running tests..."
    npm test
    
    # Update settings
    update_settings
    
    # Create documentation index
    print_status "Creating documentation index..."
    cat > "docs/README.md" << EOF
# Proptii Documentation

## Project Setup
- [Development Setup](development/DevelopmentSetup.md)
- [Backend Integration](backend-integration.md)

## Features
- [Agent Portal](features/agent-portal.md)
- [AI Search Input](features/ai-search-input.md)

## Best Practices
- [Maintenance Guide](best-practices/maintenance.md)

## Last Updated: $(date)
EOF
    
    print_status "Initialization complete!"
    print_warning "Please review the following:"
    echo "1. Update .env.local with your environment variables"
    echo "2. Check database configuration in docker-compose.yml"
    echo "3. Review documentation in docs/README.md"
    echo "4. Run 'npm run dev' to start the development server"
}

# Function to check for updates
check_updates() {
    print_status "Checking for updates..."
    git fetch origin
    
    if [ $(git rev-list HEAD...origin/main --count) -gt 0 ]; then
        print_warning "Updates available. Pulling latest changes..."
        git pull origin main
        
        # Update settings after pulling changes
        update_settings
        
        # Reinstall dependencies if package.json changed
        if git diff --name-only HEAD@{1} HEAD | grep -q "package.json"; then
            print_status "Updating dependencies..."
            npm ci
        fi
        
        # Run migrations if database changes detected
        if git diff --name-only HEAD@{1} HEAD | grep -q "migrations/"; then
            print_status "Running database migrations..."
            npm run migrate
        fi
    else
        print_status "Project is up to date"
    fi
}

# Main execution
case "$1" in
    "init")
        init_project
        ;;
    "update")
        check_updates
        ;;
    *)
        echo "Usage: $0 {init|update}"
        exit 1
        ;;
esac 