import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, History, Server, Database, Globe, CheckCircle2, Gauge, HardDrive, Network, ShieldAlert, Wifi, Zap } from 'lucide-react';
import { Page, Title, Card, usd } from '../components/PageUI';
import { useSimulation, type Simulation } from '../context/SimulationContext';
import { useOperations } from '../operations/OperationsContext';
import { defaultLab, differences, evaluateFailure, failureGuidance, failureNames, isFailureAvailable, type Failure } from '../operations/model';
function printable(v: unknown) {
  if (v === undefined) return '—';
  if (Array.isArray(v)) return v.map(x => typeof x === 'object' && x !== null ? `${x.service}: ${usd(x.monthly)} · ${x.quantity} × ${x.rate} ${x.unit} · ${x.detail}` : String(x)).join('\n');
  return String(v);
}
export default function Operations() {
  const { simulation, simulations, setActiveSimulation } = useSimulation();
  const { pathname } = useLocation();
  const section = pathname.endsWith('/history') ? 'history' : 'failures';
  return <Page><div className="ops"><Title t={section === 'history' ? 'Historial de cambios' : 'Simulador de fallos'} s="Diagnostica caídas comunes, identifica su impacto y revisa acciones recomendadas de recuperación." tag="CLOUDOPS · OPERACIONES" />
    <nav className="ops-tabs" aria-label="Operaciones"><Link to="/dashboard/failures"><Activity size={17}/>Simulador</Link><Link to="/dashboard/history"><History size={17}/>Historial</Link></nav>
    {section !== 'history' && <Card><label className="ops-field">Escenario activo<select value={simulation?.id || ''} onChange={e=>setActiveSimulation(e.target.value)}><option value="" disabled>Selecciona un escenario</option>{simulations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></Card>}
    {section === 'history' ? <HistoryPanel/> : !simulation ? <Card><h2>Primero crea una planificación</h2><p>Las operaciones se aplican a un escenario guardado.</p><Link to="/dashboard/planning">Ir a Planificación →</Link></Card> : <FailurePanel simulation={simulation}/>} 
  </div></Page>;
}
function FailurePanel({simulation:s}: {simulation:Simulation}) {
  const { labs, setLab } = useOperations();
  const config = labs[s.id] || defaultLab;
  const state = evaluateFailure(s.selectedServices, config);
  const patch = (changes: Partial<typeof config>) => setLab(s.id, {...config,...changes});
  const iconFor: Record<string, typeof Server> = { 'Route 53': Globe, CloudFront: Network, EC2: Server, RDS: Database, S3: HardDrive };
  const serviceStatus: Record<string, boolean> = { 'Route 53': state.dnsAvailable, CloudFront: state.cdnAvailable, EC2: state.serverA || state.serverB, RDS: state.primary || state.standby, S3: state.storageAvailable };
  const serviceOrder = ['Route 53','CloudFront','EC2','RDS','S3'].filter(x=>s.selectedServices.includes(x));
  const failureOptions: {id: Exclude<Failure,'none'>; icon: typeof Server; description: string}[] = [
    {id:'server',icon:Server,description:'Instancia EC2 inaccesible'}, {id:'zone',icon:Globe,description:'Recursos de la zona A fuera de línea'},
    {id:'cpu',icon:Gauge,description:'Respuestas lentas por saturación'}, {id:'database',icon:Database,description:'RDS no responde a consultas'},
    {id:'connections',icon:Zap,description:'Se agotó el máximo de conexiones'}, {id:'storage',icon:HardDrive,description:'Lectura de objetos S3 denegada'},
    {id:'cdn',icon:Network,description:'CloudFront no entrega contenido'}, {id:'dns',icon:Wifi,description:'El dominio no resuelve a la aplicación'},
  ];
  const activeGuidance = config.failure === 'none' ? null : failureGuidance[config.failure];
  const solutionByFailure = activeGuidance?.solutions ?? [];
  const node = (name:string, exists:boolean, running:boolean, db=false) => <div className={`ops-node ${!exists ? 'absent' : running ? 'healthy' : 'failed'}`}>{db ? <Database size={22}/> : <Server size={22}/>}<strong>{name}</strong><span>{!exists ? 'No configurado' : running ? 'Disponible' : 'Fuera de servicio'}</span></div>;
  return <>
    <Card><div className="ops-heading"><div><h2>Laboratorio de resiliencia</h2><p>Selecciona un incidente para ver sus síntomas, el alcance y las medidas de recuperación.</p></div><span className="ops-pill">SIMULACIÓN EDUCATIVA</span></div>
      <div className="failure-grid">{failureOptions.filter(f=>isFailureAvailable(f.id,s.selectedServices)).map(({id,icon:Icon,description})=><button type="button" key={id} className={`failure-option ${config.failure===id ? 'selected' : ''}`} aria-pressed={config.failure===id} onClick={()=>patch({failure:id})}><Icon size={19}/><span><strong>{failureNames[id]}</strong><small>{description}</small></span><span className="failure-severity">{failureGuidance[id].severity==='critical'?'Crítico':'Advertencia'}</span></button>)}</div>
      <div className="ops-controls"><button type="button" className="reset-failure" onClick={()=>patch({failure:'none'})} disabled={config.failure==='none'}>Restablecer escenario</button></div>
      {s.selectedServices.some(x=>['EC2','RDS'].includes(x)) && <div className="ops-options"><label><input type="checkbox" checked={config.secondServer} disabled={!s.selectedServices.includes('EC2')} onChange={e=>patch({secondServer:e.target.checked})}/> Servidor de reserva en zona B</label><label><input type="checkbox" checked={config.standbyDatabase} disabled={!s.selectedServices.includes('RDS')} onChange={e=>patch({standbyDatabase:e.target.checked})}/> Réplica RDS en zona B</label></div>}
      <p className="ops-note">Escenario didáctico: no se conecta a AWS ni cambia los recursos o costos configurados. La topología se simplifica para explicar la propagación de incidentes.</p>
    </Card>
    <Card><div className={`ops-result ${state.appAvailable ? state.degraded ? 'warning' : 'healthy' : 'failed'}`}><Activity size={23}/><div><strong>{state.status}</strong><p>{config.failure==='none'?'No se simulan incidentes':failureNames[config.failure]} · {s.region}</p></div></div>
      <h3>Mapa de dependencias e impacto</h3><p>El recorrido muestra los servicios incluidos en este escenario.</p>
      <div className="dependency-flow"><span className="dependency-user"><Globe size={18}/> Usuarios</span>{serviceOrder.map((service,index)=>{const Icon=iconFor[service]||Server;const healthy=serviceStatus[service];const failed=service===state.failedResource?.split(' / ')[0];return <div className="dependency-step" key={service}>{index>0 && <span className="dependency-arrow" aria-hidden="true">→</span>}<div className={`dependency-node ${failed?'failed':healthy?'healthy':'degraded'}`}><Icon size={19}/><strong>{service}</strong><small>{!healthy ? failed ? 'Con falla' : 'No disponible' : config.failure==='cpu'&&service==='EC2' ? 'Degradado' : 'Disponible'}</small></div></div>})}</div>
      {activeGuidance && <div className={`incident-panel ${activeGuidance.severity}`}><div className="incident-title"><ShieldAlert size={19}/><strong>Diagnóstico del incidente</strong><span>{activeGuidance.severity==='critical'?'CRÍTICO':'ADVERTENCIA'}</span></div><dl><div><dt>Posible causa</dt><dd>{activeGuidance.symptom}</dd></div><div><dt>Impacto en el servicio</dt><dd>{activeGuidance.impact}</dd></div></dl><h3>Acciones recomendadas</h3><ol>{solutionByFailure.map((solution,i)=><li key={i}>{solution}</li>)}</ol></div>}
      {!activeGuidance && <div className="incident-panel healthy"><div className="incident-title"><CheckCircle2 size={19}/><strong>Todo operativo</strong></div><p>Activa un escenario para observar el diagnóstico y comparar medidas de recuperación.</p></div>}
      {config.failure==='zone' && <div className="ops-zones"><section className="zone-down"><h3>Zona A · Interrumpida</h3>{node('Servidor A',state.ec2,state.serverA)}{node('Base de datos primaria',state.rds,state.primary,true)}</section><section><h3>Zona B · Recuperación</h3>{node('Servidor de reserva',state.ec2 && config.secondServer,state.serverB)}{node('Réplica RDS',state.rds && config.standbyDatabase,state.standby,true)}</section></div>}
    </Card>
  </>;
}
function HistoryPanel() {
  const {history} = useOperations();
  const [scenarioId,setScenarioId] = useState('');
  const [left,setLeft] = useState('');const [right,setRight] = useState('');
  const ids = Array.from(new Set(history.map(r=>r.scenarioId)));
  const id = scenarioId || ids[0] || '';
  const entries = history.filter(r=>r.scenarioId===id);
  const versions = entries.filter(r=>r.snapshot);
  const a = versions.find(r=>r.id===left) || versions[1];
  const b = versions.find(r=>r.id===right) || versions[0];
  const changes = a && b ? differences(a.snapshot,b.snapshot) : [];
  const label = (r: typeof history[number]) => `${new Date(r.at).toLocaleString('es-PE')} · ${r.action} · ${r.actor}`;
  return <><Card><h2>Versiones guardadas</h2><p>Registro local de esta instalación (máximo 500 entradas). La autoría usa la sesión de demostración; no es una auditoría de seguridad ni se sincroniza entre equipos.</p><label className="ops-field">Escenario, incluidos los eliminados<select value={id} onChange={e=>{setScenarioId(e.target.value);setLeft('');setRight('');}}>{!ids.length && <option value="">Sin historial todavía</option>}{ids.map(i=><option value={i} key={i}>{history.find(r=>r.scenarioId===i)?.name} · {i.slice(-6)}</option>)}</select></label>
    <div className="ops-timeline">{entries.map(r=><article key={r.id}><History size={18}/><div><strong>{r.action} · {r.name}</strong><p>{r.actor}</p><time dateTime={r.at}>{new Date(r.at).toLocaleString('es-PE')}</time></div></article>)}{!entries.length && <p>Al crear o modificar una planificación, su versión aparecerá aquí.</p>}</div></Card>
    <Card><h2>Comparar versiones del mismo escenario</h2>{versions.length<2 ? <p>Se necesitan dos versiones. Modifica y guarda la planificación para registrar la siguiente.</p> : <><div className="ops-compare"><label className="ops-field">Versión A<select value={a?.id || ''} onChange={e=>setLeft(e.target.value)}>{versions.map(r=><option key={r.id} value={r.id}>{label(r)}</option>)}</select></label><label className="ops-field">Versión B<select value={b?.id || ''} onChange={e=>setRight(e.target.value)}>{versions.map(r=><option key={r.id} value={r.id}>{label(r)}</option>)}</select></label></div>{changes.length ? <div className="ops-table-wrap"><table><thead><tr><th>Campo</th><th>Versión A</th><th>Versión B</th></tr></thead><tbody>{changes.map(c=><tr key={c.key}><th>{c.label}</th><td>{printable(c.before)}</td><td>{printable(c.after)}</td></tr>)}</tbody></table></div> : <p>No hay diferencias entre las versiones seleccionadas.</p>}</>}</Card>
  </>;
}
