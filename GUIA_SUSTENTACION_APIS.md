# Guía de sustentación — Aporte personal: APIs e Integraciones

## Qué agregué al proyecto

Se incorporó un módulo nuevo llamado **APIs e Integraciones** dentro del dashboard CloudOps. El objetivo es complementar la simulación de arquitectura y presupuesto Cloud con integraciones externas gratuitas, sin requerir una cuenta de AWS.

### 1. Traducción de arquitectura — alternativa académica a Amazon Translate

- Se toma automáticamente la información de la simulación activa: nombre, región, número de usuarios, servicios seleccionados y costo mensual.
- El sistema construye un resumen técnico en español.
- Ese texto se envía mediante `fetch()` a la API pública de MyMemory.
- La respuesta llega en formato JSON y se extrae el texto traducido.
- Se manejan estados de carga y errores de conexión con mensajes visuales.

**Qué decir en la exposición:**

> “Implementé una integración REST de traducción para demostrar un flujo similar al que tendría Amazon Translate. No estoy afirmando que sea AWS; uso una alternativa pública porque el proyecto es una simulación y no contamos con credenciales de AWS. Lo importante es que el consumo de la API, el procesamiento JSON y el manejo de errores son reales.”

## 2. Texto a voz — alternativa tipo Amazon Polly

- Se utiliza Web Speech API del navegador mediante `SpeechSynthesis`.
- El usuario puede escuchar el texto original o el texto traducido.
- El idioma de la voz cambia según el idioma seleccionado.
- El módulo permite iniciar y detener la reproducción.

**Qué decir en la exposición:**

> “Para demostrar el concepto de Text-to-Speech equivalente a Polly utilicé la API de voz disponible en el navegador. No necesita cuenta ni API key y me permite mostrar en vivo la conversión de texto a voz.”

## 3. FinOps multimoneda — presupuesto en soles

- El presupuesto principal del proyecto está expresado en USD.
- Se agregó una integración con Frankfurter para consultar un tipo de cambio externo.
- El usuario puede convertir USD a PEN, EUR, GBP, BRL o JPY.
- Si existe una simulación activa, el módulo toma automáticamente el costo mensual y también calcula el costo anual convertido.

**Qué decir en la exposición:**

> “Como el proyecto está orientado a adquisición y presupuesto Cloud, agregué una capa FinOps. El simulador calcula primero el costo en dólares y después consulta una fuente externa para expresarlo en soles u otra moneda. Así el presupuesto resulta más útil para una empresa local.”

## 4. Security Intelligence — vulnerabilidades CVE

- Se agregó un buscador conectado a la API pública NVD CVE 2.0.
- El usuario puede buscar tecnologías como `MySQL`, `Linux`, `Apache` o `nginx`.
- El dashboard muestra hasta cinco vulnerabilidades con:
  - ID CVE.
  - Fecha de publicación.
  - Descripción.
  - Puntaje CVSS cuando está disponible.
  - Severidad.
- Esta función complementa el módulo de seguridad existente y se puede explicar como una aproximación académica a funciones de análisis de vulnerabilidades similares a Amazon Inspector o Security Hub.

**Qué decir en la exposición:**

> “La seguridad del proyecto antes era principalmente una evaluación simulada. Mi aporte fue agregar una fuente de información externa real: ahora puedo consultar vulnerabilidades públicas de una tecnología y mostrar su CVE y CVSS. Esto hace que el módulo no dependa solamente de datos estáticos.”

# Demostración recomendada en clase

1. Crear o seleccionar una simulación con varios servicios.
2. Entrar a **APIs e Integraciones**.
3. Mostrar que el texto de arquitectura se genera usando los datos de la simulación.
4. Traducir de español a inglés.
5. Reproducir el resultado con voz.
6. Tomar el costo mensual y convertirlo de USD a PEN.
7. Buscar `mysql` o `linux` en Security Intelligence.
8. Explicar que cada operación consume una fuente distinta y procesa JSON de forma asíncrona.

# Preguntas que puede hacer el profesor

### ¿Por qué no usaste directamente Amazon Translate o Amazon Polly?

Porque el trabajo es una simulación académica y no se dispone de una cuenta AWS. Se utilizaron alternativas gratuitas para demostrar técnicamente el mismo tipo de integración: solicitud HTTP, procesamiento de respuesta, control de estados y presentación del resultado.

### ¿Entonces estas APIs son de AWS?

No. Son integraciones externas usadas como equivalentes funcionales de demostración. El sistema las identifica explícitamente como alternativas académicas y no como servicios oficiales de AWS.

### ¿Qué pasa si una API externa se cae?

Las llamadas están protegidas con `try/catch`. Si hay un error de red, límite de uso o respuesta inválida, el dashboard muestra un mensaje de error y la aplicación sigue funcionando.

### ¿Dónde están guardadas las API keys?

Estas integraciones fueron elegidas precisamente porque el flujo implementado no necesita almacenar una clave privada en el frontend. Esto evita exponer credenciales dentro del código del navegador.

### ¿Qué parte técnica desarrollaste tú?

- Nueva ruta `/dashboard/integrations`.
- Nueva opción en el menú lateral.
- Consumo de APIs REST con `fetch()`.
- Manejo de respuestas JSON.
- Estados de carga y errores.
- Integración con la simulación activa mediante `SimulationContext`.
- Conversión de moneda basada en los costos del escenario.
- Síntesis de voz.
- Buscador de vulnerabilidades CVE.
- Diseño responsive y coherente con el dashboard existente.

# Archivos modificados o creados

- `src/pages/Integrations.tsx` — nuevo módulo completo.
- `src/App.tsx` — nueva ruta.
- `src/components/Sidebar.tsx` — acceso desde el menú.
- `src/style.css` — ajustes responsive y estados de botones.
- `README.md` — documentación de integraciones.
- `GUIA_SUSTENTACION_APIS.md` — guía para exposición.

# Referencias técnicas

- MyMemory Translation API: `https://api.mymemory.translated.net/get`
- Web Speech API: `https://developer.mozilla.org/docs/Web/API/Web_Speech_API`
- Frankfurter: `https://frankfurter.dev/`
- NVD CVE API 2.0: `https://services.nvd.nist.gov/rest/json/cves/2.0`

