@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (echo Instala Node.js LTS: https://nodejs.org/ & pause & exit /b 1)
where npm >nul 2>&1
if errorlevel 1 (echo No se encontro npm & pause & exit /b 1)
if not exist node_modules (call npm install & if errorlevel 1 (pause & exit /b 1))
if not exist ".env" (
    echo Falta .env. Copiando plantilla de configuracion...
    copy /y ".env.example" ".env" >nul
    echo Edita .env para pegar tu clave publica Supabase y clave privada Gemini.
    start "" notepad.exe ".env"
    pause
)
echo Construyendo el frontend...
call npm run build
if errorlevel 1 (echo Error en la compilacion. & pause & exit /b 1)
echo CloudOps + Gemini en http://localhost:3001
start "" "http://localhost:3001"
call npm start
pause
