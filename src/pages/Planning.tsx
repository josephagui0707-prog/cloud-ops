import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleDollarSign, Cpu, Database, HardDrive, Info, Network, Route, Shield, Sparkles, Users, Globe2 } from 'lucide-react';
import { toast } from 'sonner'; // <-- 1. Importamos el toast moderno
import { Card, Page, Title, usd, services, staggerContainer, staggerItem, tapScale } from '../components/PageUI';
import { useSimulation, type SimulationCostItem } from '../context/SimulationContext';

const rates: Record<string, { rate: number; unit: number | string; detail: string }> = {
  EC2: { rate: 0.0104, unit: 'USD/h', detail: 't3.micro Linux On-Demand' },
  RDS: { rate: 0.017, unit: 'USD/h', detail: 'db.t3.micro MySQL Single-AZ' },
  S3: { rate: 0.023, unit: 'USD/GB-mes', detail: 'S3 Standard' },
  CloudFront: { rate: 0.085, unit: 'USD/GB', detail: 'Transferencia de datos a Internet' },
  'Route 53': { rate: 0.50, unit: 'USD/zona-mes', detail: 'Zona alojada' },
  IAM: { rate: 0, unit: 'USD/mes', detail: 'Gestión de identidades y accesos' },
  VPC: { rate: 0, unit: 'USD/mes', detail: 'Red virtual privada (sin gateways adicionales)' },
};

const icons: Record<string, any> = { EC2: Cpu, RDS: Database, S3: HardDrive, CloudFront: Globe2, 'Route 53': Route, IAM: Shield, VPC: Network };

