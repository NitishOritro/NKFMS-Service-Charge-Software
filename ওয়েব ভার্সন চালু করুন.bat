@echo off
chcp 65001 >nul
title NKFMS Service Charge — React Web App
cd /d "%~dp0"

echo.
echo ========================================================
echo নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি - React Web App চালু হচ্ছে...
echo ব্রাউজারে http://localhost:3000 ঠিকানায় ওপেন হবে
echo ========================================================
echo.

call npm run dev
pause
