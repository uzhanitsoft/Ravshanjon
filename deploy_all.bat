@echo off
chcp 65001 >nul
cd /d "c:\Users\shoxr\OneDrive\Desktop\Ravshanjon"

echo ==========================================
echo   DEPLOY - Ravshanjon + PDD App
echo ==========================================

echo.
echo [1/4] Syncing index.html...
copy /Y "public\index.html" "index.html" >nul
echo         Done.

echo.
echo [2/4] Adding all changes...
git add -A
echo         Done.

echo.
echo [3/4] Committing...
git commit -m "update: language switcher + new format support"
echo         Done.

echo.
echo [4/4] Pushing to GitHub...
git push origin main:master
echo         Done.

echo.
echo ==========================================
echo   ALL DONE!
echo   Railway will auto-deploy in 2-3 min
echo ==========================================
echo.
pause
