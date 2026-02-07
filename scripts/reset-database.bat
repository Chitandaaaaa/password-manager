@echo off
chcp 65001
cls

echo ==========================================
echo Password Manager - Database Reset Tool
echo ==========================================
echo.

set "DATA_DIR=%APPDATA%\password-manager"

echo Data directory: %DATA_DIR%
echo.

if exist "%DATA_DIR%" (
    echo [Step 1/2] Removing data directory...
    rmdir /s /q "%DATA_DIR%"
    echo [OK] Data removed
) else (
    echo [Step 1/2] Data directory not found, skipping
)

echo.
echo [Step 2/2] Creating new directory...
mkdir "%DATA_DIR%" 2>nul
echo [OK] Directory created

echo.
echo ==========================================
echo [SUCCESS] Database reset complete!
echo ==========================================
echo.
echo You can now restart the application.
echo It will show the initial setup screen.
echo.

pause
