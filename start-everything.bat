@echo off
echo ============================================
echo    PulseMind AI - Starting All Services
echo ============================================
echo.

echo [1/3] Generating Prisma client...
cd /d "%~dp0backend"
call npx prisma generate
echo.

echo [2/3] Setting up database...
call npx prisma db push --accept-data-loss
echo.

echo [3/3] Seeding database...
call npx ts-node prisma/seed.ts
echo.

echo ============================================
echo    Starting Backend (port 4000) + Frontend (port 3000)
echo ============================================
echo.

start "PulseMind Backend" cmd /k "cd /d \"%~dp0backend\" && npm run dev"
timeout /t 3 >nul
start "PulseMind Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo.
echo Services starting...
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:4000/api/docs
echo.
echo Demo Credentials:
echo   Employee:    employee@demo.pulsemind.ai / Demo@2024
echo   HR Manager:  hr@demo.pulsemind.ai / Demo@2024
echo   Super Admin: admin@demo.pulsemind.ai / Demo@2024
echo.
pause
