#!/bin/bash

# Proptii Development Environment Setup Script
# This script sets up the development environment for the Proptii application.

# Exit on error
set -e

# Print a message with a colored prefix
print_message() {
  local prefix=$1
  local message=$2
  local color=$3
  
  # Default to green if no color is provided
  if [ -z "$color" ]; then
    color="\033[0;32m" # Green
  fi
  
  local reset="\033[0m"
  echo -e "${color}[${prefix}]${reset} ${message}"
}

# Print an info message
info() {
  print_message "INFO" "$1" "\033[0;32m" # Green
}

# Print a warning message
warning() {
  print_message "WARNING" "$1" "\033[0;33m" # Yellow
}

# Print an error message
error() {
  print_message "ERROR" "$1" "\033[0;31m" # Red
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
  info "Checking prerequisites..."
  
  # Check Node.js
  if ! command_exists node; then
    error "Node.js is not installed. Please install Node.js v18.x or later."
    exit 1
  fi
  
  local node_version=$(node -v | cut -d 'v' -f 2)
  local node_major_version=$(echo $node_version | cut -d '.' -f 1)
  
  if [ "$node_major_version" -lt 18 ]; then
    error "Node.js v${node_version} is installed, but v18.x or later is required."
    exit 1
  fi
  
  info "Node.js v${node_version} is installed."
  
  # Check npm
  if ! command_exists npm; then
    error "npm is not installed. Please install npm v9.x or later."
    exit 1
  fi
  
  local npm_version=$(npm -v)
  local npm_major_version=$(echo $npm_version | cut -d '.' -f 1)
  
  if [ "$npm_major_version" -lt 9 ]; then
    warning "npm v${npm_version} is installed, but v9.x or later is recommended."
  else
    info "npm v${npm_version} is installed."
  fi
  
  # Check Git
  if ! command_exists git; then
    error "Git is not installed. Please install Git v2.x or later."
    exit 1
  fi
  
  local git_version=$(git --version | cut -d ' ' -f 3)
  local git_major_version=$(echo $git_version | cut -d '.' -f 1)
  
  if [ "$git_major_version" -lt 2 ]; then
    error "Git v${git_version} is installed, but v2.x or later is required."
    exit 1
  fi
  
  info "Git v${git_version} is installed."
  
  info "All prerequisites are met."
}

# Install dependencies
install_dependencies() {
  info "Installing dependencies..."
  
  # Use npm ci for clean installation
  npm ci
  
  info "Dependencies installed successfully."
}

# Create .env file
create_env_file() {
  info "Creating .env file..."
  
  if [ -f .env ]; then
    warning ".env file already exists. Skipping creation."
    return
  fi
  
  cat > .env << EOL
VITE_AZURE_API_KEY=your_azure_api_key
VITE_AZURE_AD_TENANT_ID=your_azure_ad_tenant_id
VITE_AZURE_AD_CLIENT_ID=your_azure_ad_client_id
VITE_AZURE_AD_TENANT_NAME=your_azure_ad_tenant_name
EOL
  
  info ".env file created successfully."
  warning "Please update the .env file with your actual values."
}

# Run build to verify setup
verify_setup() {
  info "Verifying setup..."
  
  # Run build
  npm run build
  
  info "Setup verified successfully."
}

# Main function
main() {
  info "Starting Proptii development environment setup..."
  
  check_prerequisites
  install_dependencies
  create_env_file
  verify_setup
  
  info "Proptii development environment setup completed successfully."
  info "You can now start the development server with 'npm run dev'."
}

# Run the main function
main 