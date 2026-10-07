# CloudOps Dashboard

Aplicación web profesional desarrollada con React + TypeScript para representar una propuesta de solución Cloud basada en AWS.

## Módulos
- Dashboard
- Planificación Cloud
- Costos y economía Cloud
- Infraestructura Global
- Seguridad
- Arquitectura de Red
- Servicios AWS

## Diseño aplicado
La interfaz fue ajustada para cumplir las especificaciones visuales de la práctica:
- Fondo principal: #F8FAFC
- Sidebar: #0F172A
- Color principal: #2563EB
- Seguridad: #16A34A
- Costos: #F59E0B
- Alertas: #DC2626
- Texto principal: #1E293B
- Texto secundario: #64748B
- Bordes: #E2E8F0
- Cards: #FFFFFF
- Cards con radio de 12–16 px, sombras suaves y bordes ligeros
- Diseño responsive para escritorio, tablet y móvil

## Requisitos
- Node.js 18 o superior
- npm

## Ejecución rápida en Windows
1. Ejecuta `INSTALAR_Y_EJECUTAR.bat` la primera vez.
2. En siguientes ejecuciones usa `INICIAR.bat`.
3. Abre la dirección mostrada por Vite, normalmente `http://localhost:5173`.

## Ejecución manual
```bash
npm install
npm run dev
```

## Mejoras de la versión profesional
- Dashboard con gráficos animados y visualización ejecutiva.
- Planificación Cloud con perfil de carga, selección visual de servicios y blueprint en vivo.
- Calculadora FinOps con tarifas de referencia actuales para EC2, RDS, S3, CloudFront y Route 53.
- Arquitectura de red enriquecida con VPC, dos Availability Zones, subredes públicas/privadas, EC2 y RDS.
- Animaciones, microinteracciones, estados hover y diseño responsive.

## Referencias de costos
Las tarifas incluidas son una referencia de simulación y no sustituyen una cotización final de AWS. AWS factura según región, configuración, consumo, transferencia, solicitudes, descuentos, impuestos y otros componentes.

Referencias consultadas:
- EC2 T3: https://aws.amazon.com/ec2/instance-types/t3/
- Amazon RDS for MySQL: https://aws.amazon.com/rds/mysql/pricing/
- Amazon S3: https://aws.amazon.com/s3/pricing/
- Amazon CloudFront: https://aws.amazon.com/cloudfront/pricing/
- Amazon Route 53: https://aws.amazon.com/route53/pricing/

Tarifas cargadas en la simulación (referencia septiembre de 2026):
- EC2 t3.micro Linux On-Demand: USD 0.0104/h.
- RDS db.t3.micro MySQL Single-AZ: USD 0.017/h (cómputo de referencia; almacenamiento/IO no incluidos).
- S3 Standard: USD 0.023/GB-mes para el primer tramo de almacenamiento.
- CloudFront: USD 0.085/GB de salida a Internet para el primer tramo de EE. UU.
- Route 53: USD 0.50 por zona alojada/mes y USD 0.40 por millón de consultas estándar.

## Integraciones gratuitas agregadas

El módulo **APIs e Integraciones** amplía la simulación con servicios públicos que no requieren una cuenta de AWS:

- **Traducción de arquitectura:** integración HTTP con MyMemory para traducir el resumen de una simulación a varios idiomas. Se presenta como una alternativa académica a Amazon Translate.
- **Texto a voz:** uso de Web Speech API (`SpeechSynthesis`) para reproducir el resumen o la traducción con las voces disponibles en el navegador. Se presenta como una alternativa local tipo Amazon Polly.
- **FinOps multimoneda:** consulta de Frankfurter para convertir costos simulados desde USD a PEN, EUR, GBP, BRL o JPY utilizando un tipo de cambio externo.
- **Security Intelligence:** consulta de la API pública NVD CVE 2.0 para buscar vulnerabilidades por producto o tecnología y mostrar identificador, fecha, descripción y puntaje CVSS cuando está disponible.

Estas funciones son demostrativas y no sustituyen a los servicios administrados de AWS. Su objetivo es mostrar consumo real de APIs REST, procesamiento de JSON, manejo de estados y errores, y aplicación de datos externos a una propuesta Cloud.

## Operaciones: incidentes, presupuesto e historial

- **Simulador de fallos** (`/dashboard/failures`) muestra escenarios aplicables a los servicios incluidos: EC2 (servidor caído o CPU saturada), zona de disponibilidad, RDS (indisponibilidad o máximo de conexiones), S3 (errores de acceso), CloudFront (distribución) y Route 53 (resolución DNS). Un mapa de dependencias marca recursos disponibles, degradados y caídos; cada incidente incluye síntomas, impacto y medidas recomendadas. Las opciones se filtran por servicios del escenario. Las réplicas opcionales EC2/RDS permiten ilustrar recuperación multi-AZ.
- **Presupuesto** se configura directamente en **Costos**, junto a las estimaciones y gráficos: define o cambia límite mensual por escenario; aviso desde el 80 %, crítico desde el 100 %, estado del consumo y acción para quitar límite. El aviso global también lleva a Costos. La ruta antigua `/dashboard/budgets` redirige a ese módulo.
- **Historial de cambios** (`/dashboard/history`) guarda versiones de planificación, fecha y nombre de sesión, y compara dos versiones del mismo escenario. Los escenarios existentes al actualizar aparecen con autor desconocido.

### Alcance y persistencia

El simulador es educativo y no se conecta a AWS ni cambia los recursos o costos configurados. El mapa describe un flujo simplificado según los servicios seleccionados; no verifica topología desplegada ni calcula SLA o tiempo de recuperación. Las réplicas son opciones de aprendizaje y no se agregan al presupuesto.

El login de demostración se conserva. Las planificaciones se guardan exclusivamente en Supabase en la tabla `cloudops_simulations`; en la misma fila se guardan el estado del simulador de fallos y el límite de presupuesto. No hay respaldo de simulaciones en localStorage. Para activarlo, ejecuta `supabase/schema.sql` en tu proyecto de Supabase y configura `.env` usando `.env.example` como plantilla. La guía completa está en `SUPABASE_SETUP.md`.

El historial de cambios continúa almacenándose localmente en `cloudops-operations-v1` y conserva hasta 500 entradas. Es un registro de apoyo para la demostración, no una auditoría de seguridad. Las políticas SQL incluidas son abiertas para facilitar el prototipo académico; en producción deben reemplazarse por Supabase Auth y políticas RLS por usuario u organización.

### Prueba de demostración

1. Crea un escenario que incluya EC2 y RDS.
2. Simula caída de zona A: sin redundancia, la aplicación queda interrumpida. Activa el servidor y la réplica RDS de zona B para ilustrar recuperación.
3. Prueba indisponibilidad RDS y revisa el diagnóstico y las acciones sugeridas.
4. Abre **Costos**, define un límite igual al costo mensual y observa el nivel crítico. Aumenta el límite para ver cómo disminuye el porcentaje.
5. Guarda un cambio en Planificación y compara las versiones en Historial.
6. Recarga el navegador para comprobar que la configuración se conserva en ese navegador.

Verificación: `node --test tests/operations.test.mjs` y `npm run build`.
