import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createSectionPdf, SECTION_TITLES, type SectionId } from '../lib/sectionPdf';
import { createExecutivePdf } from '../lib/executivePdf';
import { aiRequest } from '../lib/supabasePasswordAuth';
import JSZip from 'jszip';
import {
 BrainCircuit, FileArchive, ShieldAlert, FileText, Download, LoaderCircle,
 UploadCloud, AlertTriangle, Send, MessageSquare, FileCode2, CheckCircle2,
 FolderTree, ChevronDown, ChevronUp, X, Sparkles, FileCheck2, BarChart3, Eye, ExternalLink
} from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };
type Preview = { names: string[]; total: number; warning?: string };

const SCENARIOS: Record<string, string> = {
 auto: 'Detección automática por extensión',
 devicefarm: 'APK / AAB: AWS Device Farm (plan de pruebas)',
 s3: 'APK o binario: Amazon S3 (almacenamiento)',
 source: 'Código fuente: Amplify / Elastic Beanstalk'
};

function sizeLabel(bytes: number): string {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function toBase64(file: File): Promise<string> {
 return new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
  reader.readAsDataURL(file);
 });
}
function inline(text: string): ReactNode[] {
 return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g).filter(Boolean).map((piece, i) => {
  if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={i}>{piece.slice(2, -2)}</strong>;
  if (piece.startsWith('`') && piece.endsWith('`')) return <code key={i}>{piece.slice(1, -1)}</code>;
  if (piece.startsWith('*') && piece.endsWith('*')) return <em key={i}>{piece.slice(1, -1)}</em>;
  return piece;
 });
}
// Render safe Markdown as React elements (never insert HTML returned by a model).
function Markdown({ text }: { text: string }) {
 const lines = text.replace(/\r\n/g, '\n').split('\n');
 const blocks: ReactNode[] = [];
 let index = 0;
 const listPattern = /^\s*(?:[-*•]|\d+[.)])\s+/;
 const blockStart = (line: string) => /^\s*(?:#{1,6}\s|```|---+$|>\s)/.test(line) || listPattern.test(line);
 while (index < lines.length) {
  const current = lines[index].trim();
  if (!current) { index++; continue; }
  if (current.startsWith('```')) {
   const lang = current.slice(3).trim(); index++;
   const code: string[] = [];
   while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++]);
   if (index < lines.length) index++;
   blocks.push(<pre key={blocks.length}><code data-language={lang}>{code.join('\n')}</code></pre>);
   continue;
  }
  const header = current.match(/^(#{1,6})\s+(.+)$/);
  if (header) {
   const level = header[1].length;
   blocks.push(level <= 2 ? <h2 key={blocks.length}>{inline(header[2])}</h2> : <h3 key={blocks.length}>{inline(header[2])}</h3>);
   index++; continue;
  }
  if (/^---+$/.test(current)) { blocks.push(<hr key={blocks.length} />); index++; continue; }
  if (current.startsWith('|') && index + 1 < lines.length && /^\s*\|?\s*:?[-]{3,}/.test(lines[index + 1])) {
   const cells = (x: string) => x.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
   const headings = cells(current); index += 2;
   const rows: string[][] = [];
   while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(cells(lines[index++]));
   blocks.push(<div className="ai-table-scroll" key={blocks.length}><table><thead><tr>{headings.map((h, i) => <th key={i}>{inline(h)}</th>)}</tr></thead><tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
   continue;
  }
  if (listPattern.test(current)) {
   const numbered = /^\d+[.)]/.test(current);
   const entries: string[] = [];
   while (index < lines.length && listPattern.test(lines[index])) entries.push(lines[index++].trim().replace(listPattern, ''));
   const children = entries.map((entry, i) => <li key={i}>{inline(entry)}</li>);
   blocks.push(numbered ? <ol key={blocks.length}>{children}</ol> : <ul key={blocks.length}>{children}</ul>);
   continue;
  }
  if (current.startsWith('> ')) {
   const parts: string[] = [];
   while (index < lines.length && lines[index].trim().startsWith('> ')) parts.push(lines[index++].trim().slice(2));
   blocks.push(<blockquote key={blocks.length}>{inline(parts.join(' '))}</blockquote>); continue;
  }
  const paragraph: string[] = [current]; index++;
  while (index < lines.length && lines[index].trim() && !blockStart(lines[index].trim()) && !(lines[index].trim().startsWith('|') && index + 1 < lines.length && /^\s*\|?\s*:?[-]{3,}/.test(lines[index + 1]))) {
   paragraph.push(lines[index++].trim());
  }
  blocks.push(<p key={blocks.length}>{inline(paragraph.join(' '))}</p>);
 }
 return <div className="ai-markdown">{blocks}</div>;
}

