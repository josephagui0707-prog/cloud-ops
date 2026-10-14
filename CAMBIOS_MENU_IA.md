# CloudOps - Menú desplegable para Análisis de proyectos IA

## Cambios realizados
- El título «Análisis de proyectos IA» del menú izquierdo ahora tiene una flecha integrada.
- Pulsa el título o la flecha para abrir/cerrar los diez submódulos. Inicialmente están ocultos.
- Los diez botones de navegación que se mostraban encima del informe fueron retirados por completo.
- Para acceder a cualquier submódulo, utiliza las entradas que aparecen en el menú lateral.
- No se modificaron las funciones de análisis Gemini, chat, Supabase o exportación PDF.

## Instalación
1. Descomprime esta carpeta `CloudOps` en una ubicación nueva.
2. Copia tu `.env` desde la carpeta anterior a esta carpeta (no copies `node_modules` ni `dist`).
3. Ejecuta `INICIAR_CLOUDOPS.bat`. El iniciador instalará dependencias y compilará la versión nueva.
4. En el navegador, pulsa `Ctrl+F5` si había una versión antigua en caché.

## Seguridad
El ZIP no contiene tu `.env` ni credenciales privadas. El archivo `.env.example` solo tiene marcadores de posición.
