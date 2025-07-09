#!/bin/bash

# Kill all running MCP backend and frontend servers
pkill -f "ts-node src/server.ts"
pkill -f "vite"

# Start MCP backend
cd "$(dirname "$0")/.."
npm run dev &
BACKEND_PID=$!

# Start MCP frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

# Print PIDs
cd ..
echo "MCP backend started with PID $BACKEND_PID"
echo "MCP frontend started with PID $FRONTEND_PID"
echo "Backend: http://localhost:3002"
echo "Frontend: http://localhost:5180" 