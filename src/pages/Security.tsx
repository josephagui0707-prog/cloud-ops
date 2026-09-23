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

import { Card, Page, Title, usd, services, staggerContainer, staggerItem, cardHover, tapScale, pageVariants } from '../components/PageUI';

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

export default Security;
