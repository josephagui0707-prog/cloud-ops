# CloudOps - Exportar un PDF por submódulo

Esta versión permite generar un PDF independiente para cada uno de los diez submódulos de **Análisis de proyectos IA**. Las exportaciones se construyen en el navegador, con la información que ya está cargada y disponible para la cuenta actual. **No se realizan nuevas consultas a Gemini al generar o previsualizar PDFs.**

## Uso

1. Inicia CloudOps con `INICIAR_CLOUDOPS.bat` y entra con la cuenta habitual de Supabase.
2. Analiza un ZIP o abre un análisis del historial.
3. Usa la flecha del menú lateral y selecciona el submódulo requerido.
4. En la parte superior de cada sección aparece **Generar PDF · Vista previa** cuando hay información suficiente para exportar.
5. Revisa el documento en la ventana emergente y pulsa **Descargar PDF**. Es el mismo documento mostrado en la vista previa.
6. En **Reportes** permanece el informe profesional completo de la auditoría, además de la descarga TXT.

## Qué incluye cada informe

| Submódulo | Contenido del PDF |
|---|---|
| 1. Subir proyecto ZIP | Nombre, tamaño y listado previo de archivos del ZIP; cobertura si existe un análisis |
| 2. Análisis general | Resumen, tecnologías detectadas, pilares AWS y archivos examinados |
| 3. Riesgos y vulnerabilidades | Matriz por gravedad, archivo/línea, evidencia, impacto y corrección |
| 4. Seguridad del proyecto | Evaluación de seguridad y hallazgos clasificados en seguridad |
| 5. Arquitectura y servicios AWS | Arquitectura propuesta, servicios justificados y pilares AWS |
| 6. Rendimiento y escalabilidad | Evaluación estática y hallazgos relacionados con el rendimiento |
| 7. Costos e impacto económico | Evaluación de costos, escenario con los valores introducidos y pérdidas por interrupción |
| 8. Recomendaciones de mejora | Tabla de prioridades y acciones correctivas |
| 9. Historial de análisis | Relación de informes privados cargados desde Supabase para la cuenta actual |
| 10. Reportes | Auditoría completa, con matriz de riesgos y anexo del resultado original |

Los botones requieren datos reales: un ZIP para la ficha del primer submódulo, un análisis para los informes técnicos, o registros cargados para el historial. Los importes no constituyen precios oficiales de AWS. Los documentos no se guardan de nuevo en Supabase: se crean localmente para vista previa y descarga.

## Configuración

El nuevo PDF utiliza `jsPDF`, una dependencia que ya tenía el proyecto. No hay que añadir ninguna API Key nueva ni modificar la base de datos.

Si cambias los datos de la calculadora de costos, vuelve a pulsar el botón para generar una nueva vista previa con los nuevos valores.

## Dos informes generales por audiencia
En **10. Reportes** ahora se muestran dos opciones: **Informe ejecutivo** (dirección, dueño o gerencia) e **Informe técnico completo** (analistas). Ambos tienen vista previa y descarga del mismo PDF. El ejecutivo resume resultados y decisiones; el técnico mantiene matrices, evidencias, rutas y recomendaciones. Consulta también `GUIA_INFORMES_EJECUTIVO_Y_TECNICO.md`.
