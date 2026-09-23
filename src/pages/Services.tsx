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

export default Services;
