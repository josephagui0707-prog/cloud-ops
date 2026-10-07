import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const js = ts.transpileModule(readFileSync(new URL('../src/operations/model.ts', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {budgetLevel,evaluateFailure,defaultLab,differences,isFailureAvailable,failureGuidance,failureNames} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
test('Presupuesto: límites exactos 80/100, exceso, sin configurar y valores inválidos',()=>{
  assert.equal(budgetLevel(79.99,100),'ok');assert.equal(budgetLevel(80,100),'warning');
  assert.equal(budgetLevel(99.99,100),'warning');assert.equal(budgetLevel(100,100),'critical');
  assert.equal(budgetLevel(120,100),'critical');assert.equal(budgetLevel(0,100),'ok');
  for(const limit of [undefined,0,-1,NaN,Infinity]) assert.equal(budgetLevel(100,limit),'unset');
});
test('Servidor: interrupción sin redundancia, recuperación con servidor B',()=>{
  assert.equal(evaluateFailure(['EC2','RDS'],defaultLab).appAvailable,true);
  assert.equal(evaluateFailure(['EC2','RDS'],{...defaultLab,failure:'server'}).appAvailable,false);
  assert.equal(evaluateFailure(['EC2','RDS'],{...defaultLab,failure:'server',secondServer:true}).appAvailable,true);
});
test('Zona: se necesitan réplicas de aplicación y datos para mantener el servicio',()=>{
  for(const secondServer of [false,true]) for(const standbyDatabase of [false,true]) {
    const state=evaluateFailure(['EC2','RDS'],{failure:'zone',secondServer,standbyDatabase});
    assert.equal(state.appAvailable,secondServer && standbyDatabase);
    assert.equal(state.serverA,false);assert.equal(state.primary,false);
  }
});
test('Base de datos: el servidor sigue encendido pero la aplicación depende de la recuperación',()=>{
  const state=evaluateFailure(['EC2','RDS'],{...defaultLab,failure:'database'});
  assert.equal(state.serverA,true);assert.equal(state.appAvailable,false);
  assert.equal(evaluateFailure(['EC2','RDS'],{...defaultLab,failure:'database',standbyDatabase:true}).appAvailable,true);
});
test('No inventa servicios; aplicación sin RDS no depende del fallo de base de datos',()=>{
  assert.equal(evaluateFailure(['S3'],defaultLab).appAvailable,false);
  assert.equal(evaluateFailure(['EC2'],{...defaultLab,failure:'database'}).appAvailable,true);
  assert.equal(evaluateFailure(['EC2'],{...defaultLab,failure:'zone',secondServer:true}).appAvailable,true);
});
test('Comparación: detecta nombre/costos/servicios y no fechas técnicas ni objetos equivalentes',()=>{
  const before={name:'A',monthlyCost:10,selectedServices:['EC2'],costItems:[{service:'EC2',monthly:10}],updatedAt:'1'};
  const copy=structuredClone(before);copy.updatedAt='2';
  assert.deepEqual(differences(before,copy),[]);
  const after={...copy,name:'B',monthlyCost:20,selectedServices:['EC2','RDS']};
  assert.deepEqual(differences(before,after).map(x=>x.key),['name','selectedServices','monthlyCost']);
  assert.equal(before.name,'A');
});

test('Diagnósticos documentados para fallas en componentes del escenario',()=>{
  const cases=[['server',['EC2']],['zone',['RDS']],['cpu',['EC2']],['database',['RDS']],['connections',['RDS']],['storage',['S3']],['cdn',['CloudFront']],['dns',['Route 53']]];
  for(const [failure,services] of cases){
    assert.equal(isFailureAvailable(failure,services),true);
    assert.ok(failureNames[failure]);
    assert.ok(failureGuidance[failure].symptom.length>20);
    assert.ok(failureGuidance[failure].impact.length>20);
    assert.ok(failureGuidance[failure].solutions.length>=3);
  }
  assert.equal(isFailureAvailable('server',['RDS']),false);
  assert.equal(isFailureAvailable('zone',['RDS']),true);
  assert.equal(isFailureAvailable('storage',['EC2']),false);
});
