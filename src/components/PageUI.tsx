import { awsServices } from '../data/awsServices';
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

export const usd = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);

/* ---------- Variantes de animación reutilizables ---------- */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
};

export const cardHover: TargetAndTransition = { y: -4, transition: { duration: 0.2, ease: 'easeOut' } };
export const tapScale: TargetAndTransition = { scale: 0.97 };

/* Wrapper de página: da fade+slide de entrada a cualquier vista */
export const Page = ({ children }: { children: any }) => (
  <motion.div variants={pageVariants} initial="hidden" animate="show">
    {children}
  </motion.div>
);

export const Title = ({ t, s, tag = 'AWS CLOUD' }: { t: string; s: string; tag?: string }) => (
  <motion.div className="page-heading" variants={staggerItem}>
    <div>
      <span className="page-kicker">{tag}</span>
      <h1>{t}</h1>
      <p>{s}</p>
    </div>
    <div className="page-heading-badge"><span /> Entorno simulado</div>
  </motion.div>
);

export const Card = ({ children, className = '', hoverable = false, variants }: { children: any; className?: string; hoverable?: boolean; variants?: any }) => (
  <motion.div
    className={`card ${className}`}
    variants={variants ?? staggerItem}
    whileHover={hoverable ? cardHover : undefined}
  >
    {children}
  </motion.div>
);


export const services = awsServices;
