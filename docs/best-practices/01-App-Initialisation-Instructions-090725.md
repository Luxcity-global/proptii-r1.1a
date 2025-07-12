# App Initialisation Instructions

**Date:** July 9, 2025  
**Version:** 1.0  
**Author:** Proptii Development Team

## Overview

This guide provides step-by-step instructions for initializing both the main Proptii application and the MCP (Model Context Protocol) sandbox environment. Follow these instructions carefully to ensure proper setup and avoid common initialization issues.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Main App Initialization](#main-app-initialization)
3. [MCP Sandbox Initialization](#mcp-sandbox-initialization)
4. [Troubleshooting](#troubleshooting)
5. [Environment Configuration](#environment-configuration)
6. [Best Practices](#best-practices)

---

## Prerequisites

### System Requirements

- **Node.js:** Version 18.x or higher (recommended: 20.x)
- **npm:** Version 9.x or higher
- **Git:** Latest version
- **Operating System:** macOS, Linux, or Windows (WSL recommended for Windows)

### Required Software

- **Code Editor:** VS Code (recommended) or similar
- **Terminal:** iTerm2 (macOS), Windows Terminal, or similar
- **Browser:** Chrome, Firefox, or Safari (latest versions)

### Dependencies

Ensure all required dependencies are installed:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

---

## Main App Initialization

### Step 1: Environment Setup

1. **Navigate to the project root:**

   ```bash
   cd /path/to/proptii-project
   ```

2. **Create frontend .env file in the root folder:**

   ```bash
   # Create frontend environment file
   touch .env
   ```

3. **Create backend .env file in the proptii-backend folder:**

   ```bash
   # Navigate to backend directory
   cd proptii-backend

   # Create backend environment file
   touch .env
   ```

4. **Configure environment variables:**
   - Refer to the Google Docs "environment" file for detailed variable declarations
   - Set up frontend variables in the root `.env` file
   - Set up backend variables in the `proptii-backend/.env` file

### Step 2: Process Cleanup

**⚠️ Important:** Always clean up existing processes before starting new ones to avoid port conflicts.

1. **Kill all running Node.js and Next.js processes:**

   ```bash
   # Kill Node.js processes
   pkill -f node || true

   # Kill Next.js processes
   pkill -f next || true

   # Alternative: Kill all processes on common ports
   lsof -ti:3000 | xargs kill -9 2>/dev/null || true
   lsof -ti:3001 | xargs kill -9 2>/dev/null || true
   lsof -ti:5173 | xargs kill -9 2>/dev/null || true
   ```

2. **Verify processes are stopped:**

   ```bash
   # Check for running Node.js processes
   ps aux | grep node | grep -v grep

   # Check for running Next.js processes
   ps aux | grep next | grep -v grep
   ```

### Step 3: Backend Initialization

1. **Navigate to the backend directory:**

   ```bash
   cd proptii-backend
   ```

2. **Install dependencies (if not already installed):**

   ```bash
   npm install
   ```

3. **Start the backend server:**

   ```bash
   npm run dev
   ```

4. **Wait for backend to fully initialize:**
   - Look for success messages in the terminal
   - Wait approximately 5-10 seconds for the server to be ready
   - Verify the backend is running by checking the terminal output

### Step 4: Frontend Initialization

1. **Open a new terminal window/tab**

2. **Navigate to the project root:**

   ```bash
   cd /path/to/proptii-project
   ```

3. **Clean up any existing frontend processes:**

   ```bash
   pkill -f node || true
   pkill -f next || true
   ```

4. **Install dependencies (if not already installed):**

   ```bash
   npm install
   ```

5. **Start the frontend server:**

   ```bash
   npm run dev
   ```

6. **Verify frontend is running:**
   - Check terminal output for success messages
   - Look for the localhost URL (typically `http://localhost:3000`)

---

## MCP Sandbox Initialization

### Step 1: Environment Setup

1. **Navigate to the MCP sandbox directory:**

   ```bash
   cd mcp-sandbox
   ```

2. **Create backend .env file in the root folder:**

   ```bash
   # Create backend environment file
   touch .env
   ```

3. **Create frontend .env file in the frontend subfolder:**

   ```bash
   # Navigate to frontend directory
   cd frontend

   # Create frontend environment file
   touch .env

   # Return to mcp-sandbox root
   cd ..
   ```

4. **Configure environment variables:**

   **Backend Environment (mcp-sandbox/.env):**

   ```bash
   # Server Configuration
   PORT=3002
   NODE_ENV=development

   # Real Scraping Configuration
   ENABLE_REAL_SCRAPING=true

   # API Configuration
   API_BASE_URL=http://localhost:3002

   # Scraping Settings
   SCRAPING_RATE_LIMIT=2000
   MAX_SCRAPING_PAGES=4
   SCRAPING_TIMEOUT=30000

   # Cache Configuration
   CACHE_EXPIRY=3600
   REDIS_ENABLED=false

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5180

   # Logging
   LOG_LEVEL=debug
   ```

   **Frontend Environment (mcp-sandbox/frontend/.env):**

   ```bash
   # API Configuration
   VITE_API_URL=http://localhost:3002
   VITE_APP_URL=http://localhost:5180

   # Feature Flags
   VITE_ENABLE_DEBUG=true
   VITE_ENABLE_MOCK_DATA=false

   # Development Settings
   VITE_DEV_MODE=true
   VITE_LOG_LEVEL=debug
   ```

   **Note:** The restart scripts will automatically create these files from `.env.example` templates if they don't exist.

### Step 2: Using the Restart Script

**🚀 Recommended Method:** Use the provided restart script for automated setup.

1. **Ensure you're in the mcp-sandbox directory:**

   ```bash
   cd mcp-sandbox
   ```

2. **Choose the appropriate script for your platform:**

   **For Linux/macOS (Bash):**

   ```bash
   # Make the script executable (if needed)
   chmod +x restart-mcp-sandbox.sh

   # Run the restart script
   ./restart-mcp-sandbox.sh
   ```

   **For Windows (PowerShell):**

   ```powershell
   # Run the PowerShell script
   .\restart-mcp-sandbox.ps1
   ```

3. **Script features:**
   - Automatically creates `.env` files from `.env.example` if missing
   - Installs dependencies if `node_modules` directories don't exist
   - Validates environment configuration
   - Handles port conflicts automatically (Vite auto-selects available ports)
   - Provides comprehensive status feedback
   - Opens browser automatically
   - Cross-platform support (Bash and PowerShell)

### What the Restart Script Does

The `restart-mcp-sandbox.sh` script performs the following operations:

1. **Process Cleanup:**

   - Stops all running MCP sandbox servers
   - Kills ts-node, node, and vite processes
   - Waits for processes to fully terminate

2. **Backend Build:**

   - Runs `npm run build` to compile TypeScript
   - Ensures latest changes are included

3. **Backend Startup:**

   - Starts the MCP backend on port 3002
   - Performs health checks
   - Waits for backend to be ready

4. **Frontend Startup:**

   - Starts the MCP frontend on port 5180
   - Opens browser automatically (if possible)

5. **Verification:**
   - Displays server URLs and PIDs
   - Provides monitoring information

### Step 3: Manual Alternative

If you prefer manual setup or the script fails:

1. **Clean up processes:**

   ```bash
   pkill -f "ts-node src/server.ts" 2>/dev/null || true
   pkill -f "node dist/server.js" 2>/dev/null || true
   pkill -f "vite" 2>/dev/null || true
   ```

2. **Build the backend:**

   ```bash
   npm run build
   ```

3. **Start backend:**

   ```bash
   npm start &
   ```

4. **Wait for backend:**

   ```bash
   sleep 5
   ```

5. **Start frontend:**
   ```bash
   cd frontend
   npm run dev -- --port 5180 &
   cd ..
   ```

---

## Verification and Testing

### Main App Verification

1. **Backend Health Check:**

   ```bash
   curl http://localhost:3001/health
   # Should return a health status response
   ```

2. **Frontend Access:**
   - Open browser to `http://localhost:3000`
   - Verify the application loads correctly
   - Check for any console errors

### MCP Sandbox Verification

1. **Backend Health Check:**

   ```bash
   curl http://localhost:3002/health
   # Should return a comprehensive health status with environment info
   ```

   **Expected Response:**

   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-11T10:00:00.000Z",
     "service": "MCP Sandbox Server",
     "version": "1.0.0",
     "environment": {
       "nodeEnv": "development",
       "port": 3002,
       "corsOrigin": "http://localhost:5180"
     },
     "features": {
       "realScraping": true,
       "redisEnabled": false,
       "cacheExpiry": "3600"
     }
   }
   ```

2. **Frontend Access:**

   - Open browser to `http://localhost:5180`
   - Verify the MCP sandbox interface loads
   - Check browser console for any errors

3. **API Documentation:**
   - Access `http://localhost:3002/api/mcp/docs`
   - Verify API documentation is available

### MCP Sandbox Troubleshooting

#### Common Issues

**Port Already in Use:**

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3002 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 5180 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux/macOS
lsof -ti:3002 | xargs kill -9
lsof -ti:5180 | xargs kill -9
```

**Environment File Missing:**

```bash
# The restart scripts will automatically create .env files from .env.example
# If .env.example is missing, create it manually with the variables shown above
```

**Build Failures:**

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

---

## Troubleshooting

### Common Issues

#### Port Conflicts

**Problem:** "Port already in use" errors
**Solution:**

```bash
# Find processes using specific ports
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :5180

# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:5180 | xargs kill -9
```

#### Environment Variables

**Problem:** Missing or incorrect environment variables
**Solution:**

1. Verify `.env` files exist in correct locations
2. Check variable names match documentation
3. Restart servers after environment changes
4. Use `console.log(process.env.VARIABLE_NAME)` for debugging

#### Dependencies

**Problem:** Module not found errors
**Solution:**

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm ls
```

#### Build Errors

**Problem:** TypeScript compilation failures
**Solution:**

```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript configuration
npx tsc --noEmit
```

### Debugging Commands

```bash
# Check running processes
ps aux | grep node
ps aux | grep vite
ps aux | grep next

# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :3002
netstat -tulpn | grep :5180

# Check logs
tail -f logs/app.log
tail -f logs/error.log
```

---

## Environment Configuration

### Required Environment Variables

#### Main App - Frontend (.env in root)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_AUTH_CLIENT_ID=your-client-id

# Feature Flags
NEXT_PUBLIC_ENABLE_FEATURE_X=true
NEXT_PUBLIC_ENABLE_FEATURE_Y=false
```

#### Main App - Backend (proptii-backend/.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=your-database-url
DATABASE_PASSWORD=your-database-password

# Authentication
AUTH_SECRET=your-auth-secret
AUTH_DOMAIN=your-auth-domain
```

#### MCP Sandbox - Backend (mcp-sandbox/.env)

```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# Real Scraping Configuration
ENABLE_REAL_SCRAPING=true

# API Configuration
API_BASE_URL=http://localhost:3002

# Scraping Settings
SCRAPING_RATE_LIMIT=2000
MAX_SCRAPING_PAGES=4
SCRAPING_TIMEOUT=30000

# Cache Configuration
CACHE_EXPIRY=3600
REDIS_ENABLED=false

# CORS Configuration
CORS_ORIGIN=http://localhost:5180

# Logging
LOG_LEVEL=debug
```

#### MCP Sandbox - Frontend (mcp-sandbox/frontend/.env)

```bash
# API Configuration
VITE_API_URL=http://localhost:3002
VITE_APP_URL=http://localhost:5180

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

---

## Best Practices

### Development Workflow

1. **Always clean up processes before starting:**

   - Use the provided cleanup commands
   - Check for port conflicts
   - Verify no conflicting processes are running

2. **Start servers in the correct order:**

   - Backend first, then frontend
   - Wait for backend to be fully ready
   - Verify health checks pass

3. **Use the restart script for MCP sandbox:**

   - Automates the entire process
   - Includes proper cleanup and verification
   - Provides clear status feedback

4. **Monitor logs and errors:**
   - Check terminal output for errors
   - Monitor browser console for frontend issues
   - Use health check endpoints

### Environment Management

1. **Keep environment files secure:**

   - Never commit `.env` files to version control
   - Use `.env.example` files for documentation
   - Rotate secrets regularly

2. **Use different environments:**

   - Development: `NODE_ENV=development`
   - Testing: `NODE_ENV=test`
   - Production: `NODE_ENV=production`

3. **Validate environment variables:**
   - Check required variables are set
   - Validate variable formats
   - Provide clear error messages for missing variables

### Performance Optimization

1. **Use appropriate Node.js version:**

   - Use LTS versions for stability
   - Consider using Node Version Manager (nvm)

2. **Optimize build processes:**

   - Use incremental builds during development
   - Clean builds for production
   - Monitor build times

3. **Monitor resource usage:**
   - Check memory usage
   - Monitor CPU usage
   - Watch for memory leaks

---

## Support and Resources

### Documentation

- **API Documentation:** Available at `/api/docs` endpoints
- **Code Documentation:** Inline comments and JSDoc
- **Architecture Documentation:** In `/docs` folder

### Team Resources

- **Slack Channel:** #proptii-dev
- **Issue Tracking:** GitHub Issues
- **Code Review:** GitHub Pull Requests

### Emergency Contacts

- **Lead Developer:** [Contact Information]
- **DevOps:** [Contact Information]
- **System Administrator:** [Contact Information]

---

## Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.0     | 2025-07-09 | Initial version with comprehensive setup instructions |

---

**Note:** This document should be updated whenever the initialization process changes. Always test the instructions on a clean environment before updating the documentation.
