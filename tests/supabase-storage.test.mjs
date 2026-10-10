import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/supabaseStorage.ts',import.meta.url),'utf8');
async function storage(env){
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('import.meta.env',JSON.stringify(env));
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
test('No finge guardar cuando falta Supabase',async()=>{
 const api=await storage({});
 await assert.rejects(api.fetchCloudSimulations(),/Configura/);
 await assert.rejects(api.upsertCloudSimulation({id:'a'}),/configurado/);
});
test('Carga, guarda y elimina por REST; admite la clave publishable',async()=>{
 const api=await storage({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_ANON_KEY:'sb_publishable_test'});
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(init.method==='PATCH'?[{id:'a'}]:init.method?[ ]:[{simulation:{id:'a'}}]),{status:200});};
 try{
  assert.deepEqual(await api.fetchCloudSimulations(),[{id:'a'}]);
  await api.upsertCloudSimulation({id:'a',name:'Test',createdAt:'2026-10-07',updatedAt:'2026-10-07'});
  await api.patchCloudOperations('a',{budgetLimit:100});
  await api.deleteCloudSimulation('a');
  assert.equal(calls[1].init.method,'POST');assert.equal(calls[2].init.method,'PATCH');assert.equal(calls[3].init.method,'DELETE');
  assert.equal(calls[0].init.headers.apikey,'sb_publishable_test');assert.equal(calls[0].init.headers.Authorization,undefined);
  globalThis.fetch=async()=>new Response('Table missing',{status:404});
  await assert.rejects(api.upsertCloudSimulation({id:'a'}),/404/);
 }finally{globalThis.fetch=original;}
});
test('Los contextos de simulaciones no acceden a localStorage',()=>{
 for(const name of ['../src/context/SimulationContext.tsx','../src/operations/OperationsContext.tsx'])assert.doesNotMatch(readFileSync(new URL(name,import.meta.url),'utf8'),/localStorage\.(getItem|setItem)/);
});
