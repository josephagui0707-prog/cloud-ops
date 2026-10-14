import { jsPDF } from 'jspdf';

/* Generador local de PDF. No contacta al proveedor IA ni modifica el análisis guardado. */
type Finding = {title:string;severity:string;file:string;line:number|null;evidence:string;impact:string;recommendation:string;confidence:string;category:string;verified:boolean};
type Audit = {
 general:{project:string;summary:string;detected:{languages:string[];frameworks:string[];dependencies:string[];infrastructure:string[];database:string[]}};
 risks: Finding[]; security:string;architecture:string;performance:string;costs:string;improvements:string[];
 aws:{service:string;purpose:string;reason:string}[];
 pillars:{name:string;assessment:string;status:string}[];
 coverage:{totalEntries:number;eligible:number;examined:{path:string;partial:boolean}[];excluded:{path:string;reason:string}[];blocks:number};
 model:string; createdAt:string; caveat:string;
};
const COLORS={navy:[18,39,65], blue:[34,99,177], dark:[33,49,70], muted:[89,109,130], border:[218,228,237], pale:[246,249,252], teal:[17,125,115], white:[255,255,255]} as const;
type Color=readonly [number,number,number];
const color=(pdf:jsPDF,c:Color)=>pdf.setTextColor(c[0],c[1],c[2]);
const fill=(pdf:jsPDF,c:Color)=>pdf.setFillColor(c[0],c[1],c[2]);
const stroke=(pdf:jsPDF,c:Color)=>pdf.setDrawColor(c[0],c[1],c[2]);
const safe = (value:unknown) => String(value??'')
 .replace(/[\u200B-\u200D\uFEFF]/g,'')
 .replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"')
 .replace(/[\u2013\u2014]/g,'-').replace(/\u2022/g,'-')
 .replace(/[\u2190-\u21FF\u2500-\u27FF]/g,'-')
 .replace(/[^\u000A\u000D\u0020-\u00FF]/g,'?');
