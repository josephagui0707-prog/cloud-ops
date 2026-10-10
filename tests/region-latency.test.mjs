import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/regionLatency.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const model = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const { greatCircleDistanceKm, estimateRegionLatency, latencyOrigins, latencyProfiles } = model;

test('distancia cero en origen y simetría entre dos ciudades', () => {
  const lima = latencyOrigins[0].coordinates;
  const bogota = latencyOrigins[1].coordinates;
  assert.equal(greatCircleDistanceKm(lima, lima), 0);
  assert.ok(Math.abs(greatCircleDistanceKm(lima, bogota) - greatCircleDistanceKm(bogota, lima)) < 0.001);
});
test('la región más distante tiene mayor latencia de propagación para una misma red', () => {
  const lima = latencyOrigins[0].coordinates;
  const brasil = [-46.63, -23.55];
  const tokio = [139.69, 35.69];
  const near = estimateRegionLatency(lima, brasil);
  const far = estimateRegionLatency(lima, tokio);
  assert.ok(near.distanceKm < far.distanceKm);
  assert.ok(near.rttMs < far.rttMs);
});
test('congestión aumenta RTT; tamaño del archivo aumenta transferencia pero no RTT', () => {
  const lima = latencyOrigins[0].coordinates;
  const virginia = [-77.04, 38.91];
  const normal = estimateRegionLatency(lima, virginia, latencyProfiles[0], 0.1);
  const huge = estimateRegionLatency(lima, virginia, latencyProfiles[0], 5);
  const congested = estimateRegionLatency(lima, virginia, latencyProfiles[2], 0.1);
  assert.equal(normal.rttMs, huge.rttMs);
  assert.ok(huge.totalMs > normal.totalMs);
  assert.ok(congested.rttMs > normal.rttMs);
  assert.ok(congested.totalMs > normal.totalMs);
});
