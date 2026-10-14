# CLOUDOPS — ANÁLISIS INTELIGENTE CON IA (Gemini + Supabase)

Esta entrega modifica el código existente de CloudOps; no reemplaza los módulos anteriores. Usa React/TypeScript/Vite, backend Node.js sin Express, JSZip, Google Gemini, Supabase Auth/RLS y Node 24. Hay diez submódulos en el menú y en la vista de IA.

## 1. Pasos obligatorios antes del primer uso (LOCAL)

1. Instala **Node.js 24 LTS o posterior compatible con `--env-file-if-exists`**.
2. Descomprime el ZIP. Usa la carpeta `CloudOps/` como raíz.
3. Copia `.env.example` a `.env` y rellena:

```env
VITE_SUPABASE_URL=https://cfhdxujqsxllpbwmnxgx.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_SB_PUBLISHABLE
VITE_SUPABASE_WORKSPACE_ID=cloudops-demo
GEMINI_API_KEY=TU_CLAVE_PRIVADA_ACTUAL_DE_GEMINI
GEMINI_MODEL=gemini-3.5-flash-lite
```

La clave de Gemini va SOLO en el backend (sin prefijo `VITE_`). Si compartiste tu clave en capturas o chats, revócala y crea una nueva.

4. En Supabase → SQL Editor, ejecuta **`supabase/ai_analysis_secure.sql`**. Crea la tabla `cloudops_ai_analyses`, habilita RLS y limita las operaciones a `auth.uid() = user_id`. No uses la `service_role` en frontend. Las tablas antiguas de simulaciones siguen utilizando las políticas de demo y requieren endurecimiento separado antes de producción real.
5. Sigue **`GUIA_LOGIN_CREDENCIALES.md`** para dar de alta una sola vez las cuentas existentes en Supabase Auth ejecutando `CONFIGURAR_USUARIOS.bat`. No necesitas habilitar Google.
6. Ejecuta **`INICIAR_CLOUDOPS.bat`**. La primera vez instala dependencias y compila. Abre `http://localhost:3001` e inicia sesión con tu correo y contraseña de CloudOps para usar el módulo de IA y el historial.
7. Sube el ZIP de laboratorio `ejemplos/Proyecto_Prueba_CloudOps_Con_Riesgos.zip`, si lo tienes, y pulsa «Analizar proyecto con IA». Un análisis correcto genera un identificador persistido en Supabase. El chat puede responder usando el informe almacenado.

**Si las credenciales no funcionan:** comprueba que el alta inicial finalizó y consulta Supabase → Authentication → Users. Se utiliza correo + contraseña, no Google.

## 2. Render para cinco compañeros

1. Sube la carpeta `CloudOps/` a tu repositorio GitHub (sin `.env` y sin `node_modules`).
2. Render → New Web Service Node desde GitHub. `Build: npm ci && npm run build`; `Start: npm start`. O importa el `render.yaml`.
3. En Render → Environment configura `GEMINI_API_KEY` (secreta), `GEMINI_MODEL=gemini-3.5-flash-lite`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_WORKSPACE_ID=cloudops-demo`. Las `VITE_` son visibles en el navegador por diseño: SOLO URL y clave publishable, nunca Gemini ni `service_role`.
4. Render → Manual Deploy / Clear build cache & deploy si cambias `VITE_`. correo y contraseña debe admitir `https://TU-SERVICIO.onrender.com/login`.
5. Conexión: `/api/health` devuelve `aiConfigured` (solo informa si hay clave), y `/api/ai/models` requiere sesión válida y verifica en vivo que el modelo configurado exista y admita `generateContent`.
6. Comprueba la región, límite de cuota y acceso al nivel gratuito del modelo desde https://ai.google.dev/gemini-api/docs/pricing. **Gratis no implica ilimitado**: cinco compañeros comparten cuota y pueden recibir 429. Render Free puede entrar en reposo.

## 3. Proceso técnico real

