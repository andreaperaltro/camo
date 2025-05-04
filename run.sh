#!/bin/bash

PORT=3000
ALTERNATE_PORT=3001

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}CAMO-GEN Development Server${NC}"
echo "===============================\n"

# Check if port is already in use
check_port() {
  local port=$1
  if lsof -i :$port > /dev/null 2>&1; then
    return 0  # port is in use
  else
    return 1  # port is free
  fi
}

# Function to kill process on port
kill_port_process() {
  local port=$1
  echo "${YELLOW}Stopping existing process on port $port...${NC}"
  lsof -ti :$port | xargs kill -9 > /dev/null 2>&1
  sleep 1
}

# Try the primary port first
if check_port $PORT; then
  echo "${YELLOW}Port $PORT is already in use.${NC}"
  
  # Ask if user wants to kill the process
  read -p "Do you want to stop the existing process? (y/n): " response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    kill_port_process $PORT
  else
    # Try alternate port
    echo "${YELLOW}Trying alternate port $ALTERNATE_PORT...${NC}"
    if check_port $ALTERNATE_PORT; then
      echo "${RED}Alternate port $ALTERNATE_PORT is also in use.${NC}"
      echo "${RED}Please close the applications using these ports and try again.${NC}"
      exit 1
    else
      PORT=$ALTERNATE_PORT
    fi
  fi
fi

echo "${GREEN}Starting Next.js development server on port $PORT...${NC}"

# Set environment variables
export PORT=$PORT
export NEXT_PUBLIC_BASE_URL=http://localhost:$PORT

# Run the development server
npm run dev -- --port $PORT

# If the server stops, print a message
echo "${RED}Server stopped.${NC}"

# Catch any errors
if [ $? -ne 0 ]; then
    echo ""
    echo "Error starting the application."
    echo "You may need to run 'npm install' first."
    exit 1
fi 