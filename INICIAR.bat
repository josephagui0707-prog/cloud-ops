@echo off
cd /d "%~dp0"
<<<<<<< HEAD
call "INICIAR_CLOUDOPS.bat"
=======
if not exist node_modules (echo Faltan dependencias. Ejecuta primero INSTALAR_Y_EJECUTAR.bat& pause & exit /b 1)
call npm run dev
pause
>>>>>>> 1df728fd4bbb8375232c6ad45e5541837072bcc2
