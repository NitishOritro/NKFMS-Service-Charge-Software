@echo off
chcp 65001 >nul
title সার্ভিস চার্জ ব্যবস্থাপনা
cd /d "%~dp0"

rem Electron যেন সাধারণ Node হিসেবে না চলে
set "ELECTRON_RUN_AS_NODE="

if not exist "node_modules\electron" (
    echo প্রথমবারের প্রস্তুতি চলছে, একটু সময় লাগবে...
    call npm install
    if errorlevel 1 (
        echo.
        echo প্রস্তুতি ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ আছে কিনা দেখুন।
        pause
        exit /b 1
    )
)

start "" "node_modules\electron\dist\electron.exe" "."
exit /b 0
