@echo off
setlocal
title StockXpert - Add New User

echo ==========================================
echo   StockXpert - Add Regular User
echo ==========================================
echo.
set /p NAME="Enter Full Name: "
set /p EMAIL="Enter Email Address: "
set /p PASS="Enter Password: "

echo.
echo Adding user to database...
php server\scripts\add_user.php "%NAME%" "%EMAIL%" "%PASS%"

echo.
echo SUCCESS! You can now login at the home page with these credentials.
pause
