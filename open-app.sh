#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}CAMO-GEN Launcher${NC}"
echo "==================\n"

# Check if a server is running on port 3000 or 3001
if lsof -i :3000 > /dev/null 2>&1; then
  echo "${GREEN}Opening CAMO-GEN at http://localhost:3000${NC}"
  open http://localhost:3000
elif lsof -i :3001 > /dev/null 2>&1; then
  echo "${GREEN}Opening CAMO-GEN at http://localhost:3001${NC}"
  open http://localhost:3001
else
  echo "${RED}No CAMO-GEN server detected.${NC}"
  echo "${YELLOW}Starting development server...${NC}"
  
  # Open the redirect page first
  open "$(dirname "$0")/local-redirect.html"
  
  # Start the server in the background
  ./run.sh
fi 