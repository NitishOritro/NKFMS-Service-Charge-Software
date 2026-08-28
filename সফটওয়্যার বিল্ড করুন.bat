@echo off
chcp 65001 >nul
title সফটওয়্যার বিল্ড
cd /d "%~dp0"

rem Electron যেন সাধারণ Node হিসেবে না চলে
set "ELECTRON_RUN_AS_NODE="

if not exist "node_modules" (
    echo প্রথমবারের প্রস্তুতি চলছে, একটু সময় লাগবে...
    call npm install
    if errorlevel 1 (
        echo.
        echo প্রস্তুতি ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ আছে কিনা দেখুন।
        pause
        exit /b 1
    )
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

echo.
echo বিল্ড শেষ। নতুন সফটওয়্যারটি এখানে পাবেন:
echo   dist\NKFMS Service Charge-win32-x64\NKFMS Service Charge.exe
echo.
choice /c YN /n /m "ফোল্ডারটি এখনই খুলবেন? (Y/N) "
if errorlevel 2 goto end
start "" "dist\NKFMS Service Charge-win32-x64"

:end
pause
