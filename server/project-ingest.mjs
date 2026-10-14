import JSZip from 'jszip';
import { extname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

const MAX_ZIP = 8 * 1024 * 1024;
const MAX_EXPANDED = 22 * 1024 * 1024;
const MAX_FILES = 900;
const MAX_ONE = 450 * 1024;
const SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|coverage|vendor|\.next|__pycache__|\.venv|target|\.idea|\.turbo|\.cache)(\/|$)/i;
const SKIP_SECRET = /(^|\/)(\.env($|\.)|\.npmrc$|\.pypirc$|\.aws\/|\.ssh\/|id_rsa|id_ed25519|[^/]*\.(pem|key|p12|pfx|keystore)$|credentials($|\.)|secrets?\.(json|ya?ml)$)/i;
const SOURCE = /\.(js|jsx|ts|tsx|mjs|cjs|py|java|go|html|css|json|ya?ml|xml|sql|tf|tfvars\.example|md|txt|toml|ini|properties|sh|gradle|kt|php|rb|cs|hcl|conf)$/i;
const SPECIAL = /(^|\/)(dockerfile|docker-compose[^/]*|compose\.ya?ml|requirements[^/]*\.txt|pipfile|poetry\.lock|package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|pom\.xml|build\.gradle|readme[^/]*|cloudformation[^/]*|serverless\.ya?ml|terraform\.lock\.hcl|\.gitignore)$/i;
const MASKS = [
  /\b(?:sk-[a-zA-Z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9_]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/g,
  /\b(Bearer\s+)[A-Za-z0-9._~+/-]{12,}/gi,
  /((?:password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret|authorization)\s*[=:]\s*["']?)[^\s,"'\n}]{5,}/gi,
  /((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:\s/]+:)[^@\s]+@/gi
];
export function redact(text) { let output=String(text).replace(/\0/g,''); for (const re of MASKS) output=output.replace(re, (_full, a)=> (a||'')+'[REDACTADO]'); return output; }
function validPath(name) {
 if (!name || name.length>280 || name.includes('\\') || name.startsWith('/') || /^[a-z]:/i.test(name) || name.includes('\0')) return false;
 const normalized=posix.normalize(name);
 return normalized===name && !name.split('/').some(x=>x==='..'||x==='.') && !name.startsWith('//');
}
function priority(name) {
 if (/package\.json$|requirements\.txt$|pom\.xml$|readme|dockerfile|compose\.ya?ml|\.tf$|cloudformation|serverless|\.github\/workflows/i.test(name)) return 100;
 if (/config|auth|security|routes?|server|app|controller|middleware|api|database|sql/i.test(name)) return 85;
 if (/\.(yml|yaml|json|sql|py|js|ts|tsx|jsx)$/i.test(name)) return 60;
 return 30;
}
function summarize(files) {
 const paths=files.map(f=>f.path), joined=paths.join('\n').toLowerCase();
 const languages=[]; for(const [ext,label] of Object.entries({'.tsx':'TypeScript/React','.ts':'TypeScript','.jsx':'JavaScript/React','.js':'JavaScript','.py':'Python','.java':'Java','.go':'Go','.sql':'SQL','.tf':'Terraform','.html':'HTML','.css':'CSS'})) if(paths.some(p=>p.toLowerCase().endsWith(ext)))languages.push(label);
 const dependencies=files.filter(f=>/package\.json$|requirements\.txt$|pom\.xml$|build\.gradle$|pyproject\.toml$/i.test(f.path)).map(f=>f.path);
 const frameworks=[];
 const manifests=files.filter(f=>dependencies.includes(f.path)).map(f=>f.content).join('\n').toLowerCase();
 for(const [needle,label] of [['react','React'],['vite','Vite'],['express','Express'],['next','Next.js'],['fastapi','FastAPI'],['django','Django'],['spring-boot','Spring Boot'],['flask','Flask'],['vue','Vue'],['angular','Angular'],['supabase','Supabase']]) if(manifests.includes(needle))frameworks.push(label);
 const infrastructure=paths.filter(p=>/\.tf$|cloudformation|serverless|dockerfile|compose\.ya?ml|\.aws|aws\.ya?ml/i.test(p));
 const database=[];for(const [needle,label] of [['postgres','PostgreSQL'],['mysql','MySQL'],['mongodb','MongoDB'],['sqlite','SQLite'],['dynamodb','DynamoDB']]) if(manifests.includes(needle)||joined.includes(needle))database.push(label);
 return {languages,frameworks,dependencies,infrastructure,database};
}
export async function inspectProject(filename, base64) {
 if(typeof filename!=='string'||typeof base64!=='string'||filename.length>180 || !/^[A-Za-z0-9+/=\r\n]+$/.test(base64))throw Error('Nombre o contenido inválido.');
 const buffer=Buffer.from(base64,'base64');
 if(!buffer.length || buffer.length>MAX_ZIP)throw Error('Archivo ZIP vacío o superior a 8 MB.');
 if(!/\.zip$/i.test(filename))throw Error('Para este módulo selecciona un proyecto ZIP. No se ejecutan binarios ni APK.');
 if(buffer[0]!==0x50||buffer[1]!==0x4b)throw Error('El archivo no parece un ZIP válido.');
 const archive=await JSZip.loadAsync(buffer,{checkCRC32:false,createFolders:false});
 const entries=Object.values(archive.files);
 if(entries.length>MAX_FILES)throw Error(`ZIP con demasiadas entradas (máximo ${MAX_FILES}).`);
 let expanded=0; const excluded=[];const files=[];
 for(const entry of entries){
  const path=entry.name;
  if(entry.unsafeOriginalName && entry.unsafeOriginalName!==path)throw Error('ZIP rechazado: ruta original no segura.');
  if(!validPath(path))throw Error('ZIP rechazado: contiene rutas inseguras.');
  if(entry.dir)continue;
  const unixMode=typeof entry.unixPermissions==='number'?entry.unixPermissions:0;
  if((unixMode & 0o170000)===0o120000) throw Error('ZIP rechazado: contiene enlaces simbólicos.');
  const len=Number(entry._data?.uncompressedSize??0);
  const compressed=Number(entry._data?.compressedSize??0);
  if(!Number.isFinite(len)||len<0||!Number.isFinite(compressed)||compressed<0)throw Error('ZIP contiene tamaños inválidos.');
  expanded+=len;
  if(expanded>MAX_EXPANDED)throw Error('ZIP rechazado: contenido descomprimido demasiado grande (22 MB).');
  if(len>MAX_ONE || (len>1024*1024 && compressed>0 && len/compressed>100)) {excluded.push({path,reason:'Archivo excesivamente grande'}); continue;}
  if(SKIP_DIR.test(path)) { excluded.push({path,reason:'Directorio generado o dependencias'});continue;}
  if(SKIP_SECRET.test(path)){excluded.push({path,reason:'Archivo sensible excluido'});continue;}
  if(!SOURCE.test(path) && !SPECIAL.test(path)) { excluded.push({path,reason:'Binario o formato no analizable'});continue;}
  const parts=[];let actual=0;for await(const chunk of Readable.wrap(entry.nodeStream())){actual+=chunk.length;if(actual>MAX_ONE)throw Error('ZIP rechazado: archivo inflado por encima del máximo.');parts.push(chunk);}
  const data=Buffer.concat(parts);
  if(data.length>MAX_ONE||data.subarray(0,4096).includes(0)){excluded.push({path,reason:'No es texto seguro'});continue;}
  const content=redact(data.toString('utf8'));
  files.push({path,content,bytes:data.length,priority:priority(path)});
 }
 if(!files.length)throw Error('No se encontraron archivos fuente analizables en el ZIP.');
 files.sort((a,b)=>b.priority-a.priority||a.path.localeCompare(b.path));
 const selected=[];let length=0;const LIMIT=125000;
 for(const f of files){const allowance=Math.min(18000,LIMIT-length);if(allowance<500){excluded.push({path:f.path,reason:'Superó el presupuesto de contexto'});continue;}
 const lines=f.content.split('\n');let output='';for(let i=0;i<lines.length;i++){const next=`${i+1}: ${lines[i]}\n`;if(output.length+next.length>allowance)break;output+=next;}
 if(!output){excluded.push({path:f.path,reason:'Sin espacio para analizar'});continue;}
 selected.push({path:f.path,content:output,partial:output.length<f.content.length,bytes:f.bytes});length+=output.length;
 if(output.length<f.content.length)excluded.push({path:f.path,reason:'Fragmento parcial por límite de contexto'});
 }
 const chunks=[];let current=[];let size=0;
 for(const f of selected){const text=`\n=== ${f.path} ===\n${f.content}\n`;
 if(size+text.length>32000 && current.length){chunks.push(current);current=[];size=0;}
 current.push(f);size+=text.length;
 }
 if(current.length)chunks.push(current);
 return {filename,sha256:createHash('sha256').update(buffer).digest('hex'),totalEntries:entries.length,selected,excluded,chunks,detected:summarize(files),totalEligible:files.length,filesExamined:[]};
}
