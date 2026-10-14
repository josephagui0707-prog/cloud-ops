import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {inspectProject,redact} from '../server/project-ingest.mjs';
import {cleanResult,makeMarkdown} from '../server/ai-engine.mjs';
const archive=await readFile(new URL('../ejemplos/Proyecto_Prueba_CloudOps_Con_Riesgos.zip',import.meta.url));
const sample=await inspectProject('Proyecto_Prueba_CloudOps_Con_Riesgos.zip',archive.toString('base64'));
test('ZIP real de prueba: detecta código, configs AWS y framework sin ejecutar nada',()=>{
 assert.ok(sample.selected.length>=4);
 assert.ok(sample.chunks.length>=1);
 assert.ok(sample.selected.some(x=>/server\.js$/.test(x.path)));
 assert.ok(sample.selected.some(x=>/iam-policy/.test(x.path)));
 assert.equal(sample.sha256.length,64);
 assert.ok(sample.selected.every(x=>x.content.includes('1: ')));
});
test('redacta secretos tipo Gemini, OpenAI y AWS del contenido enviado',()=>{
 const data=redact('API_KEY=abcdefghijklmnopqrstuvwxyz123456\nOPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123\nAWS_KEY=AKIAABCDEFGHIJKLMNOP\nGEMINI_API_KEY=AQ.abcdef12345678901234567890');
 assert.ok(!data.includes('sk-abcdefghijklmnopqrstuvwxyz'));
 assert.ok(!data.includes('AKIAABCDEFGHIJKLMNOP'));
 assert.ok(!data.includes('AQ.abcdef123456'));
});
test('rechaza archivos fuera del ZIP, exceso de 8 MB y rutas peligrosas',async()=>{
 await assert.rejects(()=>inspectProject('project.txt',archive.toString('base64')),/ZIP/);
 const large=Buffer.alloc(8*1024*1024+1);await assert.rejects(()=>inspectProject('p.zip',large.toString('base64')),/8 MB/);
 const z=new JSZip();z.file('bad\\secrets.txt','hello');const buf=await z.generateAsync({type:'nodebuffer'});await assert.rejects(()=>inspectProject('p.zip',buf.toString('base64')),/rutas inseguras/);
});
test('no admite archivos inexistentes como evidencias de Gemini',()=>{
 const first=sample.selected[0];
 const r=cleanResult({summary:'Prueba',risks:[{title:'falso',severity:'CRÍTICO',file:'inventado.js',line:1,evidence:'...',impact:'...',recommendation:'...'}, {title:'verificar',severity:'ALTO',file:first.path,line:99999,evidence:'evidencia no presente',impact:'impacto',recommendation:'solución'}]},[first]);
 assert.equal(r.risks.length,1);assert.equal(r.risks[0].line,null);assert.equal(r.risks[0].verified,false);
});
test('informe resulta en Markdown exportable',()=>{
 const r={general:{project:'demo.zip',summary:'resumen',detected:{languages:['JavaScript'],frameworks:[],database:[]}},pillars:[],risks:[],aws:[],improvements:[],architecture:'',security:'',performance:'',costs:'',coverage:{examined:[],eligible:0,excluded:[]},model:'demo',createdAt:'2026-01-01',caveat:'estático'};
 assert.match(makeMarkdown(r),/Resumen ejecutivo/);
});
