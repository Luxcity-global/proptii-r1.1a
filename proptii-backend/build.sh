#!/bin/bash

# Exit on error
set -e

# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js 18.17.1
nvm install 18.17.1
nvm use 18.17.1

# Install dependencies
npm ci

# Install NestJS CLI locally
npm install @nestjs/cli

# Run the build
npx nest build 