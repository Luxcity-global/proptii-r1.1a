#!/bin/bash

echo "🚀 MCP Sandbox Restart Script"
echo "================================"

# Environment validation
echo "🔍 Checking environment setup..."

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: Backend .env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "❌ Error: No .env.example file found. Please create .env manually."
        exit 1
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Warning: Frontend .env file not found."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env from frontend/.env.example"
    else
        echo "ℹ️  Note: Frontend .env not found, but this may be optional."
    fi
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# 1. Stop all running servers (backend and frontend)
echo "🛑 Stopping all running MCP sandbox servers..."
pkill -f "ts-node src/server.ts" 2>/dev/null || true
pkill -f "node dist/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "frontend" 2>/dev/null || true

# Wait a moment for processes to fully stop
sleep 2

# 2. Build the backend (ensure latest changes are compiled)
echo "🔨 Building MCP backend..."
npm run build

# 3. Start backend
echo "🚀 Starting MCP backend on port 3002..."
npm start &
BACKEND_PID=$!

# 4. Wait for backend to propagate
echo "⏳ Waiting for backend to start..."
sleep 5

# 5. Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed. Starting anyway..."
fi

# 6. Start frontend (Vite will auto-select available port)
echo "🎨 Starting MCP frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 MCP Sandbox is starting!"
echo "================================"
echo "📊 Backend: http://localhost:3002"
echo "🎨 Frontend: http://localhost:5180 (or auto-selected port)"
echo "🏥 Health Check: http://localhost:3002/health"
echo "📚 API Docs: http://localhost:3002/api/mcp/docs"
echo ""
echo "💡 To stop all servers, run: pkill -f 'node\|vite'"
echo "💡 Or use Ctrl+C in this terminal"
echo ""
echo "⏳ Waiting for frontend to start..."
sleep 3

# 7. Open browser (optional)
echo "🌐 Opening browser..."
open http://localhost:5180 2>/dev/null || echo "Could not open browser automatically"

echo ""
echo "✅ MCP Sandbox restart complete!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID" 