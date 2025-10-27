@echo off
echo Starting Stock Tracker Application...
echo.
echo Make sure you're in the stock-tracker directory!
echo.
cd /d "%~dp0"
if exist "package.json" (
    echo Found package.json, starting development server...
    npm start
) else (
    echo Error: package.json not found!
    echo Please make sure you're in the correct directory.
    pause
)