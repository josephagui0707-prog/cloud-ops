import { jsPDF } from 'jspdf';
import { createAuditPdf } from './auditPdf';

// Todas las exportaciones se construyen con los datos en pantalla / el análisis
// privado ya guardado. No se consulta Gemini ni se ejecuta el ZIP.
export type SectionId = 'upload'|'general'|'risks'|'security'|'aws'|'performance'|'costs'|'recommendations'|'history'|'reports';
export type RiskRow = {title:string;severity:string;file:string;line:number|null;evidence:string;impact:string;recommendation:string;confidence:string;category:string;verified:boolean};
export type AuditData = {
 general:{project:string;summary:string;detected:{languages:string[];frameworks:string[];dependencies:string[];infrastructure:string[];database:string[]}};
 risks:RiskRow[];security:string;architecture:string;performance:string;costs:string;improvements:string[];
 aws:{service:string;purpose:string;reason:string}[];
 pillars:{name:string;assessment:string;status:string}[];
 coverage:{totalEntries:number;eligible:number;examined:{path:string;partial:boolean}[];excluded:{path:string;reason:string}[];blocks:number};
 model:string;createdAt:string;caveat:string;
};
export type SectionPdfContext = {
 analysis?:AuditData|null;
 report?:string;
 filename:string;
 zip?:{size:number;names:string[];total:number;scenario:string};
 history?:{filename:string;model:string;scenario:string;created_at:string}[];
 costs?:{computeHours:number;computeRate:number;storageGB:number;storageRate:number;otherMonthly:number;incomePerHour:number;downtimeHours:number;recoveryCost:number};
};
export const SECTION_TITLES:Record<SectionId,string>={
 upload:'Ficha de proyecto ZIP',general:'Análisis general',risks:'Riesgos y vulnerabilidades',
 security:'Seguridad del proyecto',aws:'Arquitectura y servicios AWS',performance:'Rendimiento y escalabilidad',
 costs:'Costos e impacto económico',recommendations:'Recomendaciones de mejora',history:'Historial de análisis',reports:'Auditoría completa'
};
const NAVY:[number,number,number]=[18,39,65];
const BLUE:[number,number,number]=[32,95,170];
const GRAY:[number,number,number]=[78,99,120];
const BORDER:[number,number,number]=[218,227,237];
const LIGHT:[number,number,number]=[246,249,253];
const WHITE:[number,number,number]=[255,255,255];
function plain(value:unknown):string {return String(value??'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2022/g,'-').replace(/[\u2190-\u27FF]/g,'-').replace(/[^\u000A\u000D\u0020-\u00FF]/g,'?').replace(/\*\*|__|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/^#{1,6}\s*/gm,'').trim();}
function pdfDate(value?:string){const dt=value?new Date(value):new Date();return Number.isNaN(dt.getTime())?'Sin fecha':dt.toLocaleString('es-PE');}
const money=(n:number)=>Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'0.00';

export function createSectionPdf(section:SectionId,context:SectionPdfContext):jsPDF {
 const a=context.analysis;
 if(section==='reports'){
  if(!a)throw Error('Selecciona un informe antes de exportar la auditoría completa.');
  return createAuditPdf(a,context.report||'',context.filename||a.general.project);
 }
 if(section!=='upload'&&section!=='history'&&!a)throw Error('Primero analiza un proyecto o abre un informe del historial.');
 if(section==='upload'&&!context.zip&&!a)throw Error('Selecciona un ZIP para generar su ficha técnica.');
 const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const W=210,M=18,YMAX=274,CONTENT=W-2*M;let y=27;
 const rgb=(v:[number,number,number])=>v;
 const color=(c:[number,number,number])=>pdf.setTextColor(...rgb(c));
 const fill=(c:[number,number,number])=>pdf.setFillColor(...rgb(c));
 const stroke=(c:[number,number,number])=>pdf.setDrawColor(...rgb(c));
 const newPage=()=>{pdf.addPage();y=25;};
 const ensure=(height:number)=>{if(y+height>YMAX)newPage();};
 const write=(value:unknown,{size=9.3,bold=false,gap=3,ink=NAVY,indent=0}:{size?:number;bold?:boolean;gap?:number;ink?:[number,number,number];indent?:number}={})=>{
  const t=plain(value);if(!t)return;
  pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);color(ink);
  const lineHeight=Math.max(4.3,size*.48+1);const avail=CONTENT-indent;
  for(const part of t.split(/\n+/)){
   const chunks=pdf.splitTextToSize(part,avail) as string[];
   for(const line of chunks){ensure(lineHeight+1);pdf.text(line,M+indent,y);y+=lineHeight;}
  }y+=gap;
 };
 const heading=(title:string)=>{
  ensure(16);y+=5;fill(BLUE);pdf.roundedRect(M,y-5,3,10,1,1,'F');
  pdf.setFont('helvetica','bold');pdf.setFontSize(12.5);color(NAVY);pdf.text(plain(title).slice(0,100),M+8,y+2);y+=11;
  stroke(BORDER);pdf.setLineWidth(.22);pdf.line(M,y-4,W-M,y-4);
 };
 const labelValue=(key:string,value:unknown)=>{if(value!==null&&value!==undefined&&String(value).trim())write(`${key}: ${value}`,{size:9.1,gap:2});};
 const table=(headers:string[],widths:number[],rows:string[][],maxLines=6)=>{
  if(!rows.length){write('Sin registros para esta sección.',{ink:GRAY});return;}
  const padx=2.8,pady=2.4,heightHeader=10,lh=3.85;
  const header=()=>{ensure(heightHeader+9);fill(NAVY);pdf.roundedRect(M,y,CONTENT,heightHeader,1,1,'F');pdf.setFont('helvetica','bold');pdf.setFontSize(8);color(WHITE);let x=M;
   headers.forEach((h,i)=>{pdf.text(plain(h),x+padx,y+6.4,{maxWidth:widths[i]-2*padx});x+=widths[i];});y+=heightHeader;};
  header();
  rows.forEach((row,idx)=>{
   const groups=row.map((v,i)=>{const all=pdf.splitTextToSize(plain(v)||'-',Math.max(8,widths[i]-2*padx)) as string[];
    if(all.length>maxLines){const selected=all.slice(0,maxLines);selected[maxLines-1]=selected[maxLines-1].slice(0,-3)+'...';return selected;}return all.length?all:['-'];});
   const height=Math.max(10,Math.max(...groups.map(g=>g.length))*lh+2*pady);
   if(y+height>YMAX){newPage();header();}
   fill(idx%2===0?LIGHT:WHITE);pdf.rect(M,y,CONTENT,height,'F');stroke(BORDER);pdf.setLineWidth(.2);pdf.line(M,y+height,W-M,y+height);
   let x=M;pdf.setFont('helvetica','normal');pdf.setFontSize(7.9);color(NAVY);
   groups.forEach((group,i)=>{group.forEach((ln,j)=>pdf.text(ln,x+padx,y+pady+3+j*lh));x+=widths[i];});y+=height;
  });y+=7;
 };
 const riskOrder=['CRÍTICO','ALTO','MEDIO','BAJO'];
 const sortRisks=(items:RiskRow[])=>[...items].sort((x,z)=>riskOrder.indexOf(x.severity)-riskOrder.indexOf(z.severity));
 const issues=(items:RiskRow[])=>{
  table(['Gravedad','Hallazgo','Archivo / línea','Confianza'],[25,62,64,23],sortRisks(items).map(r=>[r.severity,r.title,`${r.file||'No localizado'}${r.line?':'+r.line:''}`,r.confidence||'N/D']),4);
  for(const [i,r] of sortRisks(items).entries()){
   ensure(18);
   write(`${i+1}. [${r.severity}] ${r.title}`,{size:10.6,bold:true});
   labelValue('Archivo',`${r.file||'No localizado'}${r.line?` (línea ${r.line})`:''}`);
   labelValue('Evidencia',r.evidence);
   labelValue('Impacto',r.impact);
   labelValue('Solución recomendada',r.recommendation);
   write(`Confianza ${r.confidence||'no indicada'}; evidencia ${r.verified?'cotejada':'no cotejada'}.`,{size:8.1,ink:GRAY,gap:6});
  }
 };
 // Encabezado profesional del documento del submódulo.
 fill(NAVY);pdf.rect(0,0,W,55,'F');fill([18,125,116]);pdf.rect(0,53,W,2,'F');
 pdf.setFont('helvetica','bold');pdf.setFontSize(10);color(WHITE);pdf.text('CLOUDOPS  /  INFORME POR SUBMÓDULO',M,18);
 pdf.setFontSize(17);const titleLines=(pdf.splitTextToSize(plain(SECTION_TITLES[section]),CONTENT) as string[]).slice(0,2);for(let i=0;i<titleLines.length;i++)pdf.text(titleLines[i],M,31+i*7);
 pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.text('Evaluación estática y documentación técnica de proyecto',M,48);
 y=68;
 labelValue('Proyecto / archivo',context.filename||a?.general.project||'No identificado');
 labelValue('Fecha del documento',pdfDate());
 if(a){labelValue('Modelo de IA',a.model);labelValue('Fecha del análisis',pdfDate(a.createdAt));}
 write('Alcance: únicamente los datos pertinentes a esta sección. No se realizan pruebas dinámicas ni llamadas adicionales a Gemini.',{size:8.2,ink:GRAY,gap:6});

 switch(section){
 case 'upload':{
  heading('Resumen del ZIP seleccionado');
  if(context.zip){labelValue('Nombre',context.filename);labelValue('Tamaño',`${(context.zip.size/1024).toFixed(1)} KB`);labelValue('Entradas en el ZIP',context.zip.total);labelValue('Escenario de evaluación',context.zip.scenario);
   heading('Estructura del archivo');table(['#','Ruta interna (vista previa)'],[13,161],context.zip.names.map((n,i)=>[String(i+1),n]),3);
   if(context.zip.total>context.zip.names.length)write(`Solo se muestran ${context.zip.names.length} de ${context.zip.total} entradas del ZIP.`,{ink:GRAY,size:8.8});}
  else write('Archivo cargado previamente desde el historial: no se conserva el ZIP original.',{ink:GRAY});
  if(a){heading('Cobertura del análisis guardado');table(['Indicador','Valor'],[115,59],[['Archivos elegibles',String(a.coverage.eligible)],['Archivos examinados',String(a.coverage.examined.length)],['Bloques de análisis',String(a.coverage.blocks)]]);}
  break;
 }
 case 'general':{
  if(!a)break;
  heading('Resumen ejecutivo');write(a.general.summary||'Sin resumen generado.');
  heading('Perfil tecnológico');table(['Elemento','Tecnología detectada'],[55,119],[['Lenguajes',a.general.detected.languages.join(', ')||'No identificados'],['Frameworks',a.general.detected.frameworks.join(', ')||'No identificados'],['Dependencias',a.general.detected.dependencies.join(', ')||'No identificadas'],['Base de datos',a.general.detected.database.join(', ')||'No identificada'],['Infraestructura',a.general.detected.infrastructure.join(', ')||'No detectada']],6);
  heading('Seis pilares AWS Well-Architected');table(['Pilar','Estado','Evaluación'],[47,30,97],a.pillars.map(p=>[p.name,p.status,p.assessment]),6);
  heading('Cobertura y limitaciones');write(`${a.coverage.examined.length} archivos examinados de ${a.coverage.eligible} elegibles; ${a.coverage.excluded.length} archivos excluidos.`);table(['Archivo','Cobertura'],[145,29],a.coverage.examined.map(f=>[f.path,f.partial?'Parcial':'Examinado']),2);
  break;
 }
 case 'risks':{
  if(!a)break;
  heading('Resumen de riesgos');table(['Nivel','Cantidad'],[85,89],riskOrder.map(l=>[l,String(a.risks.filter(r=>r.severity===l).length)]));
  heading('Matriz y evidencia de riesgos');if(a.risks.length)issues(a.risks);else write('No se identificaron hallazgos confirmados en la muestra analizada; esto no garantiza ausencia de vulnerabilidades.');
  break;
 }
 case 'security':{
  if(!a)break;
  heading('Evaluación de seguridad');write(a.security||'No hay evidencia suficiente para una evaluación adicional de seguridad.');
  heading('Hallazgos de seguridad');const security=a.risks.filter(r=>/seguridad|security/i.test(r.category));if(security.length)issues(security);else write('No se clasificaron hallazgos de seguridad. Es necesaria una revisión técnica independiente.');
  write('La revisión es estática: no se ha realizado pentesting ni auditoría dinámica de OWASP.',{size:8.5,ink:GRAY});break;
 }
 case 'aws':{
  if(!a)break;
  heading('Evaluación de arquitectura');write(a.architecture||'No hay arquitectura propuesta con evidencia suficiente.');
  heading('Servicios AWS justificados');table(['Servicio','Uso previsto','Justificación'],[37,67,70],a.aws.map(s=>[s.service,s.purpose,s.reason]),6);
  heading('Pilares Well-Architected');table(['Pilar','Estado','Evaluación'],[47,30,97],a.pillars.map(p=>[p.name,p.status,p.assessment]),5);
  heading('Infraestructura detectada');write(a.general.detected.infrastructure.join(', ')||'No se identificaron definiciones de infraestructura.');break;
 }
 case 'performance':{
  if(!a)break;
  heading('Rendimiento y escalabilidad');write(a.performance||'No se han identificado suficientes evidencias de rendimiento.');
  heading('Riesgos asociados');const selected=a.risks.filter(r=>/rendimiento|performance|escalabilidad|disponibilidad|concurrencia/i.test(r.category));if(selected.length)issues(selected);else write('No se clasificaron riesgos de rendimiento de forma específica.');
  write('No se ejecutaron pruebas de carga, estrés, CPU, memoria ni latencia. Los problemas hipotéticos requieren mediciones.',{ink:GRAY,size:8.5});break;
 }
 case 'costs':{
  if(!a)break;
  heading('Evaluación de costos generada por IA');write(a.costs||'Se necesitan parámetros de uso y precios comprobados.');
  const c=context.costs;
  if(c){const compute=c.computeHours*c.computeRate, storage=c.storageGB*c.storageRate,month=compute+storage+c.otherMonthly;
   heading('Escenario ilustrativo introducido por el usuario');table(['Parámetro','Cantidad / valor'],[119,55],[['Cómputo (horas/mes)',String(c.computeHours)],['Tarifa cómputo (USD/h)',money(c.computeRate)],['Almacenamiento (GB)',String(c.storageGB)],['Tarifa almacenamiento (USD/GB-mes)',money(c.storageRate)],['Otros servicios (USD/mes)',money(c.otherMonthly)],['Costo mensual ilustrativo (USD)',money(month)],['Costo anual ilustrativo (USD)',money(month*12)]],4);
   heading('Impacto económico de una interrupción');table(['Parámetro','Valor'],[119,55],[['Ingresos por hora (moneda local)',money(c.incomePerHour)],['Horas de inactividad',String(c.downtimeHours)],['Costos de recuperación (moneda local)',money(c.recoveryCost)],['Pérdida potencial ilustrativa (moneda local)',money(c.incomePerHour*c.downtimeHours+c.recoveryCost)]],4);
  }
  write('Las tarifas fueron introducidas por el usuario. Cero significa dato desconocido, no servicio gratuito. No es cotización oficial AWS. Verifica región, tráfico y precios en AWS Pricing Calculator.',{ink:GRAY,size:8.5});break;
 }
 case 'recommendations':{
  if(!a)break;
  heading('Plan de remediación de riesgos');table(['Prioridad','Problema','Acción correctiva'],[27,60,87],sortRisks(a.risks).map(r=>[r.severity,r.title,r.recommendation||'Revisión pendiente']),5);
  heading('Mejoras propuestas por Gemini');table(['#','Recomendación'],[15,159],a.improvements.map((v,i)=>[String(i+1),v]),6);
  if(!a.improvements.length&&!a.risks.length)write('No se registraron acciones de mejora basadas en evidencia.');break;
 }
 case 'history':{
  heading('Historial privado del usuario actual');const history=context.history||[];
  write(`${history.length} informes cargados en la pantalla desde Supabase. Esta lista solo debe incluir registros autorizados para la sesión actual.`,{size:9.1});
  table(['Proyecto / ZIP','Modelo','Fecha','Escenario'],[76,40,36,22],history.map(p=>[p.filename,p.model,pdfDate(p.created_at),p.scenario]),3);
  if(!history.length)write('No existen informes guardados en esta sesión o todavía no se cargó el historial.',{ink:GRAY});break;
 }
 default:break;
 }
 heading('Conclusiones y límites de esta sección');
 write(a?.caveat||'Documento descriptivo generado a partir de los datos disponibles en CloudOps. No sustituye una auditoría de producción.',{size:9.1});
 write('Reporte generado localmente a partir de la información mostrada, sin modificar el proyecto ni realizar nuevas consultas a IA.',{size:8.5,ink:GRAY});
 const count=pdf.getNumberOfPages();for(let i=1;i<=count;i++){pdf.setPage(i);stroke(BORDER);pdf.line(M,282,W-M,282);pdf.setFont('helvetica','normal');pdf.setFontSize(8);color(GRAY);pdf.text(`CloudOps | ${plain(SECTION_TITLES[section])}`,M,287);pdf.text(`${i} / ${count}`,W-M,287,{align:'right'});}
 pdf.setProperties({title:`CloudOps - ${plain(SECTION_TITLES[section])}`,subject:'Informe técnico de un submódulo de CloudOps',author:'CloudOps'});
 return pdf;
}