const SECTIONS = [
 ['upload','Subir proyecto ZIP'],['general','Análisis general'],['risks','Riesgos y vulnerabilidades'],
 ['security','Seguridad del proyecto'],['aws','Arquitectura y servicios AWS'],['performance','Rendimiento y escalabilidad'],
 ['costs','Costos e impacto económico'],['recommendations','Recomendaciones de mejora'],['history','Historial de análisis'],['reports','Reportes']
] as const;
type Tab = typeof SECTIONS[number][0];
type Risk = {title:string;severity:'CRÍTICO'|'ALTO'|'MEDIO'|'BAJO';file:string;line:number|null;evidence:string;impact:string;recommendation:string;confidence:string;category:string;verified:boolean};
type Analysis = {
 general:{project:string;sha256:string;summary:string;detected:{languages:string[];frameworks:string[];dependencies:string[];infrastructure:string[];database:string[]}};
 risks:Risk[];security:string;architecture:string;performance:string;costs:string;improvements:string[];
 aws:{service:string;purpose:string;reason:string}[];
 pillars:{name:string;assessment:string;status:string}[];
 coverage:{totalEntries:number;eligible:number;examined:{path:string;partial:boolean}[];excluded:{path:string;reason:string}[];blocks:number};
 model:string;createdAt:string;caveat:string;
};
type PdfPreview = {url:string;filename:string;pages:number;project:string;section:string};
type Past = {id:string;filename:string;scenario:string;model:string;created_at:string};
function saveBlob(text:string, filename:string, mime='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
const safeFilename=(x:string)=>x.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_');
function riskClass(s:string){return s==='CRÍTICO'?'critical':s==='ALTO'?'high':s==='MEDIO'?'medium':'low';}
export default function AIProjectAnalysis(){
 const [query,setQuery]=useSearchParams();
 const tab=SECTIONS.some(x=>x[0]===query.get('tab'))?(query.get('tab') as Tab):'upload';
 const setTab=(value:Tab)=>setQuery({tab:value});
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [expanded,setExpanded]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [scenario,setScenario]=useState('auto');
 const [analysis,setAnalysis]=useState<Analysis|null>(null),[report,setReport]=useState(''),[analysisId,setAnalysisId]=useState('');
 const [activeFilename,setActiveFilename]=useState('');
 const [past,setPast]=useState<Past[]>([]),[historyBusy,setHistoryBusy]=useState(false);
 const [question,setQuestion]=useState(''),[chatBusy,setChatBusy]=useState(false),[chatHistory,setChatHistory]=useState<Message[]>([]);
 const [chatMode,setChatMode]=useState<'general'|'project'>('general');
 const [income,setIncome]=useState(0),[hours,setHours]=useState(1),[recovery,setRecovery]=useState(0);
 const [ec2Hours,setEc2Hours]=useState(730),[ec2Rate,setEc2Rate]=useState(0),[storageGB,setStorageGB]=useState(0),[storageRate,setStorageRate]=useState(0),[otherMonthly,setOtherMonthly]=useState(0);
 const [modelOk,setModelOk]=useState('');
 const requestTicket=useRef(0);
 // La vista previa y la descarga usan exactamente los mismos bytes del PDF.
 const [pdfPreview,setPdfPreview]=useState<PdfPreview|null>(null);
 const pdfUrlRef=useRef<string|null>(null);
 const closePdfPreview=()=>{if(pdfUrlRef.current){URL.revokeObjectURL(pdfUrlRef.current);pdfUrlRef.current=null;}setPdfPreview(null);};
 useEffect(()=>()=>{if(pdfUrlRef.current)URL.revokeObjectURL(pdfUrlRef.current);},[]);
 useEffect(()=>{
  if(!pdfPreview)return;
  const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape')closePdfPreview();};
  window.addEventListener('keydown',dismiss);
  return ()=>window.removeEventListener('keydown',dismiss);
 },[pdfPreview]);
 const reset=()=>{closePdfPreview();setAnalysis(null);setReport('');setAnalysisId('');setActiveFilename('');setChatMode('general');setChatHistory([]);setError('');};
 const loadPast=async()=>{setHistoryBusy(true);try{const r=await aiRequest('/api/ai/history');const data=await r.json();if(!r.ok)throw Error(data.error||'Error de historial.');setPast(data.items||[]);}catch(e){setError((e as Error).message);}finally{setHistoryBusy(false);}};
 useEffect(()=>{const token=sessionStorage.getItem('cloudops.auth.password.v1');if(token){void loadPast();const saved=sessionStorage.getItem('cloudops.ai.lastReportId');if(saved && /^[0-9a-f-]{36}$/i.test(saved)){void aiRequest(`/api/ai/report/${saved}`).then(r=>r.ok?r.json():null).then(data=>{if(!data?.item)return;setAnalysis(data.item.result);setReport(data.item.report);setAnalysisId(data.item.id||saved);setActiveFilename(data.item.filename||data.item.result?.general?.project||'Informe anterior');}).catch(()=>{});}void aiRequest('/api/ai/models').then(r=>r.json()).then(d=>setModelOk(d.ok?`Modelo verificado: ${d.model}`:d.error||'')).catch(()=>{});}},[]);
 const selectFile=async(next:File|null)=>{
  const ticket=++requestTicket.current;setFile(next);setPreview(null);setExpanded(false);reset();
  if(!next)return;
  if(next.size>8*1024*1024){setError('ZIP superior a 8 MB.');return;}
  if(!/\.zip$/i.test(next.name)){setError('Este módulo empresarial recibe proyectos completos .zip.');return;}
  try{const zip=await JSZip.loadAsync(next);const names=Object.values(zip.files).filter(x=>!x.dir).map(x=>x.name);if(ticket===requestTicket.current)setPreview({total:names.length,names:names.slice(0,90),warning:names.length>900?'El ZIP excede las 900 entradas permitidas.':undefined});}
  catch{if(ticket===requestTicket.current)setPreview({total:0,names:[],warning:'No se pudo abrir el índice del ZIP.'});}
 };
 const run=async()=>{
  if(!file||busy||file.size>8*1024*1024)return;
  setBusy(true);setError('');reset();
  try{
   const response=await aiRequest('/api/ai/analyze',{method:'POST',body:JSON.stringify({filename:file.name,base64:await toBase64(file),type:scenario})});
   const result=await response.json().catch(()=>{throw Error('El servidor no devolvió JSON. Revisa la terminal de CloudOps.');});
   if(!response.ok)throw Error(result.error||'Gemini no pudo procesar el ZIP.');
   setAnalysis(result.analysis);setReport(result.report);setAnalysisId(result.id);setActiveFilename(file.name);setChatMode('project');setChatHistory([]);sessionStorage.setItem('cloudops.ai.lastReportId',result.id);setTab('general');void loadPast();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const openPast=async(id:string)=>{setBusy(true);setError('');try{const r=await aiRequest(`/api/ai/report/${id}`);const data=await r.json();if(!r.ok)throw Error(data.error||'No se puede leer.');setAnalysis(data.item.result);setReport(data.item.report);setAnalysisId(id);setActiveFilename(data.item.filename || data.item.result?.general?.project || 'Proyecto analizado');setChatMode('project');setChatHistory([]);sessionStorage.setItem('cloudops.ai.lastReportId',id);setTab('general');}catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 const removePast=async(id:string)=>{if(!confirm('¿Eliminar este informe de tu historial privado?'))return;try{const r=await aiRequest(`/api/ai/report/${id}`,{method:'DELETE'});if(!r.ok)throw Error((await r.json()).error);setPast(prev=>prev.filter(x=>x.id!==id));if(analysisId===id){sessionStorage.removeItem('cloudops.ai.lastReportId');reset();}}catch(e){setError((e as Error).message)}};
 const chat=async()=>{
  if(!question.trim()||chatBusy)return;const q=question.trim();setChatBusy(true);setError('');setQuestion('');
  try{const response=await aiRequest('/api/ai/chat',{method:'POST',body:JSON.stringify({question:q,mode:chatMode,analysisId:chatMode==='project'?(analysisId||undefined):undefined,history:chatHistory.slice(-12)})});const data=await response.json();if(!response.ok)throw Error(data.error||'El chat no respondió.');setChatHistory(h=>[...h,{role:'user',content:q},{role:'assistant',content:data.answer}]);}catch(e){setError((e as Error).message);setQuestion(q)}finally{setChatBusy(false)}
 };
 const openPdfPreview=(selected:SectionId|'executive'='reports')=>{
  try{
   // Usa el mismo informe privado del análisis y los datos de la sección.
   // La generación y vista previa no generan nuevas llamadas a Gemini.
   const filename=activeFilename || file?.name || analysis?.general.project || 'Proyecto_CloudOps';
   const costs={computeHours:ec2Hours,computeRate:ec2Rate,storageGB,storageRate,otherMonthly,incomePerHour:income,downtimeHours:hours,recoveryCost:recovery};
   const document=selected==='executive'
    ? createExecutivePdf(analysis!,{filename,costs})
    : createSectionPdf(selected,{
     analysis,report,filename,
     zip:file?{size:file.size,names:preview?.names||[],total:preview?.total||0,scenario}:undefined,
     history:past,costs
    });
   const blob=document.output('blob');
   const url=URL.createObjectURL(blob);
   if(pdfUrlRef.current)URL.revokeObjectURL(pdfUrlRef.current);
   pdfUrlRef.current=url;
   const title=selected==='executive'?'Informe ejecutivo para dirección':selected==='reports'?'Informe técnico para analistas':SECTION_TITLES[selected];
   const prefix=selected==='executive'?'Ejecutivo':selected==='reports'?'Tecnico_Analistas':selected;
   setPdfPreview({url,filename:`CloudOps_${prefix}_${safeFilename(filename)}.pdf`,pages:document.getNumberOfPages(),project:filename,section:title});
  }catch(e){setError(`No se pudo generar el PDF de esta sección: ${(e as Error).message}`);}
 };
 const openPdfTab=()=>{if(pdfPreview)window.open(pdfPreview.url,'_blank','noopener,noreferrer');};
 const section=(id:Tab)=>{
  if(id==='upload')return <section className="ai-panel ai-upload-panel"><h2><UploadCloud size={21}/> Subir proyecto ZIP</h2>
   <label className="ai-dropzone"><span className="ai-dropzone-symbol"><UploadCloud size={31}/></span><strong>{file ? `Cambiar archivo: ${file.name}` : 'Selecciona o arrastra tu proyecto ZIP'}</strong><small>Formato ZIP · máximo 8 MB · evaluación estática sin ejecutar el proyecto</small><span className="ai-dropzone-cta">{file?'Seleccionar otro ZIP':'Explorar archivos'}</span><input type="file" accept=".zip,application/zip" onChange={e=>{void selectFile(e.target.files?.[0]||null);e.target.value=''}}/></label>
   {file&&<div className="ai-project-card"><div className="ai-project-main"><span className="ai-project-icon"><FileArchive size={24}/></span><div className="ai-project-details"><strong>{file.name}</strong><div className="ai-file-meta"><span>{sizeLabel(file.size)}</span><span>ZIP · {preview?.total??'…'} entradas</span></div></div><span className="ai-ready"><CheckCircle2 size={15}/> Seleccionado</span><button className="ai-clear-button" onClick={()=>void selectFile(null)}><X size={16}/></button></div>
    {preview?.warning&&<p className="ai-preview-warning">{preview.warning}</p>}{preview?.names.length? <div className="ai-preview-tree"><div className="ai-preview-heading"><span><FolderTree size={16}/> Estructura del proyecto (vista previa)</span><span>{preview.total} entradas</span></div><ul>{preview.names.slice(0,expanded?90:10).map((n,i)=><li key={i}><FileCode2 size={14}/>{n}</li>)}</ul>{preview.total>10&&<button className="ai-preview-toggle" onClick={()=>setExpanded(!expanded)}>{expanded?'Mostrar menos':'Mostrar más archivos'}</button>}</div>:null}</div>}
   <div className="ai-control-group"><label>Escenario para la evaluación AWS</label><select value={scenario} onChange={e=>setScenario(e.target.value)}><option value="auto">Detección automática</option><option value="source">Código fuente / despliegue AWS</option><option value="s3">Almacenamiento / S3</option><option value="devicefarm">Android / Device Farm (solo si hay evidencia)</option></select></div>
   <div className="ai-form-footer"><p><ShieldAlert size={16}/> Archivos secretos excluidos; posibles claves redactadas. No se despliega ni se ejecuta código.</p><button className="ai-button-primary" onClick={()=>void run()} disabled={busy||!file||file.size>8*1024*1024}>{busy?<LoaderCircle className="ai-spinner" size={17}/>:<BrainCircuit size={17}/>} {busy?'Analizando y guardando…':'Analizar proyecto con IA'}</button></div>
  </section>;
  if(id==='history')return <section className="ai-panel"><div className="ai-report-top"><h2><FolderTree size={20}/> Historial privado de análisis</h2><button className="ai-button-export" onClick={()=>void loadPast()} disabled={historyBusy}>Actualizar</button></div><p className="ai-help">Se almacenan informes y metadatos en Supabase, asociados a tu usuario de CloudOps. No se guarda el ZIP original.</p>{!past.length&&<p>No hay informes guardados, o necesitas iniciar sesión con tu correo y contraseña.</p>}{past.map(p=><div className="ai-history-row" key={p.id}><div><strong>{p.filename}</strong><div className="ai-help">{new Date(p.created_at).toLocaleString()} · {p.model} · {p.scenario}</div></div><button className="ai-button-export" onClick={()=>void openPast(p.id)}>Abrir</button><button className="ai-clear-button" onClick={()=>void removePast(p.id)} title="Eliminar">×</button></div>)}</section>;
  if(!analysis){
   const hints: Record<Exclude<Tab,'upload'|'history'>, {summary:string;details:string[]}> = {
    general:{summary:'Perfil técnico del proyecto y preparación para AWS.',details:['Lenguajes, frameworks, dependencias y estructura detectada.','Evaluación de los seis pilares AWS Well-Architected.']},
    risks:{summary:'Hallazgos verificables, clasificados por gravedad.',details:['Archivo y línea cuando exista evidencia.','Impacto, confianza y solución recomendada.']},
    security:{summary:'Revisión de seguridad basada en archivos de código y configuración.',details:['Autenticación, autorización, IAM y validación de entradas.','Posibles credenciales expuestas, CORS y categorías OWASP.']},
    aws:{summary:'Propuesta de despliegue basada en las tecnologías observadas.',details:['Servicios AWS justificados según las necesidades del proyecto.','Componentes y riesgos de disponibilidad.']},
    performance:{summary:'Evaluación estática de rendimiento y escalabilidad.',details:['Posibles cuellos de botella y oportunidades de caché.','Problemas que requieren mediciones reales antes de confirmarse.']},
    costs:{summary:'Costos ilustrativos y estimación del impacto económico.',details:['Escenarios con tarifas que tú indiques de AWS Pricing Calculator.','Calculadora de pérdidas por interrupción.']},
    recommendations:{summary:'Plan de mejora basado en los hallazgos del proyecto.',details:['Acciones priorizadas según riesgo e impacto.','Medidas correctivas concretas para cada hallazgo.']},
    reports:{summary:'Informe de auditoría empresarial listo para presentar.',details:['Tablas de riesgos, servicios AWS y plan de remediación.','Vista previa y descarga del mismo documento PDF.']}
   };
   const current=hints[id as keyof typeof hints];
   return <section className="ai-panel ai-empty-section"><div className="ai-empty-icon"><BrainCircuit size={26}/></div><span className="ai-kicker">SECCIÓN {SECTIONS.findIndex(s=>s[0]===id)+1} · CLOUDOPS IA</span><h2>{SECTIONS.find(x=>x[0]===id)?.[1]}</h2><p>{current.summary}</p><ul>{current.details.map(t=><li key={t}>{t}</li>)}</ul><div className="ai-empty-actions"><button className="ai-button-primary" onClick={()=>setTab('upload')}>Subir y analizar un ZIP</button><button className="ai-button-export" onClick={()=>setTab('history')}>Abrir análisis del historial</button></div><small>Esta sección mostrará solo los resultados reales del análisis seleccionado; no contiene datos de ejemplo.</small></section>;
  }
  if(id==='general')return <section className="ai-panel"><div className="ai-report-top ai-section-lead"><div><h2><BarChart3 size={20}/> Análisis general</h2><p>Evaluación del proyecto basada en el ZIP real</p></div></div><p><b>Proyecto:</b> {analysis.general.project}</p><Markdown text={analysis.general.summary}/><div className="ai-facts"><span><b>Lenguajes</b>{analysis.general.detected.languages.join(', ')||'No identificado'}</span><span><b>Frameworks</b>{analysis.general.detected.frameworks.join(', ')||'No identificado'}</span><span><b>Base de datos</b>{analysis.general.detected.database.join(', ')||'No identificado'}</span><span><b>Modelo IA</b>{analysis.model}</span></div><h2>Seis pilares AWS Well-Architected</h2><div className="ai-pillars">{analysis.pillars.map(p=><div className="ai-pillar" key={p.name}><strong>{p.name}</strong><small>{p.status}</small><p>{p.assessment}</p></div>)}</div><h2>Cobertura verificable</h2><p>{analysis.coverage.examined.length} archivos seleccionados de {analysis.coverage.eligible} analizables, {analysis.coverage.blocks} bloques. {analysis.coverage.excluded.length} exclusiones o fragmentos parciales.</p><details><summary>Ver archivos examinados</summary><ul>{analysis.coverage.examined.map(f=><li key={f.path}><code>{f.path}</code>{f.partial?' (parcial)':''}</li>)}</ul></details><details><summary>Ver archivos omitidos y motivos</summary><ul>{analysis.coverage.excluded.map((f,i)=><li key={i}><code>{f.path}</code> — {f.reason}</li>)}</ul></details></section>;
  if(id==='risks')return <section className="ai-panel"><h2><ShieldAlert size={20}/> Riesgos y vulnerabilidades ({analysis.risks.length})</h2>{!analysis.risks.length&&<p>No se confirmaron riesgos en los archivos examinados; esto no equivale a ausencia de vulnerabilidades.</p>}{[...analysis.risks].sort((a,b)=>['CRÍTICO','ALTO','MEDIO','BAJO'].indexOf(a.severity)-['CRÍTICO','ALTO','MEDIO','BAJO'].indexOf(b.severity)).map((r,i)=><article className="ai-risk" key={i}><div className="ai-risk-head"><span className={`ai-risk-badge ${riskClass(r.severity)}`}>{r.severity}</span><b>{r.title}</b></div><p><b>Archivo:</b> <code>{r.file}</code>{r.line?` · línea ${r.line}`:''}</p><p><b>Evidencia:</b> {r.evidence}</p><p><b>Consecuencia:</b> {r.impact}</p><p><b>Solución:</b> {r.recommendation}</p><small>Confianza {r.confidence} · {r.verified?'Cita verificada contra el fragmento':'Cita literal no verificada'} · {r.category}</small></article>)}</section>;
  if(id==='security')return <section className="ai-panel"><h2><ShieldAlert size={20}/> Seguridad del proyecto</h2><Markdown text={analysis.security||'No se obtuvo una evaluación de seguridad verificable.'}/><h2>Hallazgos de seguridad</h2>{analysis.risks.filter(r=>r.category==='seguridad').map((r,i)=><p key={i}><b>{r.severity}:</b> {r.title} — <code>{r.file}</code></p>)}<p className="ai-help">OWASP: cada correspondencia requiere evidencia. No se realizaron pruebas de penetración.</p></section>;
  if(id==='aws')return <section className="ai-panel"><h2><FileCode2 size={20}/> Arquitectura y servicios AWS</h2><Markdown text={analysis.architecture||'Sin suficiente información sobre arquitectura.'}/>{analysis.aws.map((s,i)=><div className="ai-service" key={i}><h3>{s.service}</h3><p>{s.purpose}</p><small>Justificación: {s.reason}</small></div>)}<h2>Infraestructura encontrada</h2><p>{analysis.general.detected.infrastructure.join(', ')||'No se identificaron definiciones de infraestructura.'}</p></section>;
  if(id==='performance')return <section className="ai-panel"><h2>Rendimiento y escalabilidad</h2><Markdown text={analysis.performance||'No hay información suficiente para determinar cuellos de botella.'}/><p className="ai-help">No se han ejecutado pruebas de carga ni mediciones reales de CPU, memoria o latencia.</p></section>;
  if(id==='costs')return <section className="ai-panel"><h2><FileText size={20}/> Costos e impacto económico</h2><Markdown text={analysis.costs||'Faltan parámetros y precios oficiales para estimar el presupuesto AWS.'}/><p className="ai-help">Los precios actuales requieren AWS Pricing Calculator y región, tráfico, almacenamiento y horas de uso. No se presenta una cotización oficial sin esos datos. <a href="https://calculator.aws/" target="_blank" rel="noreferrer" style={{color:'#9ad7ff',textDecoration:'underline'}}>Consultar AWS Pricing Calculator</a>.</p>
   <h2>Escenario ilustrativo de infraestructura (USD)</h2>
   <p className="ai-help">Introduce horas de uso y tarifas obtenidas por ti de una cotización de AWS. Los valores iniciales 0 significan tarifa desconocida, NO servicio gratuito.</p>
   <div className="ai-finance-grid"><label>Horas cómputo / mes<input min="0" type="number" value={ec2Hours} onChange={e=>setEc2Hours(Math.max(0,+e.target.value||0))}/></label><label>Precio AWS del cómputo (USD/h)<input min="0" type="number" step="0.0001" value={ec2Rate} onChange={e=>setEc2Rate(Math.max(0,+e.target.value||0))}/></label><label>GB almacenados<input min="0" type="number" value={storageGB} onChange={e=>setStorageGB(Math.max(0,+e.target.value||0))}/></label><label>Tarifa almacenamiento (USD/GB-mes)<input min="0" type="number" step="0.0001" value={storageRate} onChange={e=>setStorageRate(Math.max(0,+e.target.value||0))}/></label><label>Otros servicios/transferencias (USD/mes)<input min="0" type="number" step="0.01" value={otherMonthly} onChange={e=>setOtherMonthly(Math.max(0,+e.target.value||0))}/></label></div>
   <div className="ai-economic-total"><b>Costo mensual ilustrativo (USD):</b> {(ec2Hours*ec2Rate+storageGB*storageRate+otherMonthly).toLocaleString('en-US',{style:'currency',currency:'USD'})}<b style={{marginTop:8}}>Costo anual ilustrativo (USD):</b> {((ec2Hours*ec2Rate+storageGB*storageRate+otherMonthly)*12).toLocaleString('en-US',{style:'currency',currency:'USD'})}<small>No incluye impuestos, región, solicitudes y egreso salvo que los introduzcas en otros servicios. Solo sirve como escenario basado en tarifas indicadas por el usuario.</small></div>
   <h2>Calculadora de pérdidas por interrupción</h2><div className="ai-finance-grid"><label>Ingresos por hora (moneda local)<input type="number" min="0" value={income} onChange={e=>setIncome(Math.max(0,+e.target.value||0))}/></label><label>Horas de inactividad<input type="number" min="0" value={hours} onChange={e=>setHours(Math.max(0,+e.target.value||0))}/></label><label>Costos de recuperación<input type="number" min="0" value={recovery} onChange={e=>setRecovery(Math.max(0,+e.target.value||0))}/></label></div><div className="ai-economic-total"><b>Pérdida potencial ilustrativa:</b> {(income*hours+recovery).toLocaleString('es-PE',{maximumFractionDigits:2})}<small>Fórmula: ingresos/hora × horas sin servicio + recuperación. No incluye efectos no cuantificados (reputación, multas, pérdida de clientes).</small></div></section>;
  if(id==='recommendations')return <section className="ai-panel"><h2>Recomendaciones de mejora</h2><ol className="ai-recommendations">{analysis.improvements.map((item,i)=><li key={i}>{item}</li>)}</ol><h2>Prioridades basadas en riesgos observados</h2>{analysis.risks.filter(r=>r.severity==='CRÍTICO'||r.severity==='ALTO').map((r,i)=><p key={i}><b>{r.title}:</b> {r.recommendation}</p>)}</section>;
  return <section className="ai-panel ai-report-panel"><div className="ai-report-top"><div><span className="ai-kicker">AUDITORÍA TÉCNICA · AWS WELL-ARCHITECTED</span><h2><FileText size={20}/> Generar informes de evaluación</h2><p>{analysis.general.project} · {analysis.model} · {new Date(analysis.createdAt).toLocaleDateString('es-PE')}</p></div><div className="ai-actions"><button className="ai-button-export ai-button-quiet" onClick={()=>saveBlob(report,`Informe_${safeFilename(analysis.general.project)}.txt`)}><FileText size={16}/> Descargar TXT</button></div></div>
  <div className="ai-report-audiences" aria-label="Tipos de informes PDF">
   <article className="ai-report-audience-card executive">
    <span className="ai-kicker">PARA EL GERENTE O DUEÑO</span>
    <h3>Informe ejecutivo</h3>
    <p>Resumen para tomar decisiones: estado del proyecto, problemas prioritarios, impacto en el negocio, presupuesto disponible y acciones recomendadas. Sin detalles de código innecesarios.</p>
    <button type="button" className="ai-button-export ai-button-pdf" onClick={()=>openPdfPreview('executive')}><Eye size={17}/> Vista previa · PDF ejecutivo</button>
   </article>
   <article className="ai-report-audience-card technical">
    <span className="ai-kicker">PARA EL EQUIPO DE ANALISTAS</span>
    <h3>Informe técnico completo</h3>
    <p>Auditoría detallada con matrices de riesgos, evidencias, archivos y líneas afectadas, seis pilares AWS, servicios propuestos y plan de remediación.</p>
    <button type="button" className="ai-button-export ai-button-pdf" onClick={()=>openPdfPreview('reports')}><Eye size={17}/> Vista previa · PDF técnico</button>
   </article>
  </div>
  <p className="ai-help">Los dos documentos utilizan el análisis privado ya guardado. No vuelven a consultar Gemini ni inventan precios AWS.</p>
  <div className="ai-report-stats"><div><span>RIESGOS CRÍTICOS</span><strong>{analysis.risks.filter(r=>r.severity==='CRÍTICO').length}</strong></div><div><span>RIESGOS ALTOS</span><strong>{analysis.risks.filter(r=>r.severity==='ALTO').length}</strong></div><div><span>ARCHIVOS EXAMINADOS</span><strong>{analysis.coverage.examined.length}</strong></div><div><span>PILARES AWS</span><strong>{analysis.pillars.length}/6</strong></div></div><div className="ai-document"><div className="ai-document-header"><div><span>CloudOps · Reporte técnico</span><h3>{analysis.general.project}</h3><p>Diagnóstico estático con evidencias y recomendaciones de mitigación</p></div><FileCheck2 size={35}/></div><Markdown text={report || analysis.general.summary}/><div className="ai-document-end">Fin del informe · Revisión técnica humana recomendada antes de producción</div></div></section>;
 };
 return <div className="ai-page"><header className="ai-page-header"><span className="ai-heading-icon"><BrainCircuit size={30}/></span><div><h1>Análisis inteligente de proyectos con IA</h1><p>Gemini · AWS Well-Architected (6 pilares) · seguridad · arquitectura · historial privado</p>{modelOk&&<small className="ai-model-label">{modelOk}</small>}</div></header>
 {(file || analysis) && <div className="ai-active-project" role="status"><span className="ai-active-project-icon"><FileArchive size={21}/></span><div className="ai-active-project-info"><span>{analysis?'INFORME ACTIVO':'ARCHIVO ZIP SELECCIONADO'}</span><strong title={analysis ? (activeFilename || analysis.general.project) : file?.name}>{analysis ? (activeFilename || analysis.general.project) : file?.name}</strong><small>{analysis ? `${analysis.coverage.examined.length} archivos examinados · ${analysis.risks.length} riesgos · ${analysis.model}` : `${file ? sizeLabel(file.size) : ''} · ${preview?.total ?? '...'} archivos en el ZIP`}</small></div><span className={`ai-active-status ${analysis?'done':''}`}><CheckCircle2 size={14}/>{analysis?'Analizado':'Seleccionado'}</span>{analysis && <button className="ai-active-report" onClick={()=>openPdfPreview('reports')}><Eye size={14}/> Vista previa PDF</button>}</div>}
 {error&&<div className="ai-error" role="alert"><AlertTriangle size={17}/>{error}</div>}
 {tab!=='reports' && <div className="ai-section-pdf-toolbar">
  <div><span>REPORTE INDEPENDIENTE</span><strong>{SECTIONS.find(([id])=>id===tab)?.[1]}</strong><small>Contenido exclusivo de este submódulo · sin volver a consultar Gemini</small></div>
  <button type="button" className="ai-button-export ai-button-pdf" disabled={tab==='upload'?(!file&&!analysis):tab==='history'?!past.length:!analysis} onClick={()=>openPdfPreview(tab)}><Eye size={17}/> Generar PDF · Vista previa</button>
 </div>}
 {section(tab)}
 <section className="ai-panel ai-chat-panel"><div className="ai-chat-header"><div><h2><MessageSquare size={20}/> Chat con Gemini</h2><p>Haz preguntas generales o conversa sobre la auditoría de tu proyecto.</p></div><span className="ai-chat-online"><span/> Gemini API</span></div>
 <div className="ai-chat-modes" role="group" aria-label="Modo de conversación">
  <button type="button" className={chatMode==='general'?'active':''} aria-pressed={chatMode==='general'} disabled={chatBusy} onClick={()=>{setChatMode('general');setChatHistory([]);setQuestion('');}}> <MessageSquare size={15}/> Chat general</button>
  <button type="button" className={chatMode==='project'?'active':''} aria-pressed={chatMode==='project'} disabled={chatBusy||!analysisId} onClick={()=>{setChatMode('project');setChatHistory([]);setQuestion('');}}><FileArchive size={15}/> Sobre mi proyecto</button>
 </div>
 {chatMode==='project'&&analysisId?<div className="ai-chat-context"><Sparkles size={16}/> Consultando informe privado: {analysis?.general.project}</div>:<div className="ai-chat-context ai-chat-general-note"><MessageSquare size={16}/> Puedes preguntar sobre programación, tecnología, estudios o cualquier otro tema. Este modo no comparte tu ZIP. Sin acceso a búsquedas web en tiempo real.</div>}
 <div className="ai-chat-log" aria-live="polite">{!chatHistory.length&&<div className="ai-chat-placeholder">{chatMode==='project'?'¿Cuáles son los riesgos críticos del proyecto y cómo los corrijo?':'¡Hola! Pregúntame lo que quieras, por ejemplo: ¿cómo funciona un API REST?'}</div>}{chatHistory.map((m,i)=><article className={`ai-chat-message ${m.role==='user'?'ai-chat-user':'ai-chat-assistant'}`} key={i}><strong>{m.role==='user'?'Tú':'Gemini'}</strong><Markdown text={m.content}/></article>)}</div><div className="ai-chat-composer"><input aria-label="Pregunta a Gemini" value={question} maxLength={2200} placeholder={chatMode==='project'?'Pregunta sobre los hallazgos del proyecto…':'Escribe cualquier pregunta…'} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void chat();}}/><button className="ai-button-primary" disabled={chatBusy||!question.trim()} onClick={()=>void chat()}>{chatBusy?<LoaderCircle className="ai-spinner" size={16}/>:<Send size={16}/>} Enviar</button></div></section>
 <p className="ai-disclaimer">Auditoría estática asistida por IA. No ejecuta el proyecto ni AWS. El análisis puede ser parcial; los hallazgos necesitan revisión humana. Fragmentos seleccionados y redactados se envían a Gemini. El ZIP original no se persiste.</p>
 {pdfPreview&&<div className="ai-pdf-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closePdfPreview()}}>
  <section className="ai-pdf-dialog" role="dialog" aria-modal="true" aria-label="Vista previa del informe PDF">
   <div className="ai-pdf-toolbar">
    <div className="ai-pdf-title"><span className="ai-pdf-symbol"><FileCheck2 size={25}/></span><div><span className="ai-pdf-overline">INFORME PROFESIONAL · VISTA PREVIA</span><h2>{pdfPreview.project}</h2><small>{pdfPreview.section} · {pdfPreview.filename} · {pdfPreview.pages} páginas</small></div></div>
    <div className="ai-pdf-actions"><button className="ai-pdf-open" onClick={openPdfTab} title="Abrir la vista previa en otra pestaña"><ExternalLink size={16}/> Abrir</button><a className="ai-pdf-download" href={pdfPreview.url} download={pdfPreview.filename}><Download size={17}/> Descargar PDF</a><button className="ai-pdf-close" onClick={closePdfPreview} aria-label="Cerrar vista previa" title="Cerrar"><X size={21}/></button></div>
   </div>
   <div className="ai-pdf-body"><iframe className="ai-pdf-frame" title="Documento PDF que se descargará" src={`${pdfPreview.url}#toolbar=0&view=FitH`}/></div>
   <div className="ai-pdf-bottom"><span><CheckCircle2 size={15}/> La vista previa y el archivo descargado son idénticos.</span><span>Si tu navegador no muestra el PDF, pulsa «Abrir».</span></div>
  </section>
 </div>}
 </div>;
}
