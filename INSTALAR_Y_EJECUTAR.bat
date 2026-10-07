@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo ERROR: Node.js no esta instalado. Instala Node.js LTS y vuelve a ejecutar.& pause & exit /b 1)
echo Instalando dependencias...
call npm install
if errorlevel 1 (echo Error durante npm install.& pause & exit /b 1)
echo Iniciando CloudOps Dashboard...
call npm run dev
pause
