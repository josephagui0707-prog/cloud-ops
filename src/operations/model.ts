import type { Simulation } from '../context/SimulationContext';
export type Failure = 'none' | 'server' | 'zone' | 'database' | 'cpu' | 'connections' | 'storage' | 'cdn' | 'dns';
export type LabConfig = { secondServer: boolean; standbyDatabase: boolean; failure: Failure };
export const defaultLab: LabConfig = { secondServer: false, standbyDatabase: false, failure: 'none' };
export const failureNames: Record<Failure, string> = {
  none: 'Operación normal', server: 'Servidor EC2 no disponible', zone: 'Zona de disponibilidad caída',
  database: 'Base RDS no disponible', cpu: 'CPU de EC2 saturada', connections: 'Límite de conexiones RDS',
  storage: 'Errores de acceso a S3', cdn: 'Distribución CloudFront caída', dns: 'Error de resolución DNS',
};
export const failureGuidance: Record<Exclude<Failure, 'none'>, { symptom: string; impact: string; solutions: string[]; severity: 'critical' | 'warning' }> = {
  server: { symptom: 'El servidor EC2 no responde a las comprobaciones de estado.', impact: 'Se interrumpen las solicitudes que dependen de esta instancia.', severity: 'critical', solutions: ['Reemplazar o reiniciar la instancia y revisar sus registros.', 'Distribuir tráfico entre varias instancias con un balanceador.', 'Configurar comprobaciones de salud y escalado automático.'] },
  zone: { symptom: 'Los recursos ubicados en la zona A dejan de responder.', impact: 'Se afecta todo componente sin una réplica en otra zona.', severity: 'critical', solutions: ['Desplegar servidores y datos en al menos dos zonas.', 'Usar un balanceador multi-AZ y una réplica de base de datos.', 'Probar la conmutación y documentar el procedimiento de recuperación.'] },
  database: { symptom: 'La base de datos primaria rechaza o no responde a las consultas.', impact: 'Las funciones que leen o guardan datos fallan; el servidor puede seguir encendido.', severity: 'critical', solutions: ['Verificar disponibilidad, conexiones y registros de RDS.', 'Configurar una réplica en otra zona y conmutación automática.', 'Definir copias de seguridad y probar la restauración.'] },
  cpu: { symptom: 'La instancia supera su capacidad de procesamiento disponible.', impact: 'La aplicación responde lentamente y puede acumular solicitudes.', severity: 'warning', solutions: ['Revisar CPU, memoria y métricas de tráfico.', 'Escalar la instancia o distribuir la carga en varias instancias.', 'Configurar límites, alarmas y Auto Scaling.'] },
  connections: { symptom: 'RDS alcanzó el máximo de conexiones concurrentes.', impact: 'Las nuevas solicitudes no pueden consultar ni guardar datos.', severity: 'critical', solutions: ['Liberar conexiones no utilizadas y revisar consultas lentas.', 'Usar un pool de conexiones y limitar la concurrencia.', 'Ajustar capacidad de RDS después de medir el consumo.'] },
  storage: { symptom: 'El bucket S3 no responde o la aplicación recibe acceso denegado.', impact: 'Archivos, imágenes o contenido estático dejan de cargar.', severity: 'critical', solutions: ['Comprobar políticas IAM, bucket policy y cifrado.', 'Validar región, existencia del objeto y registros de acceso.', 'Usar versionado y copias de respaldo para recuperar archivos.'] },
  cdn: { symptom: 'CloudFront no entrega contenido desde los puntos de presencia.', impact: 'Aumenta la latencia y puede fallar el acceso al contenido distribuido.', severity: 'critical', solutions: ['Revisar estado de distribución, origen y certificado TLS.', 'Validar DNS, políticas de origen y registros de CloudFront.', 'Configurar un origen alternativo y una página de error controlada.'] },
  dns: { symptom: 'Route 53 no resuelve el nombre del servicio correctamente.', impact: 'Los usuarios no encuentran el punto de entrada aunque los servidores sigan activos.', severity: 'critical', solutions: ['Verificar registros DNS, nameservers y dominio.', 'Revisar comprobaciones de estado y políticas de enrutamiento.', 'Usar health checks con failover y mantener un TTL apropiado.'] },
};
export function isFailureAvailable(failure: Failure, services: string[]) {
  if (failure === 'none' || failure === 'server' || failure === 'cpu') return services.includes('EC2');
  if (failure === 'zone') return services.includes('EC2') || services.includes('RDS');
  if (failure === 'database' || failure === 'connections') return services.includes('RDS');
  if (failure === 'storage') return services.includes('S3');
  if (failure === 'cdn') return services.includes('CloudFront');
  if (failure === 'dns') return services.includes('Route 53');
  return false;
}
export function budgetLevel(cost: number, limit?: number) {
  // Si no viene limit, o no es un número finito, o es menor/igual a cero
  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return 'unset';
  
  // Ahora TypeScript sabe que "limit" sí o sí es un número válido
  return cost >= limit ? 'critical' : cost >= limit * .8 ? 'warning' : 'ok';
}
export function evaluateFailure(services: string[], config: LabConfig) {
  const has = (service: string) => services.includes(service);
  const ec2 = has('EC2'), rds = has('RDS'), s3 = has('S3'), cdn = has('CloudFront'), dns = has('Route 53');
  const serverA = ec2 && config.failure !== 'server' && config.failure !== 'zone';
  const serverB = ec2 && config.secondServer;
  const primary = rds && config.failure !== 'database' && config.failure !== 'zone' && config.failure !== 'connections';
  const standby = rds && config.standbyDatabase;
  const storageAvailable = s3 && config.failure !== 'storage';
  const cdnAvailable = cdn && config.failure !== 'cdn';
  const dnsAvailable = dns && config.failure !== 'dns';
  const appAvailable = (!ec2 || serverA || serverB) && (!rds || primary || standby) && (!s3 || storageAvailable) && (!cdn || cdnAvailable) && (!dns || dnsAvailable);
  const degraded = config.failure === 'cpu' && serverA;
  const failedResource = config.failure === 'server' ? 'EC2 / servidor A' : config.failure === 'zone' ? 'Zona A' : ['database','connections'].includes(config.failure) ? 'RDS / base de datos' : config.failure === 'storage' ? 'S3 / objetos' : config.failure === 'cdn' ? 'CloudFront / distribución' : config.failure === 'dns' ? 'Route 53 / DNS' : config.failure === 'cpu' ? 'EC2 / CPU' : '';
  return { ec2, rds, s3, cdn, dns, serverA, serverB, primary, standby, storageAvailable, cdnAvailable, dnsAvailable, appAvailable, degraded, failedResource,
    status: degraded ? 'Aplicación disponible con degradación de rendimiento' : appAvailable ? config.failure==='none' ? 'Todos los componentes disponibles' : 'Servicio conservado en el modelo' : 'Interrupción del servicio' };
}
export const fieldLabels: Record<string, string> = { name: 'Nombre', type: 'Tipo', region: 'Región', users: 'Usuarios', availability: 'Disponibilidad', objective: 'Objetivo', description: 'Descripción', selectedServices: 'Servicios', costItems: 'Detalle de costos', monthlyCost: 'Costo mensual USD', annualCost: 'Costo anual USD' };
export function differences(before: Simulation | undefined, after: Simulation | undefined) {
  return Object.entries(fieldLabels).filter(([k]) => JSON.stringify(before?.[k as keyof Simulation]) !== JSON.stringify(after?.[k as keyof Simulation])).map(([key, label]) => ({ key, label, before: before?.[key as keyof Simulation], after: after?.[key as keyof Simulation] }));
}
