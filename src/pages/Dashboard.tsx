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
  Server, Shield, ShieldCheck, Sparkles, TrendingUp, Users, Zap, Trash2
} from 'lucide-react';

import { Card, Page, Title, usd, services, staggerContainer, staggerItem, cardHover, tapScale, pageVariants } from '../components/PageUI';
import { useSimulation } from '../context/SimulationContext';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { simulation, clearSimulation } = useSimulation();
  if (!simulation) return <Page>
    <motion.div className="dashboard-empty" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="empty-icon"><Cloud size={34}/></div>
      <span className="section-kicker">CLOUDOPS WORKSPACE</span>
      <h1>Tu dashboard está listo para una nueva planificación</h1>
      <p>Actualmente no existe una planificación activa. Configura los servicios, usuarios, región y disponibilidad desde Planificación Cloud para generar el tablero ejecutivo.</p>
      <Link className="primary-button" to="/dashboard/planning"><Sparkles size={17}/>Empezar</Link>
      <div className="empty-features"><span><Layers3 size={16}/> Servicios AWS</span><span><CircleDollarSign size={16}/> Costos estimados</span><span><ShieldCheck size={16}/> Seguridad</span><span><Net size={16}/> Arquitectura</span></div>
    </motion.div>
  </Page>;
  const monthly = simulation.monthlyCost;
  const trend = [
    {m:'Abr',cost:monthly * 0.88},{m:'May',cost:monthly * 0.93},{m:'Jun',cost:monthly * 0.91},
    {m:'Jul',cost:monthly * 0.96},{m:'Ago',cost:monthly * 0.98},{m:'Sep',cost:monthly}
  ];
  const costItems = simulation.costItems.filter(item => item.monthly > 0);
  const totalPositive = costItems.reduce((sum, item) => sum + item.monthly, 0) || 1;
  const split = costItems.map(item => ({name:item.service,value:Math.round((item.monthly / totalPositive) * 1000) / 10}));
  const colors = ['#2563EB','#16A34A','#F59E0B','#7C3AED','#0891B2','#DC2626','#64748B'];
  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <div className="dashboard-heading-row"><Title t="Dashboard ejecutivo" s={`Vista consolidada de ${simulation.name}`} /><motion.button className="danger-outline-button" onClick={clearSimulation} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Trash2 size={16}/> Eliminar simulación</motion.button></div>
      <motion.div className="stats-grid" variants={staggerContainer}>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon blue"><Layers3 size={20}/></span><span className="trend positive"><ArrowUpRight size={14}/> Activos</span></div><span className="stat-label">Servicios AWS</span><strong>{simulation.selectedServices.length}</strong><small>Componentes incluidos en la propuesta</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon blue"><MapPinned size={20}/></span><span className="mini-badge">{simulation.region.includes("Ohio") ? "us-east-2" : simulation.region}</span></div><span className="stat-label">Región principal</span><strong>{simulation.region.replace("US East ", "")}</strong><small>Base de referencia para el cálculo</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon amber"><CircleDollarSign size={20}/></span><span className="trend positive"><TrendingUp size={14}/> FinOps</span></div><span className="stat-label">Costo base estimado</span><strong>{usd(monthly)}</strong><small>Estimación del escenario / mes</small></Card>
        <Card hoverable className="stat-card premium"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={20}/></span><span className="security-status">5 controles</span></div><span className="stat-label">Postura de seguridad</span><strong className="security-value">Estable</strong><small className="success-text">● Simulación activa</small></Card>
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
          <div className="card-header"><div><span className="section-kicker">COST BREAKDOWN</span><h3>Distribución por servicio</h3><p>Participación del costo mensual</p></div><span className="health-score">Simulado</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart><Pie data={split} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={4} animationDuration={1200}>{split.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Pie><Tooltip formatter={(v:any)=>`${v}%`} contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}}/></PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{usd(monthly)}</strong><span>mensual</span></div>
          </div>
          <div className="legend-grid">{split.map((x,i)=><span key={x.name}><i style={{background:colors[i]}}/>{x.name}<b>{x.value}%</b></span>)}</div>
        </Card>
      </motion.div>

      <motion.div className="simulation-meta-strip"><span><b>Simulación activa</b> {simulation.name}</span><span>{simulation.users.toLocaleString()} usuarios · {simulation.availability}</span><span>{simulation.selectedServices.length} servicios seleccionados</span></motion.div>

      <motion.div className="overview-strip executive" variants={staggerItem}>
        <div><span className="overview-icon"><Cloud size={20}/></span><div><b>Arquitectura</b><small>Route 53 → CloudFront → VPC → EC2/RDS</small></div></div><ChevronRight size={20}/>
        <div><span className="overview-icon"><ShieldCheck size={20}/></span><div><b>Seguridad</b><small>IAM · MFA · cifrado · mínimo privilegio</small></div></div><ChevronRight size={20}/>
        <div><span className="overview-icon"><Gauge size={20}/></span><div><b>Operación</b><small>Alta disponibilidad y monitoreo</small></div></div>
      </motion.div>
    </motion.div>
  </Page>;
}

export default Dashboard;
