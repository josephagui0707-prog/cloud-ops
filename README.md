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
