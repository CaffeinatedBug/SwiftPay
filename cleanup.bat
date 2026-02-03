@echo off
echo Cleaning up SwiftPay repository...
echo.

echo [1/2] Removing old Vite frontend (instant-rail)...
if exist instant-rail (
    rmdir /s /q instant-rail
    echo ✓ Removed instant-rail folder
) else (
    echo ✓ instant-rail folder already removed
)

echo.
echo [2/2] Removing root package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo ✓ Removed package-lock.json
) else (
    echo ✓ package-lock.json already removed
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review changes: git status
echo 2. Stage changes: git add .
echo 3. Commit: git commit -m "Clean up repository and complete Next.js migration"
echo 4. Push: git push origin main
echo.
pause
