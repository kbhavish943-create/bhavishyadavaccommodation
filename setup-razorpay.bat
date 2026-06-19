@echo off
REM Razorpay Integration Setup Script for Windows

color 0A
echo.
echo ===============================================
echo   RAZORPAY INTEGRATION SETUP
echo ===============================================
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo   Node %NODE_VER% found
echo.

REM Backend Setup
echo Setting up Backend...
if not exist "server" (
    echo ERROR: server/ directory not found
    pause
    exit /b 1
)

cd server
echo   Installing backend dependencies...
call npm install

if not exist ".env" (
    echo   Creating .env file...
    copy .env.example .env
    echo   WARNING: Please update .env with your Razorpay credentials
)

cd ..
echo   Backend ready!
echo.

REM Frontend Setup
echo Setting up Frontend...
if not exist "frontend" (
    echo ERROR: frontend/ directory not found
    pause
    exit /b 1
)

cd frontend
echo   Installing frontend dependencies...
call npm install

if not exist ".env.local" (
    echo   Creating .env.local file...
    (
        echo NEXT_PUBLIC_API_BASE=http://localhost:3000
        echo NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_your_key_here
    ) > .env.local
    echo   WARNING: Please update .env.local with your Razorpay public key
)

cd ..
echo   Frontend ready!
echo.

echo ===============================================
echo   SETUP COMPLETE!
echo ===============================================
echo.
echo NEXT STEPS:
echo 1. Get Razorpay API keys from https://razorpay.com
echo 2. Update server\.env with:
echo    - RAZOR_KEY_ID
echo    - RAZOR_KEY_SECRET
echo    - RAZOR_WEBHOOK_SECRET
echo 3. Update frontend\.env.local with:
echo    - NEXT_PUBLIC_RAZOR_KEY_ID
echo 4. Run servers:
echo    Terminal 1: cd server ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo 5. Test at http://localhost:3001/payment
echo.
echo For detailed guide, see RAZORPAY_SETUP.md
echo.

pause
