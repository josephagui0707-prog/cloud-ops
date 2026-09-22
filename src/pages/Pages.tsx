import { useMemo, useState } from 'react';
import { AnimatePresence, motion, TargetAndTransition, Variants } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, Boxes, CheckCircle2,
  ChevronRight, CircleDollarSign, Cloud, Cpu, Database, Gauge, Globe2,
  HardDrive, Info, Layers3, Lock, MapPinned, Network as Net, Route, Search,
  Server, Shield, ShieldCheck, Sparkles, TrendingUp, Users, Zap
} from 'lucide-react';

const services = [
  ['EC2', 'Compute', 'Servidores virtuales escalables', Cpu],
  ['S3', 'Storage', 'Almacenamiento de objetos', HardDrive],
  ['RDS', 'Database', 'Base de datos relacional administrada', Database],
  ['IAM', 'Security', 'Gestión de identidades y accesos', Shield],
  ['VPC', 'Networking', 'Red virtual privada', Net],
  ['Route 53', 'Networking', 'DNS escalable y disponible', Route],
  ['CloudFront', 'Networking', 'Red de distribución de contenido', Globe2],
] as const;

const usd = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);

/* ---------- Variantes de animación reutilizables ---------- */
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
};

const cardHover: TargetAndTransition = { y: -4, transition: { duration: 0.2, ease: 'easeOut' } };
const tapScale: TargetAndTransition = { scale: 0.97 };

/* Wrapper de página: da fade+slide de entrada a cualquier vista */
const Page = ({ children }: { children: any }) => (
  <motion.div variants={pageVariants} initial="hidden" animate="show">
    {children}
  </motion.div>
);

const Title = ({ t, s, tag = 'AWS CLOUD' }: { t: string; s: string; tag?: string }) => (
  <motion.div className="page-heading" variants={staggerItem}>
    <div>
      <span className="page-kicker">{tag}</span>
      <h1>{t}</h1>
      <p>{s}</p>
    </div>
    <div className="page-heading-badge"><span /> Entorno simulado</div>
  </motion.div>
);

const Card = ({ children, className = '', hoverable = false, variants }: { children: any; className?: string; hoverable?: boolean; variants?: any }) => (
  <motion.div
    className={`card ${className}`}
    variants={variants ?? staggerItem}
    whileHover={hoverable ? cardHover : undefined}
  >
    {children}
  </motion.div>
);

export function Dashboard() {
  const trend = [
    {m:'Abr',cost:58},{m:'May',cost:63},{m:'Jun',cost:61},{m:'Jul',cost:69},{m:'Ago',cost:71},{m:'Sep',cost:73}
  ];
  const split = [{name:'EC2',value:34},{name:'RDS',value:29},{name:'S3',value:12},{name:'CloudFront',value:17},{name:'Otros',value:8}];
  const colors = ['#2563EB','#16A34A','#F59E0B','#7C3AED','#64748B'];
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Dashboard ejecutivo" s="Vista consolidada de arquitectura, costos, seguridad y operación Cloud" />
      <motion.div className="stats-grid" variants={staggerContainer}>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon blue"><Layers3 size={20}/></span><span className="trend positive"><ArrowUpRight size={14}/> 7 activos</span></div><span className="stat-label">Servicios AWS</span><strong>7</strong><small>Componentes incluidos en la propuesta</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon blue"><MapPinned size={20}/></span><span className="mini-badge">us-east-2</span></div><span className="stat-label">Región principal</span><strong>Ohio</strong><small>Base de referencia para el cálculo</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon amber"><CircleDollarSign size={20}/></span><span className="trend positive"><TrendingUp size={14}/> FinOps</span></div><span className="stat-label">Costo base estimado</span><strong>$72.97</strong><small>Escenario de laboratorio / mes</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={20}/></span><span className="security-status">5 controles</span></div><span className="stat-label">Postura de seguridad</span><strong className="security-value">Estable</strong><small className="success-text">● 4 correctos · 1 revisión</small></Card>
      </motion.div>

      <motion.div className="content-grid dashboard-grid" variants={staggerContainer}>
        <Card className="chart-card chart-glow">
          <div className="card-header"><div><span className="section-kicker">FINOPS TREND</span><h3>Evolución del gasto simulado</h3><p>Proyección mensual en dólares estadounidenses</p></div><span className="mini-badge">Últimos 6 meses</span></div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={trend} margin={{top:12,right:10,left:-18,bottom:0}}>
              <defs><linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.34}/><stop offset="100%" stopColor="#2563EB" stopOpacity={0.02}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0"/>
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fill:'#64748B',fontSize:12}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill:'#94A3B8',fontSize:12}}/>
              <Tooltip formatter={(v:any)=>usd(Number(v))} contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,boxShadow:'0 18px 40px rgba(15,23,42,.14)',color:'var(--text)'}}/>
              <Area type="monotone" dataKey="cost" stroke="#2563EB" strokeWidth={3} fill="url(#costGradient)" animationDuration={1300} activeDot={{r:6}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="chart-card">
          <div className="card-header"><div><span className="section-kicker">COST BREAKDOWN</span><h3>Distribución por servicio</h3><p>Participación del costo mensual</p></div><span className="health-score">100%</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart><Pie data={split} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={4} animationDuration={1200}>{split.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Pie><Tooltip formatter={(v:any)=>`${v}%`} contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}}/></PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>$72.97</strong><span>mensual</span></div>
          </div>
          <div className="legend-grid">{split.map((x,i)=><span key={x.name}><i style={{background:colors[i]}}/>{x.name}<b>{x.value}%</b></span>)}</div>
        </Card>
      </motion.div>

      <motion.div className="overview-strip executive" variants={staggerItem}>
        <div><span className="overview-icon"><Cloud size={20}/></span><div><b>Arquitectura</b><small>Route 53 → CloudFront → VPC → EC2/RDS</small></div></div><ChevronRight size={20}/>
        <div><span className="overview-icon"><ShieldCheck size={20}/></span><div><b>Seguridad</b><small>IAM · MFA · cifrado · mínimo privilegio</small></div></div><ChevronRight size={20}/>
        <div><span className="overview-icon"><Gauge size={20}/></span><div><b>Operación</b><small>Alta disponibilidad y monitoreo</small></div></div>
      </motion.div>
    </motion.div>
  </Page>;
}

