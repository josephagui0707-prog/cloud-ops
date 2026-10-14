import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Minus,
  Layers3,
  PieChart as PieChartIcon,
  Plus,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { budgetLevel } from '../operations/model';
import { useOperations } from '../operations/OperationsContext';
import {
  Card,
  Page,
  Title,
  usd,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';
import {
  useSimulation,
  type SimulationCostItem,
} from '../context/SimulationContext';

const rates: Record<string, { rate: number; unit: string; detail: string }> = {
  EC2: { rate: 0.0104, unit: 'USD/h', detail: 'Referencia de cómputo' },
  RDS: { rate: 0.017, unit: 'USD/h', detail: 'Referencia de base de datos' },
  S3: { rate: 0.023, unit: 'USD/GB-mes', detail: 'Referencia de almacenamiento' },
  CloudFront: { rate: 0.085, unit: 'USD/GB', detail: 'Referencia de transferencia' },
  'Route 53': { rate: 0.5, unit: 'USD/zona-mes', detail: 'Referencia de zona alojada' },
  IAM: { rate: 0, unit: 'USD/mes', detail: 'Gestión de identidades' },
  VPC: { rate: 0, unit: 'USD/mes', detail: 'Red virtual privada' },
};

const chartColors = [
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#0891B2',
  '#DC2626',
  '#64748B',
];

const months = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

type DemandProfile = {
  label: string;
  range: string;
  description: string;
  suggested: Record<string, number>;
};

function getDemandProfile(users: number): DemandProfile {
  if (users <= 500) {
    return {
      label: 'Carga baja',
      range: '1–500 usuarios',
      description: 'Referencia inicial para un escenario de baja demanda.',
      suggested: { EC2: 1, RDS: 1, S3: 100, CloudFront: 50, 'Route 53': 1 },
    };
  }
  if (users <= 2000) {
    return {
      label: 'Carga media',
      range: '501–2,000 usuarios',
      description: 'Referencia interna del simulador para una demanda moderada.',
      suggested: { EC2: 2, RDS: 2, S3: 250, CloudFront: 150, 'Route 53': 1 },
    };
  }
  if (users <= 10000) {
    return {
      label: 'Carga alta',
      range: '2,001–10,000 usuarios',
      description: 'Referencia interna del simulador para una demanda alta.',
      suggested: { EC2: 4, RDS: 2, S3: 500, CloudFront: 400, 'Route 53': 1 },
    };
  }
  return {
    label: 'Carga muy alta',
    range: 'Más de 10,000 usuarios',
    description: 'Referencia interna del simulador para una carga muy alta.',
    suggested: { EC2: 8, RDS: 4, S3: 1000, CloudFront: 800, 'Route 53': 2 },
  };
}

function getServiceMeta(service: string) {
  switch (service) {
    case 'EC2':
      return { label: 'Capacidad de cómputo', unit: 'instancias', step: 1 };
    case 'RDS':
      return { label: 'Capacidad de base de datos', unit: 'instancias', step: 1 };
    case 'S3':
      return { label: 'Almacenamiento', unit: 'GB', step: 10 };
    case 'CloudFront':
      return { label: 'Transferencia de datos', unit: 'GB', step: 10 };
    case 'Route 53':
      return { label: 'Zonas alojadas', unit: 'zonas', step: 1 };
    default:
      return { label: 'Servicio administrado', unit: 'sin consumo', step: 1 };
  }
}

function calculateCostItem(
  service: string,
  quantity: number,
  previous?: SimulationCostItem
): SimulationCostItem {
  const config = rates[service] ?? {
    rate: previous?.rate ?? 0,
    unit: previous?.unit ?? 'USD/mes',
    detail: previous?.detail ?? 'Servicio AWS',
  };
  const safeQuantity = Math.max(0, Number.isFinite(quantity) ? quantity : 0);
  let monthly = 0;
  let usage = `${safeQuantity}`;

  if (service === 'EC2' || service === 'RDS') {
    monthly = safeQuantity * 730 * config.rate;
    usage = `${safeQuantity} × 730 h`;
  } else if (service === 'S3' || service === 'CloudFront') {
    monthly = safeQuantity * config.rate;
    usage = `${safeQuantity} GB`;
  } else if (service === 'Route 53') {
    monthly = safeQuantity * config.rate;
    usage = `${safeQuantity} zona(s)`;
  } else {
    monthly = 0;
    usage = 'Sin costo directo';
  }

  return {
    service,
    detail: config.detail,
    quantity: safeQuantity,
    usage,
    rate: config.rate,
    unit: config.unit,
    monthly,
  };
}

export function Costs() {
  const { simulation, updateSimulation } = useSimulation();
  const { budgets, setBudget } = useOperations();

  const positiveItems = useMemo(
    () => simulation?.costItems.filter((item) => item.monthly > 0) ?? [],
    [simulation]
  );

  const freeItems = useMemo(
    () => simulation?.costItems.filter((item) => item.rate === 0) ?? [],
    [simulation]
  );

  const pricedItems = useMemo(
    () => simulation?.costItems.filter((item) => item.rate > 0) ?? [],
    [simulation]
  );

  const totalMonthly = simulation?.monthlyCost ?? 0;
  const totalAnnual = simulation?.annualCost ?? 0;
  const budgetLimit = simulation ? budgets[simulation.id] : undefined;
  const budgetStatus = budgetLevel(totalMonthly, budgetLimit);
  const budgetPercent = budgetLimit ? totalMonthly / budgetLimit * 100 : 0;

  const topCostService = useMemo(() => {
    if (!positiveItems.length) return null;
    return [...positiveItems].sort((a, b) => b.monthly - a.monthly)[0];
  }, [positiveItems]);

  const costDistribution = useMemo(
    () =>
      positiveItems.map((item) => ({
        name: item.service,
        value: Number(item.monthly.toFixed(2)),
      })),
    [positiveItems]
  );

  const annualProjection = useMemo(
    () =>
      months.map((month, index) => ({
        month,
        cost: Number((totalMonthly * (index + 1)).toFixed(2)),
      })),
    [totalMonthly]
  );

  const demandProfile = useMemo(
    () => getDemandProfile(simulation?.users ?? 0),
    [simulation?.users]
  );

  const persistItems = (items: SimulationCostItem[]) => {
    if (!simulation) return;
    const monthlyCost = items.reduce((sum, item) => sum + item.monthly, 0);
    updateSimulation(simulation.id, {
      costItems: items,
      monthlyCost,
      annualCost: monthlyCost * 12,
    });
  };

  const updateQuantity = (service: string, nextValue: number) => {
    if (!simulation) return;
    const current = simulation.costItems.find((item) => item.service === service);
    const nextItems = simulation.costItems.map((item) =>
      item.service === service
        ? calculateCostItem(service, Math.max(0, nextValue), current)
        : item
    );
    persistItems(nextItems);
  };

  const adjustQuantity = (service: string, delta: number) => {
    if (!simulation) return;
    const current = simulation.costItems.find((item) => item.service === service);
    if (!current) return;
    const meta = getServiceMeta(service);
    updateQuantity(service, Math.max(0, current.quantity + delta * meta.step));
  };

  const applyDemandReference = () => {
    if (!simulation) return;
    const nextItems = simulation.costItems.map((item) => {
      const suggested = demandProfile.suggested[item.service];
      return suggested === undefined
        ? item
        : calculateCostItem(item.service, suggested, item);
    });
    persistItems(nextItems);
  };

  const renderServiceCard = (item: SimulationCostItem) => {
    const meta = getServiceMeta(item.service);
    const editable = meta.unit !== 'sin consumo';

    return (
      <div
        key={item.service}
        style={{
          border: '1px solid var(--border)',
          background: 'var(--fill)',
          borderRadius: 14,
          padding: 13,
          minWidth: 0,
          boxShadow: '0 8px 20px rgba(15,23,42,.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span className="section-kicker">{item.service}</span>
            <strong
              style={{
                display: 'block',
                marginTop: 4,
                color: 'var(--text)',
                fontSize: 13,
              }}
            >
              {meta.label}
            </strong>
            <small
              style={{
                display: 'block',
                marginTop: 3,
                color: 'var(--muted)',
                fontSize: 10,
              }}
            >
              {item.rate === 0 ? 'Sin costo directo' : `Referencia de cálculo · ${usd(item.rate)} ${item.unit}`}
            </small>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 9,
                color: 'var(--muted-2)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
              }}
            >
              Subtotal
            </span>
            <b
              style={{
                display: 'block',
                marginTop: 2,
                color: 'var(--primary)',
                whiteSpace: 'nowrap',
                fontSize: 13,
              }}
            >
              {usd(item.monthly)}
            </b>
          </div>
        </div>

        {editable ? (
          <div
            style={{
              marginTop: 12,
              padding: 9,
              border: '1px solid var(--border)',
              borderRadius: 11,
              background: 'var(--card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                }}
              >
                Consumo configurado
              </span>
              <span
                style={{
                  padding: '4px 7px',
                  borderRadius: 999,
                  background: 'var(--soft-blue)',
                  color: 'var(--primary)',
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                {meta.unit}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px minmax(0,1fr) 36px',
                gap: 7,
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => adjustQuantity(item.service, -1)}
                aria-label={`Reducir consumo de ${item.service}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--fill)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Minus size={14} />
              </button>

              <div
                style={{
                  position: 'relative',
                  minWidth: 0,
                }}
              >
                <input
                  aria-label={`Cantidad de ${item.service}`}
                  type="number"
                  min="0"
                  step={meta.step}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.service, Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 42px 0 12px',
                    borderRadius: 9,
                    border: '1px solid var(--primary)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontWeight: 800,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 10,
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    fontSize: 9,
                    fontWeight: 700,
                    pointerEvents: 'none',
                  }}
                >
                  {meta.unit}
                </span>
              </div>

              <button
                type="button"
                onClick={() => adjustQuantity(item.service, 1)}
                aria-label={`Aumentar consumo de ${item.service}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--soft-blue)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 7,
                color: 'var(--muted)',
                fontSize: 9,
              }}
            >
              <span>{item.usage}</span>
              <span>Actualización inmediata</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              padding: '10px 11px',
              borderRadius: 10,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: 10,
            }}
          >
            Este servicio no genera un cargo directo dentro del modelo actual.
          </div>
        )}
      </div>
    );
  };

  if (!simulation) {
    return (
      <Page>
        <motion.div
          className="dashboard-empty"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-icon"><WalletCards size={34} /></div>
          <span className="section-kicker">FINOPS WORKSPACE</span>
          <h1>Primero genera una simulación Cloud</h1>
          <p>
            El módulo de costos utiliza la planificación activa para configurar consumos,
            analizar costos y proyectar el escenario.
          </p>
          <Link className="primary-button" to="/dashboard/planning">
            <Sparkles size={17} />
            Ir a Planificación
          </Link>
          <div className="empty-features">
            <span><CircleDollarSign size={16} />Costos mensuales</span>
            <span><BarChart3 size={16} />Proyección anual</span>
            <span><PieChartIcon size={16} />Distribución</span>
            <span><ReceiptText size={16} />Detalle por servicio</span>
          </div>
        </motion.div>
      </Page>
    );
  }

  return (
    <Page>
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <Title
          t="Costos y economía Cloud"
          s={`Dimensiona el consumo y analiza el costo de la simulación activa: ${simulation.name}`}
          tag="FINOPS + COST MANAGEMENT"
        />

        <motion.div className="simulation-meta-strip" variants={staggerItem}>
          <span><b>Escenario activo</b> {simulation.name}</span>
          <span>{simulation.region}</span>
          <span>{simulation.selectedServices.length} servicios seleccionados</span>
          <span>{simulation.users.toLocaleString()} usuarios estimados</span>
        </motion.div>

        <BudgetControl simulationId={simulation.id} monthlyCost={totalMonthly} limit={budgetLimit} status={budgetStatus} percent={budgetPercent} onSave={limit=>setBudget(simulation.id,limit)} />

        <motion.div className="stats-grid" variants={staggerContainer}>
          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon amber"><CircleDollarSign size={20} /></span>
              <span className="trend positive"><ArrowUpRight size={14} /> Actual</span>
            </div>
            <span className="stat-label">Costo mensual estimado</span>
            <strong>{usd(totalMonthly)}</strong>
            <small>Resultado de los consumos configurados</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon blue"><CalendarRange size={20} /></span>
              <span className="mini-badge">12 meses</span>
            </div>
            <span className="stat-label">Costo anual proyectado</span>
            <strong>{usd(totalAnnual)}</strong>
            <small>Mensual estimado × 12</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon blue"><Layers3 size={20} /></span>
              <span className="trend positive"><CheckCircle2 size={14} /> Activos</span>
            </div>
            <span className="stat-label">Servicios con costo directo</span>
            <strong>{positiveItems.length}</strong>
            <small>{freeItems.length} servicio(s) sin costo directo</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon green"><ReceiptText size={20} /></span>
              <span className="mini-badge">Principal</span>
            </div>
            <span className="stat-label">Mayor componente de gasto</span>
            <strong className="security-value">{topCostService?.service ?? '—'}</strong>
            <small>
              {topCostService ? `${usd(topCostService.monthly)} / mes` : 'Sin cargos directos'}
            </small>
          </Card>
        </motion.div>

        <motion.div
          className="cost-charts-grid"
          variants={staggerItem}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 430px), 1fr))',
            gap: 12,
            marginTop: 10,
            alignItems: 'stretch',
          }}
        >
          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">CONSUMPTION WORKSPACE</span>
                <h3>Dimensionamiento y consumo</h3>
                <p>Ajusta el consumo de cada servicio y observa el costo en tiempo real.</p>
              </div>
              <span className="status-badge success">Guardado en escenario</span>
            </div>

            <div
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'var(--soft-blue)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--card)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  <Users size={16} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 11, color: 'var(--text)' }}>
                    {simulation.users.toLocaleString()} usuarios · {demandProfile.label}
                  </strong>
                  <small style={{ display: 'block', marginTop: 2, color: 'var(--muted)', fontSize: 9 }}>
                    Referencia interna: {demandProfile.range}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={applyDemandReference}
                style={{ minHeight: 36, padding: '0 12px', whiteSpace: 'nowrap' }}
              >
                Aplicar referencia
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10,
              }}
            >
              {pricedItems.map(renderServiceCard)}
            </div>

            {freeItems.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span className="section-kicker">SIN COSTO DIRECTO</span>
                    <small style={{ display: 'block', marginTop: 3, color: 'var(--muted)', fontSize: 9 }}>
                      Servicios configurados sin cargo dentro del modelo actual.
                    </small>
                  </div>
                  <span className="mini-badge">{freeItems.length}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {freeItems.map(renderServiceCard)}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                padding: 13,
                borderRadius: 13,
                background: 'var(--soft-blue)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>
                  TOTAL MENSUAL ACTUAL
                </span>
                <strong style={{ display: 'block', marginTop: 2, color: 'var(--text)', fontSize: 21 }}>
                  {usd(totalMonthly)}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>
                  PROYECCIÓN ANUAL
                </span>
                <strong style={{ display: 'block', marginTop: 2, color: 'var(--primary)', fontSize: 16 }}>
                  {usd(totalAnnual)}
                </strong>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gap: 10 }}>
            <Card className="chart-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">LIVE COST</span>
                  <h3>Distribución actual</h3>
                  <p>Se actualiza junto con cada consumo.</p>
                </div>
                <span className="health-score">En vivo</span>
              </div>

              {costDistribution.length > 0 ? (
                <>
                  <div className="donut-wrap" style={{ minHeight: 205 }}>
                    <ResponsiveContainer width="100%" height={205}>
                      <PieChart>
                        <Pie
                          data={costDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={56}
                          outerRadius={82}
                          paddingAngle={4}
                          animationDuration={450}
                        >
                          {costDistribution.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | string) => usd(Number(value))}
                          contentStyle={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <strong>{usd(totalMonthly)}</strong>
                      <span>mensual</span>
                    </div>
                  </div>

                  <div className="legend-grid">
                    {costDistribution.map((item, index) => {
                      const percentage = totalMonthly > 0
                        ? (item.value / totalMonthly) * 100
                        : 0;
                      return (
                        <span key={item.name}>
                          <i style={{ background: chartColors[index % chartColors.length] }} />
                          {item.name}
                          <b>{percentage.toFixed(1)}%</b>
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="dashboard-empty" style={{ minHeight: 205 }}>
                  <div className="empty-icon"><CheckCircle2 size={28} /></div>
                  <h1 style={{ fontSize: 19 }}>Sin cargos directos</h1>
                  <p style={{ fontSize: 12, marginBottom: 0 }}>
                    Los servicios actuales no generan un cargo directo.
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <div className="card-header">
                <div>
                  <span className="section-kicker">ANNUAL PROJECTION</span>
                  <h3>Proyección acumulada</h3>
                </div>
                <TrendingUp size={18} />
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart
                  data={annualProjection}
                  margin={{ top: 8, right: 4, left: -26, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="costsAnnualGradientV2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.30} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value: number | string) => usd(Number(value))}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--text)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fill="url(#costsAnnualGradientV2)"
                    animationDuration={450}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

          </div>
        </motion.div>

        <motion.div className="overview-strip executive" variants={staggerItem} style={{ marginTop: 10 }}>
          <div>
            <span className="overview-icon"><CircleDollarSign size={20} /></span>
            <div><b>Costo base</b><small>{usd(totalMonthly)} por mes</small></div>
          </div>
          <ArrowDownRight size={20} />
          <div>
            <span className="overview-icon"><CalendarRange size={20} /></span>
            <div><b>Proyección anual</b><small>{usd(totalAnnual)} acumulados en 12 meses</small></div>
          </div>
          <ArrowDownRight size={20} />
          <div>
            <span className="overview-icon"><Clock3 size={20} /></span>
            <div><b>Base del cálculo</b><small>Consumo editable por servicio</small></div>
          </div>
        </motion.div>

        <Card className="pricing-table-card" style={{ marginTop: 10 }}>
          <div className="card-header">
            <div>
              <span className="section-kicker">COST DETAIL</span>
              <h3>Detalle del cálculo</h3>
              <p>Subtotales y total de la simulación activa.</p>
            </div>
            <span className="mini-badge">Actualizado</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div className="pricing-table" style={{ minWidth: 690 }}>
              <div className="pricing-row head">
                <span>Servicio</span>
                <span>Tarifa</span>
                <span>Consumo</span>
                <span style={{ textAlign: 'center' }}>Subtotal</span>
              </div>

              {[...pricedItems, ...freeItems].map((item) => (
                <div className="pricing-row" key={item.service}>
                  <span>
                    <b>{item.service}</b>
                    <small>{getServiceMeta(item.service).label} · referencia de cálculo</small>
                  </span>
                  <span>
                    {item.rate === 0
                      ? 'Sin costo directo'
                      : `${usd(item.rate)} ${item.unit}`}
                  </span>
                  <span>{item.usage}</span>
                  <strong
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    {usd(item.monthly)}
                  </strong>
                </div>
              ))}

              <div
                className="pricing-row"
                style={{
                  background: 'var(--fill)',
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <span>
                  <b>Total estimado</b>
                  <small>Base de la simulación actual</small>
                </span>
                <span />
                <span />
                <strong
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {usd(totalMonthly)}
                </strong>
              </div>
            </div>
          </div>
        </Card>

        <motion.div className="pricing-note" variants={staggerItem}>
          <ReceiptText size={18} />
          <div>
            <b>Fuente de datos compartida</b>
            <span>
              Planificación define el escenario. Costos ajusta el consumo y guarda los nuevos valores
              para los demás módulos.
            </span>
          </div>
          <Link
            className="mini-badge"
            to="/dashboard/planning"
            style={{ textDecoration: 'none' }}
          >
            Editar escenario
          </Link>
        </motion.div>
      </motion.div>
    </Page>
  );
}

function BudgetControl({simulationId,monthlyCost,limit,status,percent,onSave}:{simulationId:string;monthlyCost:number;limit:number|undefined;status:string;percent:number;onSave:(limit:number|null)=>void}) {
  const [draft,setDraft]=useState(limit?.toString() || '');
  useEffect(()=>setDraft(limit?.toString() || ''),[simulationId,limit]);
  const levelText=status==='critical'?'Límite alcanzado o superado':status==='warning'?'Advertencia · se alcanzó el 80 %':status==='ok'?'Dentro del presupuesto':'Define un límite mensual';
  return <section className={`cost-budget ${status}`} aria-label="Control de presupuesto">
    <div className="cost-budget-status"><span className="cost-budget-icon"><CircleDollarSign size={19}/></span><div><strong>Control del presupuesto</strong><small>{levelText}{limit ? ` · ${percent.toFixed(1)} % utilizado` : ''}</small></div></div>
    <div className="cost-budget-meter">{limit ? <><div className="cost-budget-values"><span>Estimado <b>{usd(monthlyCost)}</b></span><span>Límite <b>{usd(limit)}</b></span></div><progress aria-label="Uso del límite mensual" max={100} value={Math.min(100,percent)}/></> : <small>Alerta visual al 80 % y estado crítico desde el 100 %.</small>}</div>
    <form className="cost-budget-form" onSubmit={e=>{e.preventDefault();const value=Number(draft);if(Number.isFinite(value)&&value>0)onSave(value);}}><label className="sr-only" htmlFor="cost-budget-limit">Límite mensual en dólares</label><input id="cost-budget-limit" type="number" min="0.01" step="0.01" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Límite USD"/><button type="submit">{limit?'Actualizar':'Definir límite'}</button>{limit && <button type="button" className="cost-budget-clear" onClick={()=>{onSave(null);setDraft('');}}>Quitar</button>}</form>
  </section>;
}

export default Costs;
