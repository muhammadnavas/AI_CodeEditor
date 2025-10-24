@echo off
REM AI Code Editor - Production Setup Script (Windows)

echo ======================================
echo AI Code Editor - Production Setup
echo ======================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    exit /b 1
)
echo [OK] Docker is installed

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    exit /b 1
)
echo [OK] Docker is running

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed. Skipping local development setup.
    set SKIP_NODE=true
) else (
    echo [OK] Node.js is installed
    set SKIP_NODE=false
)

echo.
echo ======================================
echo Step 1: Environment Configuration
echo ======================================

REM Check if .env exists
if exist .env (
    echo [WARNING] .env file already exists. Skipping creation.
) else (
    echo [INFO] Creating .env file from template...
    copy .env.example .env
    echo [OK] .env file created
    
    REM Generate API key
    if "%SKIP_NODE%"=="false" (
        echo [INFO] Generating secure API key...
        for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set API_KEY=%%i
        
        REM Update .env file with generated API key
        powershell -Command "(gc .env) -replace 'your-secure-api-key-here', '%API_KEY%' | Out-File -encoding ASCII .env"
        echo [OK] API key generated and added to .env
        echo.
        echo [IMPORTANT] Save this API key - you'll need it for API requests
        echo API_KEY=%API_KEY%
    ) else (
        echo [WARNING] Node.js not available. Please generate API key manually.
    )
    
    echo.
    echo [IMPORTANT] Edit .env file and add your OPENAI_API_KEY
    echo You can get one from: https://platform.openai.com/api-keys
    echo.
    pause
)

echo.
echo ======================================
echo Step 2: Pull Docker Images
echo ======================================

echo [INFO] Pulling required Docker images for code execution...
echo This may take a few minutes...

echo [INFO] Pulling node:18-alpine...
docker pull node:18-alpine
if %errorlevel% neq 0 exit /b 1
echo [OK] node:18-alpine pulled

echo [INFO] Pulling python:3.11-alpine...
docker pull python:3.11-alpine
if %errorlevel% neq 0 exit /b 1
echo [OK] python:3.11-alpine pulled

echo [INFO] Pulling openjdk:17-alpine...
docker pull openjdk:17-alpine
if %errorlevel% neq 0 exit /b 1
echo [OK] openjdk:17-alpine pulled

echo [INFO] Pulling gcc:latest...
docker pull gcc:latest
if %errorlevel% neq 0 exit /b 1
echo [OK] gcc:latest pulled

echo.
echo ======================================
echo Step 3: Install Dependencies
echo ======================================

if "%SKIP_NODE%"=="false" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo [OK] Backend dependencies installed
    
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [WARNING] Skipping dependency installation (Node.js not available)
    echo [INFO] Dependencies will be installed inside Docker containers
)

echo.
echo ======================================
echo Step 4: Docker Compose Setup
echo ======================================

echo [INFO] Building and starting Docker containers...
docker-compose up -d --build

echo.
echo [INFO] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [OK] All services are running!
) else (
    echo [ERROR] Some services failed to start. Check logs with: docker-compose logs
    exit /b 1
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Services are running:
echo   * Frontend:  http://localhost:3000
echo   * Backend:   http://localhost:3001
echo   * Database:  localhost:5432
echo   * Redis:     localhost:6379
echo.
echo Useful commands:
echo   * View logs:      docker-compose logs -f
echo   * Stop services:  docker-compose down
echo   * Restart:        docker-compose restart
echo.
echo Test the setup:
echo   curl http://localhost:3001/health
echo.
echo [IMPORTANT] Remember to keep your API key secure!
echo.
pause