export function Planning() {
  const [name,setName] = useState('Plataforma Empresarial Cloud');
  const [type,setType] = useState('Aplicación web empresarial');
  const [region,setRegion] = useState('US East (Ohio)');
  const [users,setUsers] = useState(500);
  const [availability,setAvailability] = useState('Alta disponibilidad');
  const [objective,setObjective] = useState('Escalabilidad y reducción de costos');
  const [selected,setSelected] = useState<string[]>(services.map(s=>s[0]));
  const [saved,setSaved] = useState(false);
  const toggle=(s:string)=>setSelected(v=>v.includes(s)?v.filter(x=>x!==s):[...v,s]);
  const profile = users > 1500 ? 'Carga media/alta' : users > 500 ? 'Carga media' : 'Carga inicial';
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Planificación Cloud" s="Diseña una propuesta técnica y obtén un blueprint de arquitectura antes de implementar" tag="CLOUD PLANNING" />
      <motion.div className="planner-stepper" variants={staggerItem}><span className="active"><b>1</b>Requisitos</span><i/><span className="active"><b>2</b>Servicios</span><i/><span className="active"><b>3</b>Arquitectura</span><i/><span><b>4</b>Revisión</span></motion.div>
      <div className="planner-layout">
        <Card className="form-card planner-form">
          <div className="card-header"><div><span className="section-kicker">WORKLOAD PROFILE</span><h3>Definición de la solución</h3><p>Completa los parámetros principales para construir la propuesta.</p></div><span className="mini-badge">Profesional</span></div>
          <form onSubmit={e=>{e.preventDefault();setSaved(true)}} className="form-grid">
            <label><span>Nombre de la solución</span><input value={name} onChange={e=>setName(e.target.value)}/></label>
            <label><span>Tipo de aplicación</span><select value={type} onChange={e=>setType(e.target.value)}><option>Aplicación web empresarial</option><option>E-commerce</option><option>API / Backend</option><option>Portal de clientes</option></select></label>
            <label><span>Región principal</span><select value={region} onChange={e=>setRegion(e.target.value)}><option>US East (Ohio)</option><option>Europe (Ireland)</option><option>South America (São Paulo)</option></select></label>
            <label><span>Usuarios estimados</span><input type="number" min="1" value={users} onChange={e=>setUsers(Number(e.target.value))}/></label>
            <label><span>Disponibilidad requerida</span><select value={availability} onChange={e=>setAvailability(e.target.value)}><option>Alta disponibilidad</option><option>Estándar</option><option>Crítica 24/7</option></select></label>
            <label><span>Objetivo principal</span><select value={objective} onChange={e=>setObjective(e.target.value)}><option>Escalabilidad y reducción de costos</option><option>Modernización</option><option>Continuidad del negocio</option><option>Rendimiento global</option></select></label>
            <label className="wide"><span>Descripción del proyecto</span><textarea defaultValue="Aplicación empresarial que requiere una arquitectura escalable, segura y con estimación de costos antes del despliegue."/></label>
            <div className="wide service-selector">
              <div className="field-title">Servicios seleccionados</div>
              <motion.div className="service-choice-grid" variants={staggerContainer} initial="hidden" animate="show">
                {services.map(([s,c,,Icon])=>
                  <motion.button
                    type="button"
                    variants={staggerItem}
                    whileHover={{ y: -2 }}
                    whileTap={tapScale}
                    className={selected.includes(s)?'service-choice selected':'service-choice'}
                    onClick={()=>toggle(s)}
                    key={s}
                  >
                    <Icon size={18}/><span><b>{s}</b><small>{c}</small></span>{selected.includes(s)&&<CheckCircle2 size={16}/>}
                  </motion.button>
                )}
              </motion.div>
            </div>
            <div className="wide form-actions">
              <motion.button className="primary-button" whileHover={{ y: -2 }} whileTap={tapScale}><Sparkles size={17}/> Generar propuesta</motion.button>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    className="saved"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle2 size={17}/> Propuesta guardada localmente
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Card>

        <div className="planner-side">
          <Card className="blueprint-card"><div className="blueprint-head"><span><Zap size={18}/></span><div><small>LIVE BLUEPRINT</small><h3>{name || 'Nueva solución'}</h3></div></div><div className="blueprint-metrics"><div><span>Perfil</span><b>{profile}</b></div><div><span>Usuarios</span><b>{users.toLocaleString()}</b></div><div><span>Región</span><b>{region.replace('US East ','').replace('South America ','').replace('Europe ','')}</b></div><div><span>Servicios</span><b>{selected.length}</b></div></div><div className="blueprint-flow"><span>Internet</span><ArrowRight size={14}/><span>Edge</span><ArrowRight size={14}/><span>VPC</span><ArrowRight size={14}/><span>App + DB</span></div></Card>
          <Card className="recommendation-card"><div className="card-header"><div><span className="section-kicker">RECOMENDACIÓN</span><h3>Diseño sugerido</h3></div><Activity size={19}/></div><p>Para <b>{users.toLocaleString()} usuarios</b> y disponibilidad <b>{availability.toLowerCase()}</b>, la propuesta prioriza distribución de contenido, aislamiento de red y base de datos privada.</p><div className="recommendation-list"><span><CheckCircle2 size={15}/> CloudFront frente a la aplicación</span><span><CheckCircle2 size={15}/> VPC con subred pública y privada</span><span><CheckCircle2 size={15}/> RDS sin exposición directa a Internet</span><span><CheckCircle2 size={15}/> IAM con mínimo privilegio</span></div></Card>
        </div>
      </div>
    </motion.div>
  </Page>;
}

