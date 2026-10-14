# CloudOps IA: informes para gerencia y analistas

En el menú **Análisis de proyectos IA → 10. Reportes** hay dos tarjetas:

- **Informe ejecutivo:** resumen de riesgos del negocio, acciones priorizadas, alcance y costos orientativos solo cuando el usuario haya proporcionado datos; adecuado para presentar al gerente o dueño de la empresa.
- **Informe técnico completo:** matriz de riesgos, evidencias, archivos y líneas, recomendaciones técnicas, arquitectura AWS y los seis pilares Well-Architected. Destinado a los analistas.

Ambos botones abren **una vista previa del PDF real** y permiten descargar ese mismo documento. La generación se realiza localmente a partir del análisis que ya figura en pantalla: no se hace otra consulta a Gemini.

## Cómo usarlo
1. Inicia sesión en CloudOps con tu correo y contraseña de Supabase Auth.
2. Sube y analiza un ZIP o abre un resultado guardado desde Historial.
3. Entra a **10. Reportes**, elige **Informe ejecutivo** o **Informe técnico completo**.
4. Pulsa **Vista previa** y, si está conforme, **Descargar PDF**.

Se conservan los informes PDF independientes de los otros nueve submódulos. No necesitas ejecutar otra migración SQL.

## Interpretación responsable
Las cantidades de riesgos son hallazgos del análisis estático, no mediciones de producción. La valoración ejecutiva nunca certifica que el despliegue sea seguro. Las estimaciones económicas parten únicamente de valores introducidos por el usuario; no son precios oficiales de AWS. Para precios actuales se requiere AWS Pricing Calculator y para capacidad o disponibilidad deben realizarse pruebas reales.
