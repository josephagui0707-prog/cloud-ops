@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (echo Instala Node.js LTS. & pause & exit /b 1)
if not exist ".env" (echo Falta .env. Ejecuta primero INICIAR_CLOUDOPS.bat. & pause & exit /b 1)
echo ===========================================
echo   ALTA INICIAL DE USUARIOS CLOUDOPS
 echo ===========================================
echo Este procedimiento necesita SUPABASE_SERVICE_ROLE_KEY en .env.
echo Solo se utiliza una vez y NO publica la clave.
echo Las cuentas existentes NO se modifican.
echo.
node --env-file=.env scripts/configurar-usuarios.mjs
if errorlevel 1 (echo. Error de configuracion. Comprueba Supabase y revisa GUIA_LOGIN_CREDENCIALES.md. & pause & exit /b 1)
echo.
echo Retira SUPABASE_SERVICE_ROLE_KEY de .env y guarda el archivo.
pause