export function Planning() {
  const [name, setName] = useState('Plataforma Empresarial Cloud');
  const [type, setType] = useState('Aplicación web empresarial');
  const [region, setRegion] = useState('US East (Ohio)');
  const [users, setUsers] = useState(500);
  const [availability, setAvailability] = useState('Alta disponibilidad');
  const [objective, setObjective] = useState('Escalabilidad y reducción de costos');
  const [description, setDescription] = useState('Aplicación empresarial que requiere una arquitectura escalable, segura y con estimación de costos antes del despliegue.');
  const [selected, setSelected] = useState<string[]>(['EC2', 'S3', 'RDS', 'IAM', 'VPC', 'Route 53', 'CloudFront']);
  const [quantities, setQuantities] = useState<Record<string, number>>({ EC2: 2, RDS: 1, S3: 100, CloudFront: 250, 'Route 53': 1, IAM: 1, VPC: 1 });
  const [saved, setSaved] = useState(false);
  const { saveSimulation } = useSimulation();

  const toggle = (service: string) => {
    setSelected(current => current.includes(service) ? current.filter(x => x !== service) : [...current, service]);
    setSaved(false);
  };

  const setQuantity = (service: string, value: number) => {
    setQuantities(current => ({ ...current, [service]: Math.max(0, value) }));
    setSaved(false);
  };

  const costItems = useMemo<SimulationCostItem[]>(() => selected.map(service => {
    const config = rates[service];
    const quantity = quantities[service] ?? 1;
    let monthly = 0;
    let usage = `${quantity}`;
    if (service === 'EC2' || service === 'RDS') { monthly = quantity * 730 * config.rate; usage = `${quantity} × 730 h`; }
    else if (service === 'S3') { monthly = quantity * config.rate; usage = `${quantity} GB`; }
    else if (service === 'CloudFront') { monthly = quantity * config.rate; usage = `${quantity} GB`; }
    else if (service === 'Route 53') { monthly = quantity * config.rate; usage = `${quantity} zona(s)`; }
    else { monthly = 0; usage = 'Sin costo directo'; }
    return { service, detail: config.detail, quantity, usage, rate: config.rate, unit: config.unit as string, monthly };
  }), [selected, quantities]);

  const monthlyCost = costItems.reduce((sum, item) => sum + item.monthly, 0);
  const profile = users > 1500 ? 'Carga media/alta' : users > 500 ? 'Carga media' : 'Carga inicial';

  const generateSimulation = () => {
    if (!selected.length) return;
    
    saveSimulation({ 
      name: name || 'Nueva solución Cloud', 
      type, 
      region, 
      users, 
      availability, 
      objective, 
      description, 
      selectedServices: selected, 
      costItems, 
      monthlyCost, 
      annualCost: monthlyCost * 12, 
      createdAt: new Date().toISOString() 
    });
    
    setSaved(true);

    // Toast personalizado con barra de carga animada
    toast.success(
      <div className="flex flex-col gap-1 w-full">
        <span className="font-semibold">¡Planificación generada con éxito!</span>
        <span className="text-xs opacity-90">Se ha guardado en localStorage.</span>
        
        {/* Barra de progreso con animación CSS de duración (4 segundos) */}
        <div className="w-full bg-black/10 dark:bg-white/20 h-1 rounded-full overflow-hidden mt-1">
          <div className="bg-emerald-500 h-full animate-toast-progress" />
        </div>
      </div>,
      {
        duration: 4000,
        className: 'custom-progress-toast',
      }
    );
  };

  return <Page>
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <Title t="Planificación y costos Cloud" s="Define la solución, selecciona los servicios y calcula automáticamente el escenario que llegará al Dashboard" tag="CLOUD PLANNING + FINOPS" />
      <motion.div className="planner-stepper" variants={staggerItem}><span className="active"><b>1</b>Requisitos</span><i/><span className="active"><b>2</b>Servicios</span><i/><span className="active"><b>3</b>Costos</span><i/><span><b>4</b>Simulación</span></motion.div>

      <div className="planner-layout planner-layout-combined">
        <Card className="form-card planner-form">
          <div className="card-header"><div><span className="section-kicker">WORKLOAD PROFILE</span><h3>Definición de la solución</h3><p>Los datos de esta pantalla alimentan directamente la simulación.</p></div><span className="mini-badge">Simulación local</span></div>
          <form onSubmit={e => { e.preventDefault(); generateSimulation(); }} className="form-grid">
            <label><span>Nombre de la solución</span><input value={name} onChange={e => setName(e.target.value)} /></label>
            <label><span>Tipo de aplicación</span><select value={type} onChange={e => setType(e.target.value)}><option>Aplicación web empresarial</option><option>E-commerce</option><option>API / Backend</option><option>Portal de clientes</option></select></label>
            <label><span>Región principal</span><select value={region} onChange={e => setRegion(e.target.value)}><option>US East (Ohio)</option><option>Europe (Ireland)</option><option>South America (São Paulo)</option></select></label>
            <label><span>Usuarios estimados</span><input type="number" min="1" value={users} onChange={e => setUsers(Number(e.target.value))} /></label>
            <label><span>Disponibilidad requerida</span><select value={availability} onChange={e => setAvailability(e.target.value)}><option>Alta disponibilidad</option><option>Estándar</option><option>Crítica 24/7</option></select></label>
            <label><span>Objetivo principal</span><select value={objective} onChange={e => setObjective(e.target.value)}><option>Escalabilidad y reducción de costos</option><option>Modernización</option><option>Continuidad del negocio</option><option>Rendimiento global</option></select></label>
            <label className="wide"><span>Descripción del proyecto</span><textarea value={description} onChange={e => setDescription(e.target.value)} /></label>

            <div className="wide service-selector">
              <div className="field-title">Servicios y recursos de la simulación</div>
              <motion.div className="service-choice-grid" variants={staggerContainer} initial="hidden" animate="show">
                {services.map(([service, category, , Icon]) => {
                  const active = selected.includes(service);
                  return <motion.button type="button" variants={staggerItem} whileHover={{ y: -2 }} whileTap={tapScale} className={active ? 'service-choice selected' : 'service-choice'} onClick={() => toggle(service)} key={service}>
                    <Icon size={18}/><span><b>{service}</b><small>{category}</small></span>{active && <CheckCircle2 size={16}/>} 
                  </motion.button>;
                })}
              </motion.div>
            </div>

            {selected.length > 0 && <div className="wide simulation-inputs">
              <div className="field-title">Consumo estimado</div>
              <div className="simulation-input-grid">
                {selected.map(service => { const Icon = icons[service] || Cpu; return <div className="simulation-input" key={service}><div><Icon size={16}/><b>{service}</b><small>{service === 'EC2' || service === 'RDS' ? 'instancias' : service === 'S3' || service === 'CloudFront' ? 'GB' : service === 'Route 53' ? 'zonas' : 'recursos'}</small></div><input type="number" min="0" value={quantities[service] ?? 1} onChange={e => setQuantity(service, Number(e.target.value))} /></div>; })}
              </div>
            </div>}

            <div className="wide form-actions">
              <motion.button className="primary-button" type="submit" disabled={!selected.length} whileHover={{ y: -2 }} whileTap={tapScale}><Sparkles size={17}/> Generar planificación</motion.button>
              <AnimatePresence>{saved && <motion.span className="saved" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><CheckCircle2 size={17}/>Guardada en localStorage</motion.span>}</AnimatePresence>
            </div>
          </form>
        </Card>

        <div className="planner-side">
          <Card className="estimate-hero combined-estimate"><div className="estimate-label"><CircleDollarSign size={18}/> ESTIMACIÓN GENERADA</div><motion.strong key={monthlyCost} initial={{ opacity: 0.4, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>{usd(monthlyCost)}</motion.strong><span>por mes</span><small>Proyección anual: {usd(monthlyCost * 12)}</small><div className="estimate-progress"><motion.i animate={{ width: `${Math.min(100, monthlyCost / 2)}%` }} /></div><p>Los costos son referencias para la simulación; el valor real de AWS depende de región, uso y descuentos.</p></Card>
          <Card className="blueprint-card"><div className="blueprint-head"><span><Users size={18}/></span><div><small>LIVE SIMULATION</small><h3>{name || 'Nueva solución'}</h3></div></div><div className="blueprint-metrics"><div><span>Perfil</span><b>{profile}</b></div><div><span>Usuarios</span><b>{users.toLocaleString()}</b></div><div><span>Región</span><b>{region.replace('US East ','').replace('South America ','').replace('Europe ','')}</b></div><div><span>Servicios</span><b>{selected.length}</b></div></div><div className="blueprint-flow"><span>Internet</span><i>→</i><span>Edge</span><i>→</i><span>VPC</span><i>→</i><span>App + DB</span></div></Card>
          <Card className="recommendation-card"><div className="card-header"><div><span className="section-kicker">CÁLCULO</span><h3>Resumen de recursos</h3></div><CircleDollarSign size={19}/></div><div className="recommendation-list"><span><CheckCircle2 size={15}/> {selected.length} servicios incluidos</span><span><CheckCircle2 size={15}/> {costItems.filter(x => x.monthly > 0).length} servicios con costo directo</span><span><CheckCircle2 size={15}/> {users.toLocaleString()} usuarios estimados</span><span><CheckCircle2 size={15}/> {availability}</span></div></Card>
        </div>
      </div>
      <Card className="pricing-table-card combined-breakdown"><div className="card-header"><div><span className="section-kicker">BREAKDOWN</span><h3>Detalle del cálculo de los costos</h3></div><span className="mini-badge">Pago referenciado</span></div><div className="pricing-table"><div className="pricing-row head"><span>Servicio</span><span>Tarifa de referencia</span><span>Consumo</span><span>Subtotal</span></div>{costItems.map(item => <div className="pricing-row" key={item.service}><span><b>{item.service}</b><small>{item.detail}</small></span><span>{item.rate === 0 ? 'Sin costo directo' : `${usd(item.rate)} ${item.unit}`}</span><span>{item.usage}</span><strong>{usd(item.monthly)}</strong></div>)}</div></Card>
      <motion.div className="pricing-note" variants={staggerItem}><Info size={18}/><div><b>Una sola fuente de datos</b><span>Al pulsar “Generar simulación”, esta configuración, los servicios, cantidades y costos se guardan juntos y el Dashboard se actualiza con el escenario generado.</span></div></motion.div>
    </motion.div>
  </Page>;
}

export default Planning;