@echo off
setlocal

title StockXpert Launcher

echo ========================================================
echo   StockXpert - Electronics Inventory Management System
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/3] Checking environment...
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: PHP is not installed or not in your PATH.
    echo Please install PHP to run the backend.
    pause
    exit /b
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js to run the frontend.
    pause
    exit /b
)

echo [2/3] Starting PHP Backend (Port 8000)...
start "StockXpert-Backend" /D "%ROOT_DIR%server" cmd /c "php -S localhost:8000 index.php"

echo [3/3] Starting React Frontend (Vite)...
cd /d "%ROOT_DIR%web"
if not exist "node_modules\" (
    echo No node_modules found. Installing dependencies...
    cmd /c "npm install"
)
start "StockXpert-Frontend" cmd /c "npm run dev"

echo.
echo [Final Step] Opening browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ========================================================
echo   SUCCESS: Both services are launching!
echo.
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo.
echo   [MAIL CHECK]: http://localhost:8000/test_mail_system.php
echo ========================================================
echo.
echo Press any key to close this launcher (servers will keep running).
pause >nul
exit
