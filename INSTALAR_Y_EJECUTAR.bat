@echo off
cd /d "%~dp0"
<<<<<<< HEAD
call "INICIAR_CLOUDOPS.bat"
=======
where node >nul 2>&1 || (echo ERROR: Node.js no esta instalado. Instala Node.js LTS y vuelve a ejecutar.& pause & exit /b 1)
echo Instalando dependencias...
call npm install
if errorlevel 1 (echo Error durante npm install.& pause & exit /b 1)
echo Iniciando CloudOps Dashboard...
call npm run dev
pause
>>>>>>> 1df728fd4bbb8375232c6ad45e5541837072bcc2
