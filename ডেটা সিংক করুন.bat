@echo off
chcp 65001 >nul
title ডেটা সিংক
cd /d "%~dp0"

echo.
echo ===== ধাপ ১: অন্য কম্পিউটারের হালনাগাদ তথ্য নামানো হচ্ছে =====
echo.

call git pull --rebase
if errorlevel 1 (
    echo.
    echo নামানো যায়নি। সফটওয়্যারটি বন্ধ করে আবার চেষ্টা করুন।
    echo দুই কম্পিউটারে একই মাসের এন্ট্রি হয়ে থাকলে দ্বন্দ্ব ^(conflict^) হতে পারে।
    pause
    exit /b 1
)

echo.
echo ===== ধাপ ২: এই কম্পিউটারের নতুন এন্ট্রি পাঠানো হচ্ছে =====
echo.

git add data/nkfms-data.json
git diff --cached --quiet
if not errorlevel 1 (
    echo নতুন কোনো পরিবর্তন নেই — পাঠানোর কিছু নেই।
    echo.
    pause
    exit /b 0
)

for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set STAMP=%%a-%%b-%%c
call git commit -m "হিসাব হালনাগাদ (%STAMP% %time:~0,5%)"
if errorlevel 1 (
    echo.
    echo কমিট করা যায়নি। উপরের বার্তাগুলো দেখুন।
    pause
    exit /b 1
)

call git push
if errorlevel 1 (
    echo.
    echo পাঠানো যায়নি। ইন্টারনেট সংযোগ আছে কিনা দেখুন।
    pause
    exit /b 1
)

echo.
echo সিংক শেষ। এখন অন্য কম্পিউটারে এই ফাইলটি চালালেই হালনাগাদ হিসাব পাবেন।
echo.
pause
