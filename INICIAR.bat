@echo off
cd /d "%~dp0"
if not exist node_modules (echo Faltan dependencias. Ejecuta primero INSTALAR_Y_EJECUTAR.bat& pause & exit /b 1)
call npm run dev
pause
