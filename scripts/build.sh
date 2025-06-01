#!/bin/bash

# Clean the dist directory
rm -rf dist

# Run the Vite build
npm run build

# Create the images directory in dist if it doesn't exist
mkdir -p dist/images

# Copy all images from public/images to dist/images
cp -r public/images/* dist/images/

# Log the contents of the dist directory
echo "Contents of dist directory:"
ls -la dist/
echo "Contents of dist/images directory:"
ls -la dist/images/ 