const flat = (text:unknown) => safe(text).replace(/\r/g,'').replace(/\*\*|__|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/^#{1,6}\s*/gm,'').trim();

export function createAuditPdf(a:Audit, report:string, filename:string):jsPDF {
 const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const W=210,H=297,M=18,WIDTH=W-2*M,TOP=25,BOTTOM=274;
 let y=TOP;
 const pagenum=()=>pdf.getNumberOfPages();
 const page=()=>{pdf.addPage();y=TOP;};
 const ensure=(need:number)=>{if(y+need>BOTTOM)page();};
 const write=(text:string,opts:{fontSize?:number;bold?:boolean;ink?:Color;indent?:number;gap?:number;leading?:number}={})=>{
   const fs=opts.fontSize??9.5,lh=opts.leading??(fs*0.48+1.2),indent=opts.indent??0;
   const normalized=flat(text);
   if(!normalized)return;
   pdf.setFont('helvetica',opts.bold?'bold':'normal');pdf.setFontSize(fs);color(pdf,opts.ink??COLORS.dark);
   const contentWidth=WIDTH-indent;
   const chunks=normalized.split('\n');
   for(const chunk of chunks){
     if(!chunk.trim()){ensure(4);y+=3;continue;}
     const lines=pdf.splitTextToSize(chunk,contentWidth) as string[];
     for(const line of lines){ensure(lh+1);pdf.text(line,M+indent,y);y+=lh;}
   }
   y+=opts.gap??3;
 };
 const title=(text:string)=>{
   ensure(19);y+=4;
   fill(pdf,COLORS.blue);pdf.roundedRect(M,y-5,3,10,1,1,'F');
   pdf.setFont('helvetica','bold');pdf.setFontSize(14);color(pdf,COLORS.navy);pdf.text(safe(text),M+8,y+2);
   y+=12;stroke(pdf,COLORS.border);pdf.line(M,y-4,W-M,y-4);
 };
 const subsection=(text:string)=>{ensure(12);y+=2;write(text,{fontSize:11.2,bold:true,ink:COLORS.navy,gap:4});};
 const kv=(label:string,value:unknown)=>{
   if(value===undefined||value===null||String(value).trim()==='')return;
   write(`${label}: ${String(value)}`,{fontSize:9.3,gap:3});
 };
 const uniqueList=(items:string[])=>items.length?items.join(', '):'No identificado en los archivos examinados';
 // Tablas con encabezados repetidos, filas alternas y salto de página sin cortar celdas.
 // Las tablas resumen contenido; el detalle completo se conserva en las fichas posteriores.
 const drawTable=(headers:string[],widths:number[],rows:string[][],maxLines=4)=>{
  if(!rows.length)return;
  const padX=2.8,padY=2.5,lineHeight=3.75,headHeight=10;
  const header=()=>{
   if(y+headHeight+12>BOTTOM)page();
   fill(pdf,COLORS.navy);pdf.roundedRect(M,y,WIDTH,headHeight,1,1,'F');
   pdf.setFont('helvetica','bold');pdf.setFontSize(8);color(pdf,COLORS.white);
   let x=M;
   headers.forEach((label,i)=>{pdf.text(safe(label),x+padX,y+6.5,{maxWidth:widths[i]-2*padX});x+=widths[i];});
   y+=headHeight;
  };
  header();
  rows.forEach((values,ri)=>{
   const lines=values.map((value,i)=>{
    const src=flat(value||'No determinado').replace(/\s*\n\s*/g,' ');
    const chunks=pdf.splitTextToSize(src,Math.max(8,widths[i]-2*padX)) as string[];
    if(chunks.length>maxLines){const selected=chunks.slice(0,maxLines);selected[maxLines-1]=selected[maxLines-1].replace(/\s*$/,'')+' ...';return selected;}
    return chunks.length?chunks:['-'];
   });
   const height=Math.max(10,Math.max(...lines.map(l=>l.length))*lineHeight+padY*2);
   if(y+height>BOTTOM){page();header();}
   fill(pdf,ri%2===0?COLORS.pale:COLORS.white);pdf.rect(M,y,WIDTH,height,'F');
   stroke(pdf,COLORS.border);pdf.setLineWidth(.2);pdf.line(M,y+height,W-M,y+height);
   let x=M;
   lines.forEach((group,i)=>{
    pdf.setFont('helvetica',ri===0&&i===0?'bold':'normal');pdf.setFontSize(8);color(pdf,COLORS.dark);
    group.forEach((line,j)=>pdf.text(line,x+padX,y+padY+3+j*lineHeight));
    x+=widths[i];
   });
   y+=height;
  });
  y+=7;
 };
 const counts={CRÍTICO:0,ALTO:0,MEDIO:0,BAJO:0};
 for(const r of a.risks||[])if(r.severity in counts) counts[r.severity as keyof typeof counts]++;
 const date=new Date(a.createdAt||Date.now());
 const dateLabel=Number.isNaN(date.getTime())?'Sin fecha':date.toLocaleDateString('es-PE');
 // Portada breve, primera página con metadatos verificables.
 fill(pdf,COLORS.navy);pdf.rect(0,0,W,57,'F');
 fill(pdf,COLORS.teal);pdf.rect(0,54,W,3,'F');
 pdf.setFont('helvetica','bold');pdf.setFontSize(12);color(pdf,COLORS.white);pdf.text('CLOUDOPS  /  AUDITORÍA INTELIGENTE',M,22);
 pdf.setFont('helvetica','bold');pdf.setFontSize(23);pdf.text('Informe técnico de proyecto',M,37);
 pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text('Evaluación estática para planificación de despliegue en AWS',M,47);
 y=70;
 pdf.setFont('helvetica','bold');pdf.setFontSize(16);color(pdf,COLORS.navy);
 const projectLine=(pdf.splitTextToSize(safe(a.general.project||filename),WIDTH) as string[]).slice(0,3);
 for(const line of projectLine){ensure(8);pdf.text(line,M,y);y+=7.7;}
 y+=2;
 kv('Archivo evaluado',filename);
 kv('Fecha del análisis',dateLabel);
 kv('Modelo utilizado',a.model);
 kv('Método','Análisis estático del contenido del ZIP. No se ejecutó el código.');
 y+=5;
 const boxY=y;fill(pdf,COLORS.pale);stroke(pdf,COLORS.border);pdf.roundedRect(M,boxY,WIDTH,29,3,3,'FD');
 const stats=[['CRÍTICOS',counts.CRÍTICO],['ALTOS',counts.ALTO],['MEDIOS',counts.MEDIO],['BAJOS',counts.BAJO]] as const;
 stats.forEach(([label,n],i)=>{const x=M+9+i*44;
   pdf.setFont('helvetica','bold');pdf.setFontSize(17);color(pdf,i===0?[160,38,52]:COLORS.navy);pdf.text(String(n),x,boxY+13);
   pdf.setFontSize(8);pdf.setFont('helvetica','normal');color(pdf,COLORS.muted);pdf.text(label,x,boxY+22);
 });
 y=boxY+38;
 subsection('Alcance y límites');
 write(`${a.coverage.examined.length} archivos examinados de ${a.coverage.eligible} elegibles; ${a.coverage.blocks} bloques analizados y ${a.coverage.excluded.length} exclusiones documentadas. Los resultados requieren validación humana.`,{fontSize:9.5});
 title('01  Resumen ejecutivo');
 write(a.general.summary||'La IA no proporcionó un resumen ejecutivo verificable.');
 title('02  Perfil técnico del proyecto');
 kv('Lenguajes',uniqueList(a.general.detected.languages));
 kv('Frameworks',uniqueList(a.general.detected.frameworks));
 kv('Dependencias principales',uniqueList(a.general.detected.dependencies));
 kv('Bases de datos',uniqueList(a.general.detected.database));
 kv('Infraestructura identificada',uniqueList(a.general.detected.infrastructure));
 title('03  Matriz de riesgos y hallazgos');
 if(!a.risks.length)write('No se identificaron hallazgos confirmados en los archivos examinados. Esto no equivale a ausencia de vulnerabilidades.');
 const ORDER=['CRÍTICO','ALTO','MEDIO','BAJO'];
 const sortedRisks=[...a.risks].sort((x,z)=>ORDER.indexOf(x.severity)-ORDER.indexOf(z.severity));
 if(sortedRisks.length){
  subsection('Matriz de riesgos priorizados');
  drawTable(['Nivel','Hallazgo','Archivo / línea','Confianza'],[23,62,65,24],sortedRisks.map(r=>[
   r.severity,r.title,`${r.file||'No identificado'}${r.line?`:${r.line}`:''}`,`${r.confidence||'No indicada'}${r.verified?' *':''}`
  ]),3);
  write('* Evidencia literal cotejada con los fragmentos examinados. Los resultados no equivalen a escaneo dinámico.',{fontSize:8.3,ink:COLORS.muted,gap:5});
  subsection('Detalle de los hallazgos');
 }
 for(const [i,r] of sortedRisks.entries()){
   ensure(25);
   const badge=r.severity==='CRÍTICO'?[168,40,55]:r.severity==='ALTO'?[181,81,36]:r.severity==='MEDIO'?[156,116,32]:[31,111,93];
   fill(pdf,badge as [number,number,number]);pdf.roundedRect(M,y-3,22,7.5,1.5,1.5,'F');
   pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);color(pdf,COLORS.white);pdf.text(safe(r.severity),M+2,y+2);
   y+=9;
   write(`${i+1}. ${r.title}`,{fontSize:11,bold:true,ink:COLORS.navy,gap:3});
   kv('Archivo / ubicación',`${r.file||'No determinado'}${r.line?` (línea ${r.line})`:''}`);
   kv('Clasificación',r.category);
   kv('Evidencia',r.evidence||'No verificada');
   kv('Impacto potencial',r.impact);
   kv('Medida recomendada',r.recommendation);
   write(`Confianza: ${r.confidence || 'No indicada'} | Evidencia ${r.verified?'cotejada':'no cotejada'} con el fragmento proporcionado.`,{fontSize:8.2,ink:COLORS.muted,gap:6});
   ensure(4);stroke(pdf,COLORS.border);pdf.line(M,y-2,W-M,y-2);
 }
 title('04  Seguridad del proyecto');
 write(a.security||'No se dispone de una evaluación adicional de seguridad.');
 title('05  Arquitectura y servicios AWS');
 write(a.architecture||'No fue posible determinar una arquitectura recomendada con la evidencia disponible.');
 if(a.aws.length){
  subsection('Servicios recomendados y justificación');
  drawTable(['Servicio','Uso propuesto','Justificación técnica'],[40,67,67],a.aws.map(s=>[s.service,s.purpose,s.reason]),4);
 }else write('No se propusieron servicios AWS adicionales sin evidencia suficiente.');
 title('06  Seis pilares AWS Well-Architected');
 drawTable(['Pilar','Estado','Evaluación de la evidencia'],[48,30,96],a.pillars.map(p=>[p.name,p.status,p.assessment]),4);
 title('07  Rendimiento y escalabilidad');
 write(a.performance||'Se requieren mediciones para evaluar el rendimiento real.');
 write('No se ejecutaron pruebas de carga ni mediciones de consumo de CPU, memoria o latencia.',{fontSize:8.8,ink:COLORS.muted});
 title('08  Costos e impacto económico');
 write(a.costs||'No se dispone de datos suficientes para una estimación económica.');
 write('Este informe no constituye una cotización AWS. Las tarifas deben verificarse en AWS Pricing Calculator según región y parámetros de uso.',{fontSize:8.8,ink:COLORS.muted});
 title('09  Plan de mejora priorizado');
 if(!a.improvements.length&&!sortedRisks.length)write('No se generaron acciones de mejora.');
 if(sortedRisks.length){
  subsection('Plan de remediación vinculado a hallazgos');
  drawTable(['Prioridad','Riesgo / problema','Acción correctiva recomendada'],[27,61,86],sortedRisks.map(r=>[r.severity,r.title,r.recommendation||'Revisión técnica pendiente']),4);
 }
 if(a.improvements.length){
  subsection('Mejoras adicionales sugeridas');
  drawTable(['#','Recomendación / siguiente paso'],[12,162],a.improvements.map((text,i)=>[String(i+1),text]),4);
 }
 title('10  Alcance y trazabilidad de archivos');
 write(`ZIP con ${a.coverage.totalEntries} entradas; ${a.coverage.eligible} archivos elegibles; ${a.coverage.examined.length} archivos examinados; ${a.coverage.blocks} bloques.`,{fontSize:9.5});
 subsection('Archivos examinados');
 if(a.coverage.examined.length)drawTable(['Archivo','Cobertura'],[147,27],a.coverage.examined.map(f=>[f.path,f.partial?'Parcial':'Examinado']),2);
 else write('No se registraron archivos examinados.');
 subsection('Archivos no examinados');
 if(!a.coverage.excluded.length)write('No se registraron exclusiones.');
 a.coverage.excluded.forEach(f=>write(`${f.path}: ${f.reason}`,{fontSize:8.2,gap:2}));
 title('11  Limitaciones y notas de auditoría');
 write(a.caveat||'Los hallazgos son asistidos por IA y requieren verificación profesional antes de cambios en producción.');
 write('El análisis es estático, se basa en fragmentos de archivos seleccionados y no debe interpretarse como una prueba de penetración, certificación de seguridad ni despliegue real en AWS.',{fontSize:9.1});
 // Anexo: conservar el texto original de Gemini para fidelidad del reporte sin llamadas adicionales.
 if(report.trim()){
  title('Anexo  /  Informe original de Gemini');
  for(const paragraph of report.replace(/\r/g,'').split(/\n\s*\n/)){
    if(!paragraph.trim())continue;
    const raw=paragraph.trim();
    write(raw,{fontSize:8.9,gap:4});
  }
 }
 const total=pagenum();
 for(let i=1;i<=total;i++){
   pdf.setPage(i);stroke(pdf,COLORS.border);pdf.line(M,282,W-M,282);
   pdf.setFont('helvetica','normal');pdf.setFontSize(8);color(pdf,COLORS.muted);
   pdf.text('CloudOps | Informe de análisis estático asistido por Gemini',M,287);
   pdf.text(`${i} / ${total}`,W-M,287,{align:'right'});
 }
 pdf.setProperties({title:`Auditoría CloudOps - ${safe(a.general.project)}`,subject:'Evaluación de riesgos, arquitectura y recomendaciones AWS',author:'CloudOps',keywords:'AWS, seguridad, análisis estático, auditoría de proyectos'});
 return pdf;
}
