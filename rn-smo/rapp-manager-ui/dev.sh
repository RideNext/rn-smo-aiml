#!/bin/bash

# Development mode for rApp Manager UI
# Runs the UI with hot reload and proxies API calls to backend

set -e

echo "=========================================="
echo "rApp Manager UI - Development Mode"
echo "=========================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting development server..."
echo ""
echo "UI: http://localhost:3000"
echo "Backend API (proxy): http://localhost:8081"
echo ""
echo "Make sure the backend is running on port 8081"
echo "Press Ctrl+C to stop"
echo ""

npm run dev
