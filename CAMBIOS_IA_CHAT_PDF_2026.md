# CloudOps - Navegación, chat Gemini y reportes

## Navegación

Los diez submódulos se abren desde la flecha del menú lateral. Cada opción conserva su propia pestaña en la URL (`/dashboard/ai-analysis?tab=risks`, por ejemplo). No se muestran botones horizontales duplicados. Antes de analizar un ZIP, cada sección presenta su descripción; después utiliza el informe real seleccionado o recuperado del historial de Supabase. Al entrar nuevamente al módulo, se intenta recuperar el último informe por ID y con verificación de sesión.

## Chat Gemini

Incluye **Chat general** para consultar cualquier tema permitido, sin adjuntar automáticamente el informe, y **Sobre mi proyecto** para consultar un análisis privado con evidencia. Se mantiene historial conversacional reciente por modo durante la sesión actual. El chatbot usa Gemini API con modelo indicado por `GEMINI_MODEL`; no es la página oficial de Gemini y no dispone de navegación en Internet ni acceso automático a resultados actuales. Se conservan los límites de solicitudes por usuario y la autenticación de Supabase.

## Informes

La generación del PDF a partir del análisis almacenado ahora contiene tablas de:

- Matriz de riesgos: gravedad, descripción, archivo/línea y confianza.
- Servicios AWS y justificación arquitectónica.
- Evaluación de los seis pilares Well-Architected.
- Plan de remediación vinculado a los hallazgos.
- Recomendaciones adicionales y cobertura de archivos.

Las tablas mantienen columnas legibles, filas alternadas y repiten encabezados cuando una página se llena. La vista previa y la descarga siguen usando exactamente el mismo PDF. No se realiza ninguna llamada adicional a Gemini para generarlo. Los precios de AWS no se inventan ni se muestran como cotizaciones oficiales.

## Configuración local

1. Descomprime el nuevo ZIP.
2. Copia tu archivo `.env` anterior a la carpeta `CloudOps` del nuevo proyecto (no compartas tus claves).
3. Ejecuta `INICIAR_CLOUDOPS.bat` para instalar dependencias cuando sean necesarias, compilar y ejecutar el servidor.
4. Actualiza la pestaña del navegador con `Ctrl + F5`.

## Pruebas

Se validaron TypeScript, sintaxis del backend, pruebas automatizadas y la renderización de un PDF de prueba. La compilación completa de Vite no se pudo verificar en este entorno Linux por la ausencia del paquete nativo de Rollup en dependencias procedentes de Windows. Para producción falta probar una llamada real a Gemini y el sitio desplegado con una sesión de usuario válida.
