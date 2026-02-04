#!/bin/bash

echo "Installing rApp Manager UI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Installation complete!"
echo "To start the development server, run: npm run dev"
echo "To build for production, run: npm run build"
