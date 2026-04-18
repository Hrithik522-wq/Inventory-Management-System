@echo off
setlocal
title StockXpert - Setup Admin Login

echo ==========================================
echo   StockXpert - Setup Admin Credentials
echo ==========================================
echo.
set /p ADMIN_USER="Enter New Admin Username: "
set /p ADMIN_PASS="Enter New Admin Password: "

echo.
echo Updating config...
php server\scripts\update_admin.php "%ADMIN_USER%" "%ADMIN_PASS%"

echo.
echo SUCCESS! You can now login at /admin/login with your new password.
pause
