import { useMemo } from 'react';
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
  Layers3,
  PieChart as PieChartIcon,
  ReceiptText,
  Sparkles,
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

import {
  Card,
  Page,
  Title,
  usd,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';
import { useSimulation } from '../context/SimulationContext';

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
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export function Costs() {
  const { simulation } = useSimulation();

  const positiveItems = useMemo(
    () =>
      simulation?.costItems.filter((item) => item.monthly > 0) ?? [],
    [simulation]
  );

  const freeItems = useMemo(
    () =>
      simulation?.costItems.filter((item) => item.monthly === 0) ?? [],
    [simulation]
  );

  const totalMonthly = simulation?.monthlyCost ?? 0;
  const totalAnnual = simulation?.annualCost ?? 0;

  const topCostService = useMemo(() => {
    if (!positiveItems.length) return null;

    return [...positiveItems].sort(
      (a, b) => b.monthly - a.monthly
    )[0];
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
        cost: Number(
          (totalMonthly * (index + 1)).toFixed(2)
        ),
      })),
    [totalMonthly]
  );

  /*
   * Estado vacío:
   * Se muestra cuando todavía no existe una simulación
   * generada desde Planificación.
   */
  if (!simulation) {
    return (
      <Page>
        <motion.div
          className="dashboard-empty"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-icon">
            <WalletCards size={34} />
          </div>

          <span className="section-kicker">
            FINOPS WORKSPACE
          </span>

          <h1>
            Primero genera una simulación Cloud
          </h1>

          <p>
            El módulo de costos utiliza la planificación activa
            para analizar servicios, consumo, costo mensual y
            proyección anual. Crea una simulación para comenzar.
          </p>

          <Link
            className="primary-button"
            to="/dashboard/planning"
          >
            <Sparkles size={17} />
            Ir a Planificación
          </Link>

          <div className="empty-features">
            <span>
              <CircleDollarSign size={16} />
              Costos mensuales
            </span>

            <span>
              <BarChart3 size={16} />
              Proyección anual
            </span>

            <span>
              <PieChartIcon size={16} />
              Distribución
            </span>

            <span>
              <ReceiptText size={16} />
              Detalle por servicio
            </span>
          </div>
        </motion.div>
      </Page>
    );
  }

  return (
    <Page>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <Title
          t="Costos y economía Cloud"
          s={`Análisis FinOps de la simulación activa: ${simulation.name}`}
          tag="FINOPS + COST MANAGEMENT"
        />

        {/* Información de la simulación activa */}
        <motion.div
          className="simulation-meta-strip"
          variants={staggerItem}
        >
          <span>
            <b>Escenario activo</b> {simulation.name}
          </span>

          <span>
            {simulation.region}
          </span>

          <span>
            {simulation.selectedServices.length}{' '}
            servicios seleccionados
          </span>

          <span>
            {simulation.users.toLocaleString()}{' '}
            usuarios estimados
          </span>
        </motion.div>

        {/* Métricas principales */}
        <motion.div
          className="stats-grid"
          variants={staggerContainer}
        >
          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon amber">
                <CircleDollarSign size={20} />
              </span>

              <span className="trend positive">
                <ArrowUpRight size={14} />
                Base
              </span>
            </div>

            <span className="stat-label">
              Costo mensual estimado
            </span>

            <strong>
              {usd(totalMonthly)}
            </strong>

            <small>
              Escenario actual de consumo
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <CalendarRange size={20} />
              </span>

              <span className="mini-badge">
                12 meses
              </span>
            </div>

            <span className="stat-label">
              Costo anual proyectado
            </span>

            <strong>
              {usd(totalAnnual)}
            </strong>

            <small>
              Mensual estimado × 12
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Layers3 size={20} />
              </span>

              <span className="trend positive">
                <CheckCircle2 size={14} />
                Activos
              </span>
            </div>

            <span className="stat-label">
              Servicios con costo directo
            </span>

            <strong>
              {positiveItems.length}
            </strong>

            <small>
              {freeItems.length} servicio(s) sin costo directo
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <ReceiptText size={20} />
              </span>

              <span className="mini-badge">
                Principal
              </span>
            </div>

            <span className="stat-label">
              Mayor componente de gasto
            </span>

            <strong className="security-value">
              {topCostService?.service ?? '—'}
            </strong>

            <small>
              {topCostService
                ? `${usd(topCostService.monthly)} / mes`
                : 'Sin cargos directos'}
            </small>
          </Card>
        </motion.div>

        {/* Gráficos */}
        <motion.div
          className="content-grid dashboard-grid"
          variants={staggerContainer}
        >
          {/* Proyección anual */}
          <Card className="chart-card chart-glow">
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  ANNUAL PROJECTION
                </span>

                <h3>
                  Acumulado estimado durante 12 meses
                </h3>

                <p>
                  Proyección lineal basada en el costo
                  mensual de la simulación.
                </p>
              </div>

              <span className="mini-badge">
                FinOps
              </span>
            </div>

            <ResponsiveContainer
              width="100%"
              height={290}
            >
              <AreaChart
                data={annualProjection}
                margin={{
                  top: 12,
                  right: 10,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="costsAnnualGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#F59E0B"
                      stopOpacity={0.34}
                    />

                    <stop
                      offset="100%"
                      stopColor="#F59E0B"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#E2E8F0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748B',
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#94A3B8',
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value: number | string) =>
                    usd(Number(value))
                  }
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow:
                      '0 18px 40px rgba(15,23,42,.14)',
                    color: 'var(--text)',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="url(#costsAnnualGradient)"
                  animationDuration={1100}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Distribución */}
          <Card className="chart-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  COST BREAKDOWN
                </span>

                <h3>
                  Distribución por servicio
                </h3>

                <p>
                  Participación del costo mensual
                  con cargo directo.
                </p>
              </div>

              <span className="health-score">
                Simulado
              </span>
            </div>

            {costDistribution.length > 0 ? (
              <>
                <div className="donut-wrap">
                  <ResponsiveContainer
                    width="100%"
                    height={230}
                  >
                    <PieChart>
                      <Pie
                        data={costDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={66}
                        outerRadius={94}
                        paddingAngle={4}
                        animationDuration={1100}
                      >
                        {costDistribution.map(
                          (item, index) => (
                            <Cell
                              key={item.name}
                              fill={
                                chartColors[
                                  index %
                                    chartColors.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(
                          value: number | string
                        ) => usd(Number(value))}
                        contentStyle={{
                          background:
                            'var(--card)',
                          border:
                            '1px solid var(--border)',
                          borderRadius: 12,
                          color: 'var(--text)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    <strong>
                      {usd(totalMonthly)}
                    </strong>

                    <span>
                      mensual
                    </span>
                  </div>
                </div>

                <div className="legend-grid">
                  {costDistribution.map(
                    (item, index) => {
                      const percentage =
                        totalMonthly > 0
                          ? (item.value /
                              totalMonthly) *
                            100
                          : 0;

                      return (
                        <span key={item.name}>
                          <i
                            style={{
                              background:
                                chartColors[
                                  index %
                                    chartColors.length
                                ],
                            }}
                          />

                          {item.name}

                          <b>
                            {percentage.toFixed(1)}%
                          </b>
                        </span>
                      );
                    }
                  )}
                </div>
              </>
            ) : (
              <div
                className="dashboard-empty"
                style={{ minHeight: 280 }}
              >
                <div className="empty-icon">
                  <CheckCircle2 size={28} />
                </div>

                <h1 style={{ fontSize: 21 }}>
                  Sin cargos directos
                </h1>

                <p
                  style={{
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  Los servicios seleccionados
                  actualmente no generan un costo
                  directo dentro de esta simulación.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Resumen visual */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
        >
          <div>
            <span className="overview-icon">
              <CircleDollarSign size={20} />
            </span>

            <div>
              <b>Costo base</b>
              <small>
                {usd(totalMonthly)} por mes
              </small>
            </div>
          </div>

          <ArrowDownRight size={20} />

          <div>
            <span className="overview-icon">
              <CalendarRange size={20} />
            </span>

            <div>
              <b>Proyección anual</b>
              <small>
                {usd(totalAnnual)} acumulados
                en 12 meses
              </small>
            </div>
          </div>

          <ArrowDownRight size={20} />

          <div>
            <span className="overview-icon">
              <Clock3 size={20} />
            </span>

            <div>
              <b>Base del cálculo</b>
              <small>
                Uso simulado con referencias
                de servicio
              </small>
            </div>
          </div>
        </motion.div>

        {/* Detalle */}
        <Card className="pricing-table-card">
          <div className="card-header">
            <div>
              <span className="section-kicker">
                COST DETAIL
              </span>

              <h3>
                Detalle del cálculo
              </h3>

              <p>
                Valores heredados de la
                planificación activa.
              </p>
            </div>

            <span className="mini-badge">
              Solo lectura
            </span>
          </div>

          <div className="pricing-table">
            <div className="pricing-row head">
              <span>Servicio</span>
              <span>Tarifa</span>
              <span>Consumo</span>
              <span>Subtotal</span>
            </div>

            {simulation.costItems.map(
              (item) => (
                <div
                  className="pricing-row"
                  key={item.service}
                >
                  <span>
                    <b>{item.service}</b>
                    <small>
                      {item.detail}
                    </small>
                  </span>

                  <span>
                    {item.rate === 0
                      ? 'Sin costo directo'
                      : `${usd(item.rate)} ${item.unit}`}
                  </span>

                  <span>
                    {item.usage}
                  </span>

                  <strong>
                    {usd(item.monthly)}
                  </strong>
                </div>
              )
            )}

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
                <small>
                  Base de la simulación actual
                </small>
              </span>

              <span />
              <span />

              <strong>
                {usd(totalMonthly)}
              </strong>
            </div>
          </div>
        </Card>

        {/* Nota final */}
        <motion.div
          className="pricing-note"
          variants={staggerItem}
        >
          <ReceiptText size={18} />

          <div>
            <b>
              Fuente de datos compartida
            </b>

            <span>
              Este módulo no crea una segunda
              estimación: utiliza exactamente
              los servicios, cantidades y costos
              guardados por la planificación activa.
              Para modificar el escenario, utiliza
              Planificación Cloud y vuelve a
              generar la simulación.
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

export default Costs;