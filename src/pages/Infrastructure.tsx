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

export default Infrastructure;
