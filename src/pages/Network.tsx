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

export default NetworkPage;
