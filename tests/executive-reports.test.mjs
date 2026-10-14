import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
test('Reportes ofrece informe ejecutivo y técnico con vista previa',()=>{
 const ui=read('../src/pages/AIProjectAnalysis.tsx');
 assert.match(ui,/Informe ejecutivo/);
 assert.match(ui,/Informe técnico completo/);
 assert.match(ui,/openPdfPreview\('executive'\)/);
 assert.match(ui,/openPdfPreview\('reports'\)/);
 assert.match(ui,/createExecutivePdf/);
 assert.match(ui,/createSectionPdf/);
});
test('El informe gerencial toma datos de auditoría real y evita tarifas inventadas',()=>{
 const src=read('../src/lib/executivePdf.ts');
 for(const field of ['a.general.summary','a.risks','a.improvements','a.pillars','a.coverage.examined.length']) assert.ok(src.includes(field),field);
 assert.match(src,/No se dispone de tarifas AWS verificadas/);
 assert.match(src,/no en precios AWS verificados/);
 assert.match(src,/Se examinaron/);
});