export function Costs() {
  const [ec2Count,setEc2Count]=useState(2); const [ec2Hours,setEc2Hours]=useState(730);
  const [rdsCount,setRdsCount]=useState(1); const [rdsHours,setRdsHours]=useState(730);
  const [s3Gb,setS3Gb]=useState(100); const [cdnGb,setCdnGb]=useState(250); const [zones,setZones]=useState(1); const [queries,setQueries]=useState(5);
  const rates = {ec2:.0104,rds:.017,s3:.023,cdn:.085,zone:.50,dns:.40};
  const items = useMemo(()=>[
    {name:'Amazon EC2',detail:'t3.micro Linux On-Demand',unit:'USD/h',rate:rates.ec2,usage:`${ec2Count} × ${ec2Hours} h`,cost:ec2Count*ec2Hours*rates.ec2,color:'#2563EB'},
    {name:'Amazon RDS',detail:'db.t3.micro MySQL Single-AZ',unit:'USD/h',rate:rates.rds,usage:`${rdsCount} × ${rdsHours} h`,cost:rdsCount*rdsHours*rates.rds,color:'#16A34A'},
    {name:'Amazon S3',detail:'S3 Standard · primeros 50 TB',unit:'USD/GB-mes',rate:rates.s3,usage:`${s3Gb} GB`,cost:s3Gb*rates.s3,color:'#F59E0B'},
    {name:'CloudFront',detail:'DTO Internet · primeros 10 TB (US)',unit:'USD/GB',rate:rates.cdn,usage:`${cdnGb} GB`,cost:cdnGb*rates.cdn,color:'#7C3AED'},
    {name:'Route 53',detail:'Zona alojada + consultas estándar',unit:'mixto',rate:rates.zone,usage:`${zones} zona(s) + ${queries} M queries`,cost:zones*rates.zone+queries*rates.dns,color:'#0891B2'}
  ],[ec2Count,ec2Hours,rdsCount,rdsHours,s3Gb,cdnGb,zones,queries]);
  const total=items.reduce((a,b)=>a+b.cost,0);
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Costos y economía Cloud" s="Estimador FinOps con tarifas públicas de referencia para una simulación más cercana a AWS" tag="FINOPS / AWS PRICING" />
      <motion.div className="pricing-note" variants={staggerItem}><Info size={18}/><div><b>Referencia de precios cargada: septiembre de 2026</b><span>Base: US East (Ohio) / On-Demand cuando aplica. El valor final de una factura AWS puede variar por región, impuestos, nivel gratuito, almacenamiento, solicitudes, transferencia y descuentos.</span></div></motion.div>
      <div className="cost-layout">
        <Card className="cost-builder"><div className="card-header"><div><span className="section-kicker">WORKLOAD INPUTS</span><h3>Configura el consumo</h3></div><span className="cost-accent">USD</span></div>
          <div className="cost-input-section"><div className="cost-input-title"><span className="service-icon"><Cpu size={18}/></span><div><b>EC2 t3.micro</b><small>$0.0104 por hora</small></div></div><div className="cost-input-grid"><label><span>Instancias</span><input type="number" min="0" value={ec2Count} onChange={e=>setEc2Count(+e.target.value)}/></label><label><span>Horas / mes</span><input type="number" min="0" value={ec2Hours} onChange={e=>setEc2Hours(+e.target.value)}/></label></div></div>
          <div className="cost-input-section"><div className="cost-input-title"><span className="service-icon green"><Database size={18}/></span><div><b>RDS db.t3.micro</b><small>$0.017 por hora · compute</small></div></div><div className="cost-input-grid"><label><span>Instancias</span><input type="number" min="0" value={rdsCount} onChange={e=>setRdsCount(+e.target.value)}/></label><label><span>Horas / mes</span><input type="number" min="0" value={rdsHours} onChange={e=>setRdsHours(+e.target.value)}/></label></div></div>
          <div className="cost-input-section compact"><div><label><span>S3 Standard (GB)</span><input type="number" min="0" value={s3Gb} onChange={e=>setS3Gb(+e.target.value)}/></label><label><span>CloudFront (GB salida)</span><input type="number" min="0" value={cdnGb} onChange={e=>setCdnGb(+e.target.value)}/></label></div><div><label><span>Route 53 zonas</span><input type="number" min="0" value={zones} onChange={e=>setZones(+e.target.value)}/></label><label><span>Consultas DNS (millones)</span><input type="number" min="0" value={queries} onChange={e=>setQueries(+e.target.value)}/></label></div></div>
        </Card>
        <div className="cost-summary-column">
          <Card className="estimate-hero">
            <span>Estimación mensual</span>
            <motion.strong key={total} initial={{ opacity: 0.4, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>{usd(total)}</motion.strong>
            <small>Proyección anual: {usd(total*12)}</small>
            <div className="estimate-progress"><motion.i animate={{ width: `${Math.min(100,total/2)}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}/></div>
            <p>Simulación sin compromisos, impuestos ni descuentos.</p>
          </Card>
          <Card className="chart-card"><div className="card-header"><div><span className="section-kicker">COST MIX</span><h3>Distribución del costo</h3></div></div><ResponsiveContainer width="100%" height={240}><BarChart data={items} layout="vertical" margin={{left:20,right:12}}><CartesianGrid horizontal={false} stroke="#E2E8F0"/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={88} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748B'}}/><Tooltip formatter={(v:any)=>usd(Number(v))} contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}}/><Bar dataKey="cost" radius={[0,7,7,0]} animationDuration={1200}>{items.map((x,i)=><Cell key={i} fill={x.color}/>)}</Bar></BarChart></ResponsiveContainer></Card>
        </div>
      </div>
      <Card className="pricing-table-card"><div className="card-header"><div><span className="section-kicker">BREAKDOWN</span><h3>Detalle del cálculo</h3></div><span className="mini-badge">Pay-as-you-go</span></div><div className="pricing-table"><div className="pricing-row head"><span>Servicio</span><span>Tarifa usada</span><span>Consumo</span><span>Subtotal</span></div>{items.map(x=><div className="pricing-row" key={x.name}><span><b>{x.name}</b><small>{x.detail}</small></span><span>{x.unit==='mixto'?'$0.50 zona + $0.40/M':`${usd(x.rate)} ${x.unit}`}</span><span>{x.usage}</span><strong>{usd(x.cost)}</strong></div>)}</div></Card>
    </motion.div>
  </Page>;
}

export function Infrastructure() {
  const regions = [
    ['US East (Ohio)','us-east-2','Columbus, Estados Unidos','Principal','EC2 · RDS · S3 · VPC'],
    ['Europe (Ireland)','eu-west-1','Dublín, Irlanda','Secundaria','EC2 · S3 · CloudFront'],
    ['South America (São Paulo)','sa-east-1','São Paulo, Brasil','Expansión','S3 · CloudFront']
  ];
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Infraestructura Global" s="Compara regiones, servicios desplegados y rol dentro de la solución" tag="AWS GLOBAL INFRASTRUCTURE"/>
      <motion.div className="region-grid" variants={staggerContainer}>
        {regions.map((r,i)=>
          <Card hoverable className="region-card premium" key={r[0]}>
            <div className="region-top"><span className="region-icon"><Globe2 size={21}/></span><span className={i===0?'status-badge success':'status-badge warning'}>{i===0?'Operativo':'Disponible'}</span></div>
            <span className="section-kicker">{r[1]}</span><h3>{r[0]}</h3><p>{r[2]}</p><div className="divider"/><small>ROL</small><b>{r[3]}</b><small>SERVICIOS</small><span className="service-list-text">{r[4]}</span>
          </Card>
        )}
      </motion.div>
    </motion.div>
  </Page>;
}

export function Security() {
  const rows = [
    ['Modelo de responsabilidad compartida','Responsabilidades de AWS y cliente diferenciadas',CheckCircle2,'Correcto'],
    ['IAM y mínimo privilegio','Usuarios, roles y permisos limitados por función',CheckCircle2,'Correcto'],
    ['MFA en cuentas privilegiadas','Segundo factor recomendado para administradores',AlertTriangle,'Revisión'],
    ['Protección de datos','Cifrado en tránsito y en reposo',CheckCircle2,'Correcto'],
    ['Auditoría y cumplimiento','Revisión de accesos y trazabilidad',CheckCircle2,'Correcto']
  ];
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Seguridad" s="Evalúa controles esenciales de identidad, datos y responsabilidad compartida" tag="SECURITY CENTER"/>
      <motion.div className="security-summary" variants={staggerItem}><div><ShieldCheck size={26}/><div><b>Security posture</b><span>4 controles correctos · 1 requiere revisión</span></div></div><span className="security-grade">A</span></motion.div>
      <motion.div className="security-list" variants={staggerContainer}>
        {rows.map(([a,b,I,s]:any)=>
          <Card hoverable className="security-card" key={a}>
            <span className={s==='Correcto'?'security-item-icon green':'security-item-icon amber'}><I size={20}/></span>
            <div><h3>{a}</h3><p>{b}</p></div>
            <span className={s==='Correcto'?'status-badge success':'status-badge warning'}>{s}</span>
          </Card>
        )}
      </motion.div>
      <motion.div className="content-grid" variants={staggerContainer}>
        <Card><div className="card-header"><div><span className="section-kicker">AWS</span><h3>Seguridad de la nube</h3></div><Shield size={20}/></div><p>Infraestructura física, hardware, red global y servicios administrados subyacentes.</p></Card>
        <Card><div className="card-header"><div><span className="section-kicker">CLIENTE</span><h3>Seguridad en la nube</h3></div><Lock size={20}/></div><p>Datos, identidades, permisos, configuraciones, aplicaciones y controles de acceso.</p></Card>
      </motion.div>
    </motion.div>
  </Page>;
}

export function NetworkPage() {
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Arquitectura de Red" s="Diagrama lógico de una solución web segura y segmentada sobre AWS" tag="NETWORK TOPOLOGY"/>
      <Card className="network-card pro-network">
        <div className="network-toolbar"><div><span className="section-kicker">REFERENCE ARCHITECTURE</span><h3>Flujo de tráfico y segmentación</h3><p>Internet → Route 53 → CloudFront → VPC → EC2 / RDS</p></div><span className="status-badge success">Diseño disponible</span></div>
        <div className="arch-canvas">
          <div className="edge-flow">
            <motion.div className="arch-node internet" whileHover={{ y: -3 }}><span><Globe2 size={23}/></span><b>Internet</b><small>Usuarios</small></motion.div><div className="animated-link"><i/></div>
            <motion.div className="arch-node" whileHover={{ y: -3 }}><span><Route size={23}/></span><b>Route 53</b><small>DNS</small></motion.div><div className="animated-link"><i/></div>
            <motion.div className="arch-node" whileHover={{ y: -3 }}><span><Cloud size={23}/></span><b>CloudFront</b><small>CDN / Edge</small></motion.div><div className="animated-link"><i/></div>
          </div>
          <div className="vpc-boundary">
            <div className="vpc-header"><div><span><Net size={18}/></span><div><b>Amazon VPC</b><small>10.0.0.0/16 · US East (Ohio)</small></div></div><span className="mini-badge">Aislamiento lógico</span></div>
            <div className="az-grid">
              <div className="az-box"><div className="az-title">Availability Zone A <small>us-east-2a</small></div><div className="subnet public"><span className="subnet-label">Public Subnet · 10.0.1.0/24</span><motion.div className="resource-node" whileHover={{ scale: 1.02 }}><span><Server size={19}/></span><div><b>EC2 Web/App A</b><small>Security Group: web-sg</small></div></motion.div></div><div className="subnet private"><span className="subnet-label">Private DB Subnet · 10.0.11.0/24</span><motion.div className="resource-node database" whileHover={{ scale: 1.02 }}><span><Database size={19}/></span><div><b>RDS Primary</b><small>Sin IP pública</small></div></motion.div></div></div>
              <div className="az-box"><div className="az-title">Availability Zone B <small>us-east-2b</small></div><div className="subnet public"><span className="subnet-label">Public Subnet · 10.0.2.0/24</span><motion.div className="resource-node" whileHover={{ scale: 1.02 }}><span><Server size={19}/></span><div><b>EC2 Web/App B</b><small>Alta disponibilidad</small></div></motion.div></div><div className="subnet private"><span className="subnet-label">Private DB Subnet · 10.0.12.0/24</span><motion.div className="resource-node database standby" whileHover={{ scale: 1.02 }}><span><Database size={19}/></span><div><b>RDS Standby</b><small>Replica Multi-AZ</small></div></motion.div></div></div>
            </div>
            <div className="vpc-flow-line"><span>CloudFront entrega tráfico a la capa de aplicación</span><ArrowRight size={16}/><span>EC2 accede a RDS solo desde la red privada</span></div>
          </div>
        </div>
        <div className="network-insights"><div><ShieldCheck size={18}/><span><b>Segmentación</b><small>Base de datos aislada del acceso público.</small></span></div><div><Activity size={18}/><span><b>Alta disponibilidad</b><small>Recursos distribuidos entre dos zonas.</small></span></div><div><Zap size={18}/><span><b>Entrega global</b><small>CloudFront reduce latencia antes de llegar a la VPC.</small></span></div></div>
      </Card>
    </motion.div>
  </Page>;
}

export function Services() {
  const [search,setSearch]=useState('');
  const filtered=services.filter(x=>x.slice(0,3).join(' ').toLowerCase().includes(search.toLowerCase()));
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Servicios AWS" s="Catálogo técnico de los servicios considerados en la arquitectura" tag="SERVICE CATALOG"/>
      <motion.div className="service-toolbar" variants={staggerItem}><div className="search-box"><Search size={18}/><input placeholder="Buscar servicio, categoría o función..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="mini-badge">{filtered.length} servicios</span></motion.div>
      <motion.div className="service-grid" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map(([name,cat,desc,Icon])=>
            <motion.div
              key={name}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22 }}
              whileHover={cardHover}
              className="card service-card premium"
            >
              <div className="service-card-top"><span className="service-icon"><Icon size={20}/></span><span className="status-badge success">En propuesta</span></div>
              <span className="category-badge">{cat}</span><h3>Amazon {name}</h3><p>{desc}</p><div className="divider"/>
              <div className="service-function"><Info size={15}/><span><b>Función principal</b><small>{desc}</small></span></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  </Page>;
}