- ZIP máximo 8 MB. El backend utiliza JSZip **en memoria sin crear archivos en disco** y sin ejecutar código. Rechaza rutas inseguras, enlaces simbólicos, archivos excesivos y archivos inflados. Límite por entrada 450 KB, 22 MB de tamaño expandido declarado, hasta 900 entradas.
- Excluye directorios generados, archivos secretos conocidos y binarios. La redacción en el servidor enmascara varios formatos habituales de credenciales. Esta protección es **heurística, no infalible**: para proyectos sensibles, anonimiza manualmente antes de subirlos.
- Ordena los archivos relevantes, conserva hasta 125.000 caracteres y los divide en hasta cinco bloques. Los reportes distinguen archivos enviados por completo, fragmentos parciales y omitidos, con motivos.
- Gemini recibe únicamente las muestras seleccionadas y saneadas. Devuelve JSON estructurado que se valida; el backend descarta hallazgos con rutas inexistentes y señala citas no verificables. El informe reutilizado por los diez submódulos se genera una vez (o varias llamadas por bloque cuando hay muchos archivos).
- Los seis pilares AWS Well-Architected se enumeran; evidencia estática y supuestos se distinguen. No afirma que se haya desplegado el proyecto, ejecutado pruebas de carga, escaneado dependencias en vivo ni consultado precios AWS actuales.
- Historial y reportes persisten en Supabase con controles RLS por ID de usuario. No se guarda el ZIP original; sí un hash, rutas de archivos y el informe. Chat contextual consulta el reporte **desde el servidor**, vinculado al usuario autenticado.
- Costos: propone arquitectura y pide precios/tarifas verificadas; la interfaz calcula costos mensuales/anuales con tarifas ingresadas por el usuario y pérdidas por interrupción (ingresos por hora × horas + recuperación). No se comercializa como cotización oficial.
- PDF y TXT se generan en el navegador a partir del informe real guardado.

## 4. Límites que debes conocer

- No incluye conexión a AWS Pricing Calculator ni genera cifras AWS oficiales automáticamente. Sin datos reales de uso/tarifas se proporciona una estimación **ilustrativa**, no una cotización.
- No hace análisis estático profundo tipo SAST, escaneo CVE de dependencias ni pruebas en AWS Device Farm. Las conclusiones de Gemini requieren revisión técnica.
- Solo sube proyectos **ZIP**, no APK directo, en este módulo empresarial. Un APK dentro del ZIP es binario omitido, no se descompila.
- No hemos realizado una llamada real a Gemini ni conectado con tu Supabase porque las claves privadas no se incluyen en el ZIP. Se probaron funciones de extracción y TypeScript localmente; prueba de integración real pendiente al configurar tus credenciales.
- El acceso usa correo y contraseña reales de Supabase Auth para todos los módulos. El backend protege análisis e historial mediante tokens válidos y RLS. Las políticas anteriores de simulaciones siguen siendo de demostración y requieren endurecimiento antes de producción.
- El rate limit de 12 análisis / 50 preguntas por hora por usuario vive en memoria del servidor. No es un sistema de cuotas distribuido entre réplicas; Render gratuito está limitado.

## 5. Resolución de errores

- `401 Inicia sesión`: confirma que las cuentas estén dadas de alta en Supabase Auth; consulta `GUIA_LOGIN_CREDENCIALES.md`.
- `Supabase 401 Invalid API key`: revisa URL y clave pública del **mismo proyecto**; reinicia y recompila después de cambiar `VITE_`.
- `No se pudo acceder al historial protegido`: ejecuta `supabase/ai_analysis_secure.sql` en el proyecto correcto, inicia sesión nuevamente y revisa RLS.
- `Gemini 404`: el endpoint `/api/ai/models` valida disponibilidad del modelo; copia el nombre compatible en `GEMINI_MODEL` y reinicia. El recomendado de partida es `gemini-3.5-flash-lite`, sujeto a que tu clave lo admita.
- `Gemini 429`: cuota del nivel gratuito agotada; espera restablecimiento o cambia modelo/plan.
- `Render falla`: comprueba `npm ci`, Node 24, las variables en Environment y el último Deploy.

## 6. Pruebas

- `node --test tests/*.test.mjs` (15 pruebas disponibles en esta entrega).
- `npm run build` requiere instalar las dependencias de la plataforma donde se ejecuta. **No copies `node_modules` de Windows a Render.**
- La experiencia punta a punta con correo y contraseña/Gemini/Supabase se valida después de introducir tus propias claves en tu PC/Render.

Referencias: https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html · https://ai.google.dev/gemini-api/docs/models · https://supabase.com/docs/guides/auth/social-login/auth-google · https://supabase.com/docs/guides/database/postgres/row-level-security


## Vista previa del informe PDF (actualización)

Tras analizar un ZIP, entra en **Reportes** y haz clic en **Generar informe PDF**. Se abrirá una ventana con una vista previa del PDF real, con portada, resumen ejecutivo, hallazgos priorizados, evidencias, los seis pilares AWS, recomendaciones y trazabilidad de los archivos examinados. Desde allí puedes **Abrir** en otra pestaña o **Descargar PDF**. Se descargan los mismos bytes que se muestran en la vista previa; cerrar la vista descarta el archivo temporal del navegador. No se realiza otra llamada a Gemini para crear el PDF.

El botón **Generar informe · Vista previa** del Análisis general abre esta misma ventana. El PDF se genera del análisis vigente, inclusive al abrir un informe persistido desde Historial. Algunos navegadores no admiten visor PDF integrado; en ese caso usa «Abrir» o «Descargar PDF».
