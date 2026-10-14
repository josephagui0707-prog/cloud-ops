/**
 * Modelo de planificación (NO es un ping real ni una medición AWS).
 * Distancia ortodrómica Haversine + trayecto de fibra 1.35x sobre el camino
 * mínimo + retardo hipotético de acceso/congestión según perfil.
 * La señal óptica se aproxima a 200 000 km/s dentro de fibra.
 * RTT (ms) ≈ distancia_km * 1.35 / 100 + sobrecarga_ms.
 * Transferencia (ms) ≈ RTT + tamaño_MiB * 8.388608 / Mbps * 1000 + 12 ms.
 */

export type GeographicPoint = {
  id: string;
  label: string;
  coordinates: [number, number]; // [longitud, latitud]
};

export type NetworkProfile = {
  id: string;
  label: string;
  description: string;
  overheadMs: number;
  megabitsPerSecond: number;
};

export const latencyOrigins: GeographicPoint[] = [
  { id: 'lima', label: 'Lima, Perú', coordinates: [-77.0428, -12.0464] },
  { id: 'bogota', label: 'Bogotá, Colombia', coordinates: [-74.0721, 4.711] },
  { id: 'santiago', label: 'Santiago, Chile', coordinates: [-70.6693, -33.4489] },
  { id: 'buenos-aires', label: 'Buenos Aires, Argentina', coordinates: [-58.3816, -34.6037] },
  { id: 'mexico', label: 'Ciudad de México, México', coordinates: [-99.1332, 19.4326] },
  { id: 'miami', label: 'Miami, Estados Unidos', coordinates: [-80.1918, 25.7617] },
  { id: 'madrid', label: 'Madrid, España', coordinates: [-3.7038, 40.4168] },
];

export const latencyProfiles: NetworkProfile[] = [
  {
    id: 'fiber', label: 'Fibra / red estable',
    description: '100 Mbps · +8 ms de acceso estimado',
    overheadMs: 8, megabitsPerSecond: 100,
  },
  {
    id: 'mobile', label: 'Móvil 4G',
    description: '25 Mbps · +35 ms de acceso estimado',
    overheadMs: 35, megabitsPerSecond: 25,
  },
  {
    id: 'congested', label: 'Red congestionada',
    description: '8 Mbps · +75 ms de acceso estimado',
    overheadMs: 75, megabitsPerSecond: 8,
  },
];

export const payloadChoices = [0.1, 1, 5] as const;

export type LatencyEstimate = {
  distanceKm: number;
  propagationMs: number;
  accessMs: number;
  rttMs: number;
  transferMs: number;
  totalMs: number;
  category: 'Baja' | 'Media' | 'Alta';
};

export function greatCircleDistanceKm(
  from: [number, number],
  to: [number, number],
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to[1] - from[1]);
  const dLng = radians(to[0] - from[0]);
  const latFrom = radians(from[1]);
  const latTo = radians(to[1]);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(latFrom) * Math.cos(latTo) * Math.sin(dLng / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function estimateRegionLatency(
  from: [number, number],
  to: [number, number],
  profile: NetworkProfile = latencyProfiles[0],
  payloadMiB = 1,
): LatencyEstimate {
  const distanceKm = greatCircleDistanceKm(from, to);
  const propagationMs = distanceKm * 1.35 / 100;
  const accessMs = profile.overheadMs;
  const rttMs = Math.round(propagationMs + accessMs);
  const transferMs = Math.round((payloadMiB * 8.388608 / profile.megabitsPerSecond) * 1000);
  const totalMs = rttMs + transferMs + 12; // 12ms hipotéticos de procesamiento
  return {
    distanceKm: Math.round(distanceKm),
    propagationMs: Math.round(propagationMs),
    accessMs,
    rttMs,
    transferMs,
    totalMs,
    category: rttMs < 90 ? 'Baja' : rttMs < 170 ? 'Media' : 'Alta',
  };
}
