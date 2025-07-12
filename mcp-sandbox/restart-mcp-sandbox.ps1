# MCP Sandbox Restart Script (PowerShell)
Write-Host "🚀 MCP Sandbox Restart Script (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Environment validation
Write-Host "🔍 Checking environment setup..." -ForegroundColor Yellow

# Check if .env files exist
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: Backend .env file not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env from .env.example" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Error: No .env.example file found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  Warning: Frontend .env file not found." -ForegroundColor Yellow
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✅ Created frontend\.env from frontend\.env.example" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  Note: Frontend .env not found, but this may be optional." -ForegroundColor Blue
    }
}

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
    npm install
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    Set-Location frontend
    npm install
    Set-Location ..
}

# 1. Stop all running servers (backend and frontend)
Write-Host "🛑 Stopping all running MCP sandbox servers..." -ForegroundColor Red

# Kill Node.js processes
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*server.ts*" } | Stop-Process -Force 2>$null
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*dist/server.js*" } | Stop-Process -Force 2>$null

# Kill processes on specific ports
$ports = @(3002, 5180)
foreach ($port in $ports) {
    $processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force 2>$null
        Write-Host "Killed process on port $port" -ForegroundColor Yellow
    }
}

# Wait for processes to stop
Start-Sleep -Seconds 2

# 2. Build the backend (ensure latest changes are compiled)
Write-Host "🔨 Building MCP backend..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

# 3. Start backend
Write-Host "🚀 Starting MCP backend on port 3002..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock { Set-Location $using:PWD; npm start }
$backendPID = $backendJob.Id

# 4. Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 5. Test backend health
Write-Host "🏥 Testing backend health..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/health" -TimeoutSec 10
    Write-Host "✅ Backend is healthy!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend health check failed. Starting anyway..." -ForegroundColor Yellow
}

# 6. Start frontend (Vite will auto-select available port)
Write-Host "🎨 Starting MCP frontend..." -ForegroundColor Magenta
Set-Location frontend
$frontendJob = Start-Job -ScriptBlock { Set-Location $using:PWD; npm run dev }
$frontendPID = $frontendJob.Id
Set-Location ..

Write-Host ""
Write-Host "🎉 MCP Sandbox is starting!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Backend: http://localhost:3002" -ForegroundColor Blue
Write-Host "🎨 Frontend: http://localhost:5180 (or auto-selected port)" -ForegroundColor Magenta
Write-Host "🏥 Health Check: http://localhost:3002/health" -ForegroundColor Yellow
Write-Host "📚 API Docs: http://localhost:3002/api/mcp/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 To stop all servers, run: Get-Process node | Stop-Process" -ForegroundColor Gray
Write-Host "💡 Or use Ctrl+C in this terminal" -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 7. Open browser (optional)
Write-Host "🌐 Opening browser..." -ForegroundColor Blue
try {
    Start-Process "http://localhost:5180"
}
catch {
    Write-Host "Could not open browser automatically" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ MCP Sandbox restart complete!" -ForegroundColor Green
Write-Host "Backend Job ID: $backendPID" -ForegroundColor Gray
Write-Host "Frontend Job ID: $frontendPID" -ForegroundColor Gray 