# CloudOps: entrar SIN Google con las credenciales existentes

La aplicación utiliza **correo + contraseña** mediante **Supabase Auth real**, y conserva el aspecto de su login actual. El módulo IA usa el token de esa misma sesión para analizar ZIP, chatear con Gemini, recuperar informes, mostrar vista previa y descargar PDF. Cada informe queda protegido por el `user_id` de Supabase y RLS. No se permiten análisis privados con sesiones simuladas en el navegador.

## Configuración única (responsable del proyecto)

1. Descomprime el ZIP. Copia `.env.example` como `.env`.
2. Completa la URL de Supabase, su clave **publishable/anon**, y `GEMINI_API_KEY`. No compartas ni publiques las claves privadas.
3. En Supabase → **SQL Editor**, ejecuta `supabase/ai_analysis_secure.sql` (si no está aplicado). La tabla de informes usa `auth.uid()` y RLS por usuario.
4. En Supabase → **Settings → API Keys → Legacy anon, service_role API keys**, copia la clave **`service_role`**, solo para el alta inicial. Añade TEMPORALMENTE en el `.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=PEGA_AQUI_TU_CLAVE_SERVICE_ROLE
   ```
5. Ejecuta **`CONFIGURAR_USUARIOS.bat`** en tu equipo. Creará en Supabase Auth las cuentas anteriores con los mismos correos y contraseñas de prueba. NO modifica usuarios que ya existan. El proceso requiere conexión a Supabase.
6. **Elimina la línea `SUPABASE_SERVICE_ROLE_KEY` de `.env`** después de crear las cuentas. El backend no la necesita para funcionar.
7. Ejecuta **`INICIAR_CLOUDOPS.bat`** e inicia sesión con correo + contraseña. Ya NO existe el botón Google. Todo el historial y los PDF siguen disponibles.

> **Seguridad:** las claves y contraseñas anteriores son *de demostración* y ya eran conocidas en el código original. Cambia las contraseñas en Supabase Auth antes de usar datos reales o un despliegue público, y comunica las nuevas a los cinco compañeros por un canal privado. Si ya hay cuentas con los mismos correos en Auth, el script **no restablece sus contraseñas**; usa las actuales o actualízalas manualmente en el panel. No actives registro público sin necesidad.

## Qué no debes modificar

- No cambies `VITE_SUPABASE_URL` si ya apunta al proyecto correcto.
- No uses ninguna clave `sb_secret_` ni `service_role` en `VITE_SUPABASE_ANON_KEY`; ahí va exclusivamente `sb_publishable_...` o `anon` pública.
- `GEMINI_API_KEY` es exclusivamente del servidor; no pongas `VITE_GEMINI_API_KEY`.
- No incluyas `.env` en GitHub ni en el ZIP público.

## Render

Publica el código actualizado y define en Render `GEMINI_API_KEY`, `GEMINI_MODEL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_WORKSPACE_ID`. No necesitas configurar OAuth Google. No subas la clave `service_role` a Render. Los usuarios se crean una sola vez en Supabase, no por servidor.

## Problemas frecuentes

- **"Credenciales no válidas"**: ejecuta `CONFIGURAR_USUARIOS.bat` y comprueba Supabase → Authentication → Users; si la cuenta ya existía, su contraseña no fue modificada.
- **Supabase 401 Invalid API key**: asegúrate de que `VITE_SUPABASE_ANON_KEY` es la publishable correcta del mismo proyecto que `VITE_SUPABASE_URL`. Reinicia el BAT para compilar de nuevo.
- **No hay historial**: ejecuta el SQL seguro y confirma que has entrado con la misma cuenta con la que creaste el informe. Las auditorías previas hechas con un usuario Google pertenecen al UID antiguo y no se transfieren automáticamente.
- **Gemini 404/429**: verifica `GEMINI_MODEL` compatible con tu clave o la cuota gratuita de Google AI Studio.

## Pruebas

- `node --test tests/*.test.mjs`
- `npm run build`
- Prueba local de login + ZIP + historial y PDF con claves reales (requiere red y datos de Supabase).
