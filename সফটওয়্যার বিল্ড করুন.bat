@echo off
chcp 65001 >nul
title সফটওয়্যার বিল্ড
cd /d "%~dp0"

rem Electron যেন সাধারণ Node হিসেবে না চলে
set "ELECTRON_RUN_AS_NODE="

if not exist "node_modules\graceful-fs" (
    echo প্রয়োজনীয় প্যাকেজ ইনস্টল ও প্রস্তুতি চলছে, একটু সময় লাগবে...
    call npm install
    if errorlevel 1 (
        echo.
        echo প্রস্তুতি ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ আছে কিনা দেখুন।
        pause
        exit /b 1
    )
)

echo.
echo ডেটা ব্যাকআপ ও সুরক্ষা নিশ্চিত করা হচ্ছে...
if exist "dist\NKFMS Service Charge-win32-x64\data\nkfms-data.json" (
    if not exist "data\backups" mkdir "data\backups"
    copy /y "dist\NKFMS Service Charge-win32-x64\data\nkfms-data.json" "data\backups\nkfms-data-before-build.json" >nul
    copy /y "dist\NKFMS Service Charge-win32-x64\data\nkfms-data.json" "data\nkfms-data.json" >nul
)

echo.
echo বিল্ড শুরু হচ্ছে — ২ থেকে ৫ মিনিট সময় লাগতে পারে। জানালাটি বন্ধ করবেন না।
echo.

call npm run build
if errorlevel 1 (
    echo.
    echo বিল্ড ব্যর্থ হয়েছে। উপরের বার্তাগুলো দেখুন।
    pause
    exit /b 1
)

rem বিল্ড শেষে সোর্সের সংরক্ষিত সকল ডেটা ডিস্ট্রিবিউশন ফোল্ডারে কপি করে নিশ্চিত করা
if exist "data\nkfms-data.json" (
    if not exist "dist\NKFMS Service Charge-win32-x64\data" mkdir "dist\NKFMS Service Charge-win32-x64\data"
    copy /y "data\nkfms-data.json" "dist\NKFMS Service Charge-win32-x64\data\nkfms-data.json" >nul
)

echo.
echo বিল্ড সম্পন্ন এবং সকল ডেটা সফলভাবে সংরক্ষিত রয়েছে।
echo নতুন সফটওয়্যারটি এখানে পাবেন:
echo   dist\NKFMS Service Charge-win32-x64\NKFMS Service Charge.exe
echo.
choice /c YN /n /m "ফোল্ডারটি এখনই খুলবেন? (Y/N) "
if errorlevel 2 goto end
start "" "dist\NKFMS Service Charge-win32-x64"

:end
pause
