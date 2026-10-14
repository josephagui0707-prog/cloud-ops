import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url),'utf8');

test('el menú de IA se despliega con flecha y submódulos individuales',()=>{
 const sidebar=read('../src/components/Sidebar.tsx');
 assert.match(sidebar,/setAiOpen\(\(value\) => !value\)/);
 assert.match(sidebar,/ChevronDown/);
 assert.match(sidebar,/aria-expanded=\{aiOpen\}/);
 assert.match(sidebar,/to=\{`\$\{path\}\?tab=\$\{tab\}`\}/);
});
test('cada sección del módulo tiene su propio contenido y no hay botones horizontales duplicados',()=>{
 const page=read('../src/pages/AIProjectAnalysis.tsx');
 assert.doesNotMatch(page,/className="ai-tabs"/);
 for(const section of ['general','risks','security','aws','performance','costs','recommendations','history','reports']){
  assert.ok(page.includes(`id==='${section}'`) || page.includes(`    ${section}:{`), `Missing ${section}`);
 }
 assert.match(page,/const tab=SECTIONS\.some/);
 assert.match(page,/query\.get\('tab'\)/);
});
test('chat general no comparte informe y modo proyecto usa contexto privado',()=>{
 const server=read('../server/index.mjs');
 assert.match(server,/const mode=input\.mode==='project'\?'project':'general'/);
 assert.match(server,/if\(mode==='project'\)/);
 assert.match(server,/select=filename,report/);
 assert.match(server,/No recibes archivos de proyectos en este modo/);
 const ui=read('../src/pages/AIProjectAnalysis.tsx');
 assert.match(ui,/Chat general/);
 assert.match(ui,/Sobre mi proyecto/);
 assert.match(ui,/analysisId:chatMode==='project'/);
});
test('PDF cuenta con tablas de riesgos, AWS, pilares y remediación',()=>{
 const pdf=read('../src/lib/auditPdf.ts');
 assert.match(pdf,/Matriz de riesgos priorizados/);
 assert.match(pdf,/Plan de remediación vinculado a hallazgos/);
 assert.match(pdf,/Servicios recomendados y justificación/);
 assert.match(pdf,/Seis pilares AWS Well-Architected/);
 assert.match(pdf,/const drawTable=/);
});
