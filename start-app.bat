@echo off
echo Checking if MySQL is running on port 3306...
netstat -ano | findstr :3306 >nul
if %errorlevel% equ 0 (
    echo MySQL is already running on port 3306.
) else (
    echo Starting MySQL from portable XAMPP...
    start "" "D:\xampp-portable-windows-x64-7.1.33-1-VC14\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp-portable-windows-x64-7.1.33-1-VC14\xampp\mysql\bin\my.ini"
    timeout /t 3 /nobreak >nul
)

echo Starting Backend and Frontend servers...
npm start
