#!/bin/bash

# Stop any running processes on port 3000
echo "Checking for existing processes on port 3000..."
if lsof -i :3000 -t >/dev/null; then
  echo "Stopping existing process on port 3000"
  kill -9 $(lsof -i :3000 -t) 2>/dev/null || true
fi

# Navigate to the project directory (in case script is run from elsewhere)
cd "$(dirname "$0")"

# Make sure node_modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the development server
echo "Starting Next.js development server..."
npm run dev

# Catch any errors
if [ $? -ne 0 ]; then
    echo ""
    echo "Error starting the application."
    echo "You may need to run 'npm install' first."
    exit 1
fi 