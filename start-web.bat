@echo off
REM StockXpert web starter (Windows)
REM Prerequisites:
REM - PHP in PATH (php -v works)
REM - Node.js + npm in PATH (node -v, npm -v work)

set "ROOT=%~dp0"

echo.
echo ==========================================
echo  StockXpert - Web Dev Starter
echo ==========================================
echo.

REM Optional: install frontend deps once if missing
if not exist "%ROOT%web\node_modules" (
  echo Installing frontend dependencies the first time...
  pushd "%ROOT%web"
  npm install
  popd
)

echo.
echo Starting PHP API on http://localhost:8000 ...
start "" /D "%ROOT%server" cmd /k "php -S localhost:8000 -t . index.php"

echo.
echo Starting React dev server...
start "" /D "%ROOT%web" cmd /k "npm run dev"

echo.
echo Two terminal windows should now be open:
echo  - one for the PHP API (port 8000)
echo  - one for the React dev server (Vite)
echo Open the URL shown by Vite in your browser.
echo.
pause

