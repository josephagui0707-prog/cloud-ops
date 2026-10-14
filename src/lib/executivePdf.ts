import { jsPDF } from 'jspdf';
import type { AuditData, SectionPdfContext } from './sectionPdf';

/** Documento ejecutivo: sintetiza hallazgos ya guardados, no consulta a la IA. */
type RGB = readonly [number, number, number];
const NAVY: RGB = [17, 40, 66];
const BLUE: RGB = [29, 80, 145];
const TEAL: RGB = [15, 116, 110];
const LIGHT: RGB = [245, 248, 252];
const MUTED: RGB = [86, 106, 125];
const BORDER: RGB = [218, 227, 237];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [170, 39, 54];
const AMBER: RGB = [153, 93, 23];
const safe = (value: unknown) => String(value ?? '')
 .replace(/[\u200B-\u200D\uFEFF]/g, '')
 .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g,'"')
 .replace(/[\u2013\u2014]/g, '-')
 .replace(/[\u2022\u2190-\u27FF]/g, '-')
 .replace(/[^\u000A\u000D\u0020-\u00FF]/g, '?')
 .replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
 .replace(/^#{1,6}\s*/gm, '').trim();
const format = (value: number) => value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

export function createExecutivePdf(analysis: AuditData, context: Pick<SectionPdfContext,'filename'|'costs'>): jsPDF {
 const a: AuditData = analysis;
 const pdf = new jsPDF({format:'a4', orientation:'portrait', unit:'mm', compress:true});
 const W = 210, LEFT = 18, WIDTH = 174, BOTTOM = 276;
 let y = 26;
 const setFill = (rgb:RGB) => pdf.setFillColor(...rgb);
 const setInk = (rgb:RGB) => pdf.setTextColor(...rgb);
 const lineColor = (rgb:RGB) => pdf.setDrawColor(...rgb);
 const addPage = () => { pdf.addPage(); y=24; };
 const ensure = (mm:number) => { if(y+mm>BOTTOM) addPage(); };
 const body = (value:unknown, opts:{size?:number;ink?:RGB;bold?:boolean;gap?:number;indent?:number;maxChars?:number} = {}) => {
  let str = safe(value);
  if(opts.maxChars && str.length>opts.maxChars) str = `${str.slice(0,opts.maxChars).replace(/\s+\S*$/,'').trim()} ...`;
  if(!str)return;
  const size=opts.size??9.4, indent=opts.indent??0;
  const h=Math.max(4.5,size*.49+1.1);
  pdf.setFont('helvetica',opts.bold?'bold':'normal'); pdf.setFontSize(size); setInk(opts.ink||NAVY);
  const paragraphs=str.split(/\n+/).filter(Boolean);
  for(const para of paragraphs){
   const lines=pdf.splitTextToSize(para,WIDTH-indent) as string[];
   for(const chunk of lines){ensure(h+1);pdf.text(chunk,LEFT+indent,y);y+=h;}
  }
  y+=opts.gap??2.5;
 };
 const heading=(label:string) => {
  ensure(18); y+=5;
  setFill(TEAL);pdf.roundedRect(LEFT,y-5,3,10,1,1,'F');
  pdf.setFont('helvetica','bold');pdf.setFontSize(12.2);setInk(NAVY);pdf.text(safe(label),LEFT+8,y+2);
  y+=11;lineColor(BORDER);pdf.setLineWidth(.2);pdf.line(LEFT,y-4,W-LEFT,y-4);
 };
 const item=(label:string,description:string,number?:number) => {
  const content=safe(description);
  const test = pdf.splitTextToSize(content,WIDTH-14) as string[];
  ensure(10 + Math.min(3,test.length)*5);
  body(`${number ? `${number}. ` : ''}${label}`,{bold:true,size:9.6,gap:1});
  body(content,{size:8.8,ink:MUTED,indent:8,gap:3,maxChars:250});
 };
 const severityOrder=['CRÍTICO','ALTO','MEDIO','BAJO'];
 const risks=[...(a.risks||[])].sort((x,z)=>severityOrder.indexOf(x.severity)-severityOrder.indexOf(z.severity));
 const critical=risks.filter(r=>r.severity==='CRÍTICO').length;
 const high=risks.filter(r=>r.severity==='ALTO').length;
 const moderate=risks.filter(r=>r.severity==='MEDIO').length;
 const decision = critical ? 'ATENCIÓN PRIORITARIA' : high ? 'CORREGIR ANTES DEL DESPLIEGUE' : 'VERIFICACIÓN TÉCNICA PENDIENTE';
 const decisionInk = critical?RED:high?AMBER:TEAL;
 const date = new Date(a.createdAt);
 const dateLabel=Number.isNaN(date.getTime())?'Fecha no disponible':date.toLocaleDateString('es-PE');

 // Encabezado y ficha de identificación: legible y no orientado a desarrolladores.
 setFill(NAVY);pdf.rect(0,0,W,61,'F');setFill(TEAL);pdf.rect(0,58,W,3,'F');
 pdf.setFont('helvetica','bold');pdf.setFontSize(10);setInk(WHITE);pdf.text('CLOUDOPS  /  DIRECCIÓN Y GERENCIA',LEFT,16);
 pdf.setFontSize(22);pdf.text('INFORME EJECUTIVO',LEFT,30);
 pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text('Evaluación de riesgos previa al despliegue en AWS',LEFT,41);
 pdf.setFontSize(8.5);pdf.text('Documento para responsables del negocio y toma de decisiones',LEFT,51);
 y=73;
 body(a.general.project||context.filename,{size:15,bold:true,gap:4,maxChars:100});
 body(`Archivo: ${context.filename}   |   Análisis: ${dateLabel}`,{size:8.7,ink:MUTED,gap:4});
 ensure(19);
 setFill(LIGHT);lineColor(BORDER);pdf.roundedRect(LEFT,y,WIDTH,18,2,2,'FD');
 pdf.setFont('helvetica','bold');pdf.setFontSize(8);setInk(MUTED);pdf.text('SITUACIÓN RECOMENDADA',LEFT+5,y+6);
 pdf.setFontSize(12);setInk(decisionInk);pdf.text(decision,LEFT+5,y+13);
 y+=24;
 // Indicadores comprobables; no convertir los hallazgos en métricas de producción.
 ensure(27);
 const tiles=[['CRÍTICOS',critical],['ALTOS',high],['MEDIOS',moderate],['ARCHIVOS REVISADOS',a.coverage.examined.length]] as const;
 tiles.forEach(([label,num],i)=>{
  const x=LEFT+i*44;
  setFill(i%2?WHITE:LIGHT);lineColor(BORDER);pdf.roundedRect(x,y,42,25,2,2,'FD');
  pdf.setFont('helvetica','bold');pdf.setFontSize(17);setInk(label==='CRÍTICOS'?RED:NAVY);pdf.text(String(num),x+4,y+11);
  pdf.setFontSize(label==='ARCHIVOS REVISADOS'?6.5:7.3);setInk(MUTED);pdf.text(label,x+4,y+20);
 });
 y+=32;
 heading('1. Qué significa para la empresa');
 body(a.general.summary||'No se cuenta con un resumen suficiente para emitir conclusiones.',{maxChars:580,size:9.4,gap:4});
 body('Esta valoración procede de una revisión estática del ZIP. No equivale a una prueba en producción ni a una certificación de seguridad.',{size:8.1,ink:MUTED,gap:5});
 heading('2. Problemas que requieren atención');
 if(risks.length){
  risks.slice(0,4).forEach((risk,i)=>item(`[${risk.severity}] ${risk.title}`,risk.impact||risk.evidence||'El impacto necesita revisión por un especialista.',i+1));
  if(risks.length>4)body(`Se registraron ${risks.length-4} hallazgos adicionales en el informe de analistas.`,{ink:MUTED,size:8.6});
 }else body('No se reportaron hallazgos en los archivos examinados. Esto no demuestra ausencia de vulnerabilidades.',{size:9});

 heading('3. Decisiones sugeridas a la dirección');
 const actions=[...risks.filter(r=>['CRÍTICO','ALTO'].includes(r.severity)).map(r=>r.recommendation),...(a.improvements||[])].map(safe).filter(Boolean);
 const unique=Array.from(new Set(actions));
 if(unique.length)unique.slice(0,3).forEach((action,i)=>item(`Acción ${i+1}`,action));
 else body('Solicitar revisión técnica y definir pruebas mínimas antes de autorizar el despliegue.',{size:9.2});

 heading('4. Inversión y posibles pérdidas');
 const c=context.costs;
 const knownCompute=!!c && c.computeRate>0 && c.computeHours>0;
 const knownStorage=!!c && c.storageRate>0 && c.storageGB>0;
 if(c && (knownCompute||knownStorage||c.otherMonthly>0)){
  const partial=(knownCompute?c.computeHours*c.computeRate:0)+(knownStorage?c.storageGB*c.storageRate:0)+c.otherMonthly;
  body(`Subtotal ilustrativo de partidas informadas: USD ${format(partial)} mensuales / USD ${format(partial*12)} anuales.`,{size:9.1,bold:true});
  body('Cálculo parcial basado en tarifas introducidas por el usuario, no en precios AWS verificados. No representa un costo total ni una cotización oficial.',{size:8.2,ink:MUTED});
 }else body('No se dispone de tarifas AWS verificadas ni de suficientes parámetros de uso para estimar un presupuesto. Se requiere cotización en AWS Pricing Calculator.',{size:9});
 if(c && (c.incomePerHour>0||c.recoveryCost>0)){
  const loss=c.incomePerHour*c.downtimeHours+c.recoveryCost;
  body(`Pérdida potencial de interrupción (moneda local): ${format(loss)}. Supuestos: ${format(c.incomePerHour)} por hora, ${c.downtimeHours} horas y ${format(c.recoveryCost)} de recuperación.`,{size:9});
 }else body('Impacto financiero de interrupciones: sin cuantificar; faltan ingresos por hora y costo de recuperación.',{ink:MUTED,size:8.7});

 heading('5. Estado por los pilares de arquitectura AWS');
 if(a.pillars.length){
  a.pillars.slice(0,6).forEach(p=>item(`${p.name}: ${p.status}`,p.assessment));
 }else body('No existe una evaluación suficiente de los seis pilares en el análisis guardado.',{size:9});

 heading('6. Alcance y próximo paso');
 body(`Se examinaron ${a.coverage.examined.length} de ${a.coverage.eligible} archivos elegibles. ${a.coverage.excluded.length} entradas quedaron excluidas o sin evaluación.`,{size:9});
 body('Decisión final: solicitar al equipo técnico validar cada hallazgo, corregir los riesgos prioritarios y documentar pruebas de seguridad, carga y recuperación antes de autorizar producción.',{size:9.1,bold:true});
 body(a.caveat||'La auditoría automatizada puede ser incompleta y necesita revisión humana.',{size:8,ink:MUTED,maxChars:180,gap:0});

 const pages=pdf.getNumberOfPages();
 for(let i=1;i<=pages;i++){
  pdf.setPage(i);lineColor(BORDER);pdf.line(LEFT,281,W-LEFT,281);
  pdf.setFont('helvetica','normal');pdf.setFontSize(8);setInk(MUTED);
  pdf.text('CloudOps | Informe ejecutivo | Uso interno',LEFT,286);
  pdf.text(`${i} / ${pages}`,W-LEFT,286,{align:'right'});
 }
 pdf.setProperties({title:`CloudOps - Informe ejecutivo - ${safe(a.general.project)}`,subject:'Resumen ejecutivo de riesgos de proyecto AWS',author:'CloudOps'});
 return pdf;
}
