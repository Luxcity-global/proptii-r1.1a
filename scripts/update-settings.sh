#!/bin/bash

# Proptii Settings Update Script
# This script automatically updates project settings when changes are detected

# Function to extract environment variables from files
extract_env_vars() {
    local files=("$@")
    local env_vars=()
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            while IFS= read -r line; do
                if [[ $line =~ ^[A-Z_]+= ]]; then
                    var_name=$(echo "$line" | cut -d'=' -f1)
                    env_vars+=("$var_name")
                fi
            done < "$file"
        fi
    done
    
    # Remove duplicates and sort
    echo "${env_vars[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

# Function to extract API endpoints
extract_api_endpoints() {
    local files=("$@")
    local endpoints=()
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            while IFS= read -r line; do
                if [[ $line =~ \"/api/[^\"]+\" ]]; then
                    endpoint=$(echo "$line" | grep -o '\"/api/[^\"]*\"' | tr -d '"')
                    endpoints+=("$endpoint")
                fi
            done < "$file"
        fi
    done
    
    # Remove duplicates and sort
    echo "${endpoints[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

# Function to update settings file
update_settings_file() {
    local settings_file=".proptii-settings"
    local current_time=$(date +%Y-%m-%d_%H-%M-%S)
    
    # Extract current environment variables
    local env_files=(".env.example" ".env.local" ".env.staging" ".env.production")
    local env_vars=($(extract_env_vars "${env_files[@]}"))
    
    # Extract current API endpoints
    local api_files=("src/services/api.ts" "src/pages/**/*.tsx" "src/components/**/*.tsx")
    local api_endpoints=($(extract_api_endpoints "${api_files[@]}"))
    
    # Update settings file
    cat > "$settings_file" << EOF
# Proptii Project Settings
# Last updated: $current_time

# Environment Variables
ENV_VARS=(
    $(printf '"%s"\n' "${env_vars[@]}")
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
    $(printf '"%s"\n' "${api_endpoints[@]}")
)

# Documentation Files
DOCS_FILES=(
    $(find docs -type f -name "*.md" | sort)
)
EOF
    
    echo "Settings file updated successfully"
}

# Function to watch for changes
watch_changes() {
    echo "Watching for changes in project files..."
    
    # Watch for changes in key directories
    inotifywait -m -r -e modify,create,delete \
        src/ \
        docs/ \
        .env* \
        package.json \
        docker-compose.yml \
        --format '%w%f %e' |
    while read file event; do
        echo "Change detected in $file ($event)"
        update_settings_file
    done
}

# Main execution
case "$1" in
    "update")
        update_settings_file
        ;;
    "watch")
        watch_changes
        ;;
    *)
        echo "Usage: $0 {update|watch}"
        exit 1
        ;;
esac 