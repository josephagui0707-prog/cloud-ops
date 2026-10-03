import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Database,
  Gauge,
  FileText,
  Globe2,
  Layers3,
  Link2,
  Lock,
  MapPinned,
  Network as Net,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
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
import { Link } from 'react-router-dom';

import {
  Card,
  Page,
  Title,
  usd,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';

import { useSimulation } from '../context/SimulationContext';
import ReportModal from '../components/ReportModal';

const chartColors = [
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#0891B2',
  '#DC2626',
  '#64748B',
];

const regionCodes: Record<string, string> = {
  'US East (Ohio)': 'us-east-2',
  'Europe (Ireland)': 'eu-west-1',
  'South America (São Paulo)': 'sa-east-1',
};

export function Dashboard() {
  const {
    simulation,
    clearSimulation,
  } = useSimulation();

  const [showReport, setShowReport] = useState(false);

  const selectedServices =
    simulation?.selectedServices ?? [];

  const hasRoute53 =
    selectedServices.includes('Route 53');

  const hasCloudFront =
    selectedServices.includes('CloudFront');

  const hasVpc =
    selectedServices.includes('VPC');

  const hasEc2 =
    selectedServices.includes('EC2');

  const hasRds =
    selectedServices.includes('RDS');

  const hasS3 =
    selectedServices.includes('S3');

  const hasIam =
    selectedServices.includes('IAM');

  const costItems = useMemo(
    () =>
      simulation?.costItems.filter(
        (item) => item.monthly > 0
      ) ?? [],
    [simulation]
  );

  const totalPositiveCost = useMemo(
    () =>
      costItems.reduce(
        (sum, item) => sum + item.monthly,
        0
      ),
    [costItems]
  );

  const costDistribution = useMemo(() => {
    if (!costItems.length) return [];

    const total =
      totalPositiveCost || 1;

    return costItems.map((item) => ({
      name: item.service,
      value: Number(
        (
          (item.monthly / total) *
          100
        ).toFixed(1)
      ),
    }));
  }, [costItems, totalPositiveCost]);

  const monthly = simulation?.monthlyCost ?? 0;

  /*
   * Tendencia visual simulada.
   *
   * No representa consumos reales de AWS.
   * Se utiliza únicamente para dar contexto
   * histórico al dashboard.
   */
  const trend = useMemo(
    () => [
      {
        m: 'Abr',
        cost: monthly * 0.88,
      },
      {
        m: 'May',
        cost: monthly * 0.93,
      },
      {
        m: 'Jun',
        cost: monthly * 0.91,
      },
      {
        m: 'Jul',
        cost: monthly * 0.96,
      },
      {
        m: 'Ago',
        cost: monthly * 0.98,
      },
      {
        m: 'Sep',
        cost: monthly,
      },
    ],
    [monthly]
  );

  /*
   * Evaluación simulada de seguridad.
   *
   * Se mantiene alineada con la lógica utilizada
   * en Security.tsx:
   *
   * - Responsabilidad compartida: correcto
   * - IAM: depende de selección
   * - MFA: revisión
   * - Datos: depende de S3/RDS
   * - Red: depende de VPC
   * - Auditoría: revisión
   */
  const security = useMemo(() => {
    if (!simulation) {
      return {
        score: 0,
        correct: 0,
        review: 0,
        label: 'Sin evaluación',
      };
    }

    const correct =
      1 +
      (hasIam ? 1 : 0) +
      (hasS3 || hasRds ? 1 : 0) +
      (hasVpc ? 1 : 0);

    const totalControls = 6;
    const review =
      totalControls - correct;

    const score = Math.min(
      100,
      Math.max(
        0,
        40 + correct * 10 - review
      )
    );

    const label =
      score >= 90
        ? 'Postura simulada sólida'
        : score >= 80
        ? 'Postura simulada estable'
        : score >= 70
        ? 'Requiere mejoras'
        : 'Requiere atención';

    return {
      score,
      correct,
      review,
      label,
    };
  }, [
    simulation,
    hasIam,
    hasS3,
    hasRds,
    hasVpc,
  ]);

  const securityStatus =
    security.score >= 80
      ? 'Estable'
      : security.score >= 70
      ? 'Revisión'
      : 'Atención';

  const architectureFlow = useMemo(() => {
    if (!simulation) return '';

    const steps = ['Internet'];

    if (hasRoute53) {
      steps.push('Route 53');
    }

    if (hasCloudFront) {
      steps.push('CloudFront');
    }

    if (hasVpc) {
      steps.push('VPC');
    }

    if (hasEc2) {
      steps.push('EC2');
    }

    if (hasRds) {
      steps.push('RDS');
    }

    return steps.join(' → ');
  }, [
    simulation,
    hasRoute53,
    hasCloudFront,
    hasVpc,
    hasEc2,
    hasRds,
  ]);

  const architectureState = useMemo(() => {
    if (!simulation) return 'Sin configuración';

    if (
      hasRoute53 &&
      hasCloudFront &&
      hasVpc &&
      hasEc2 &&
      hasRds &&
      simulation.availability !== 'Estándar'
    ) {
      return 'Arquitectura completa';
    }

    if (hasVpc && hasEc2) {
      return 'Arquitectura funcional';
    }

    return 'Requiere configuración';
  }, [
    simulation,
    hasRoute53,
    hasCloudFront,
    hasVpc,
    hasEc2,
    hasRds,
  ]);

  const regionCode = simulation
    ? regionCodes[simulation.region] ??
      simulation.region
    : '';

  const topCostService = useMemo(() => {
    if (!costItems.length) return null;

    return [...costItems].sort(
      (a, b) =>
        b.monthly - a.monthly
    )[0];
  }, [costItems]);

  const simulationDate = useMemo(() => {
    if (!simulation?.createdAt) {
      return 'Sin fecha';
    }

    const date = new Date(
      simulation.createdAt
    );

    if (Number.isNaN(date.getTime())) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    ).format(date);
  }, [simulation]);

  /*
   * Estado vacío
   */
  if (!simulation) {
    return (
      <Page>
        <motion.div
          className="dashboard-empty"
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="empty-icon">
            <Cloud size={34} />
          </div>

          <span className="section-kicker">
            CLOUDOPS WORKSPACE
          </span>

          <h1>
            Tu dashboard está listo para
            una nueva planificación
          </h1>

          <p>
            Actualmente no existe una
            planificación activa. Configura
            los servicios, usuarios, región
            y disponibilidad desde
            Planificación Cloud para
            generar el tablero ejecutivo.
          </p>

          <Link
            className="primary-button"
            to="/dashboard/planning"
          >
            <Sparkles size={17} />
            Empezar
          </Link>

          <div className="empty-features">
            <span>
              <Layers3 size={16} />
              Servicios AWS
            </span>

            <span>
              <CircleDollarSign size={16} />
              Costos estimados
            </span>

            <span>
              <ShieldCheck size={16} />
              Seguridad
            </span>

            <span>
              <Net size={16} />
              Arquitectura
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
        {/* Cabecera */}
        <div className="dashboard-heading-row">
          <Title
            t="Dashboard de planificación activa"
            s={`Vista consolidada de ${simulation.name}`}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <motion.button
              type="button"
              className="primary-button"
              onClick={() => setShowReport(true)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <FileText size={16} />
              Generar reporte
            </motion.button>

            <motion.button
              type="button"
              className="danger-outline-button"
              onClick={clearSimulation}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={16} />
              Eliminar simulación
            </motion.button>
          </div>
        </div>

        {/* Identidad de la simulación */}
        <motion.div
          className="simulation-meta-strip"
          variants={staggerItem}
        >
          <span>
            <b>Simulación activa</b>{' '}
            {simulation.name}
          </span>

          <span>
            <b>Región</b> {regionCode}
          </span>

          <span>
            <b>Creada</b>{' '}
            {simulationDate}
          </span>

          <span>
            {simulation.users.toLocaleString()}{' '}
            usuarios ·{' '}
            {simulation.availability}
          </span>
        </motion.div>

        {/* Indicadores principales */}
        <motion.div
          className="stats-grid"
          variants={staggerContainer}
        >
          <Card
            hoverable
            className="stat-card premium"
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Layers3 size={20} />
              </span>

              <span className="trend positive">
                <ArrowUpRight size={14} />
                Activos
              </span>
            </div>

            <span className="stat-label">
              Servicios AWS
            </span>

            <strong>
              {simulation.selectedServices.length}
            </strong>

            <small>
              Componentes incluidos en
              la propuesta
            </small>
          </Card>

          <Card
            hoverable
            className="stat-card premium"
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <MapPinned size={20} />
              </span>

              <span className="mini-badge">
                {regionCode}
              </span>
            </div>

            <span className="stat-label">
              Región principal
            </span>

            <strong>
              {simulation.region}
            </strong>

            <small>
              Base de referencia para
              la arquitectura
            </small>
          </Card>

          <Card
            hoverable
            className="stat-card premium"
          >
            <div className="stat-top">
              <span className="stat-icon amber">
                <CircleDollarSign
                  size={20}
                />
              </span>

              <span className="trend positive">
                <TrendingUp size={14} />
                FinOps
              </span>
            </div>

            <span className="stat-label">
              Costo base estimado
            </span>

            <strong>
              {usd(monthly)}
            </strong>

            <small>
              Estimación del escenario /
              mes
            </small>
          </Card>

          <Card
            hoverable
            className="stat-card premium"
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <ShieldCheck
                  size={20}
                />
              </span>

              <span
                className={
                  security.score >= 80
                    ? 'trend positive'
                    : 'trend warning'
                }
              >
                {securityStatus}
              </span>
            </div>

            <span className="stat-label">
              Postura de seguridad
            </span>

            <strong className="security-value">
              {security.score}/100
            </strong>

            <small>
              {security.correct} controles
              correctos ·{' '}
              {security.review} en revisión
            </small>
          </Card>
        </motion.div>

        {/* Gráficos */}
        <motion.div
          className="content-grid dashboard-grid"
          variants={staggerContainer}
        >
          {/* Costos */}
          <Card className="chart-card chart-glow">
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  FINOPS TREND
                </span>

                <h3>
                  Evolución del gasto
                  simulado
                </h3>

                <p>
                  Proyección visual del
                  comportamiento mensual
                  de la simulación.
                </p>
              </div>

              <Link
                to="/dashboard/costs"
                className="mini-badge"
                style={{
                  textDecoration:
                    'none',
                }}
              >
                Ver costos
              </Link>
            </div>

            <ResponsiveContainer
              width="100%"
              height={290}
            >
              <AreaChart
                data={trend}
                margin={{
                  top: 12,
                  right: 10,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="dashboardCostGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563EB"
                      stopOpacity={0.34}
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563EB"
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
                  dataKey="m"
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
                  formatter={(
                    value:
                      | number
                      | string
                  ) =>
                    usd(
                      Number(value)
                    )
                  }
                  contentStyle={{
                    background:
                      'var(--card)',
                    border:
                      '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow:
                      '0 18px 40px rgba(15,23,42,.14)',
                    color:
                      'var(--text)',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#dashboardCostGradient)"
                  animationDuration={1300}
                  activeDot={{
                    r: 6,
                  }}
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
                  Participación del costo
                  mensual actual.
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
                        animationDuration={1200}
                      >
                        {costDistribution.map(
                          (
                            item,
                            index
                          ) => (
                            <Cell
                              key={
                                item.name
                              }
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
                          value:
                            | number
                            | string
                        ) =>
                          `${Number(
                            value
                          )}%`
                        }
                        contentStyle={{
                          background:
                            'var(--card)',
                          border:
                            '1px solid var(--border)',
                          borderRadius: 12,
                          color:
                            'var(--text)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    <strong>
                      {usd(monthly)}
                    </strong>

                    <span>
                      mensual
                    </span>
                  </div>
                </div>

                <div className="legend-grid">
                  {costDistribution.map(
                    (item, index) => (
                      <span
                        key={
                          item.name
                        }
                      >
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
                          {item.value}%
                        </b>
                      </span>
                    )
                  )}
                </div>
              </>
            ) : (
              <div
                className="dashboard-empty"
                style={{
                  minHeight: 250,
                }}
              >
                <div className="empty-icon">
                  <CircleDollarSign
                    size={27}
                  />
                </div>

                <h1
                  style={{
                    fontSize: 21,
                  }}
                >
                  Sin costos directos
                </h1>

                <p
                  style={{
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  Los servicios seleccionados
                  no generan un costo directo
                  dentro de esta simulación.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Resumen de arquitectura y seguridad */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
        >
          <div>
            <span className="overview-icon">
              <Cloud size={20} />
            </span>

            <div>
              <b>
                Arquitectura
              </b>

              <small>
                {architectureFlow}
              </small>
            </div>
          </div>

          <ChevronRight size={20} />

          <div>
            <span className="overview-icon">
              <ShieldCheck
                size={20}
              />
            </span>

            <div>
              <b>
                Seguridad
              </b>

              <small>
                {security.label} ·{' '}
                {security.score}/100
              </small>
            </div>
          </div>

          <ChevronRight size={20} />

          <div>
            <span className="overview-icon">
              <Gauge size={20} />
            </span>

            <div>
              <b>
                Operación
              </b>

              <small>
                {simulation.availability}{' '}
                ·{' '}
                {simulation.users.toLocaleString()}{' '}
                usuarios
              </small>
            </div>
          </div>
        </motion.div>

        {/* Resumen operativo */}
        <motion.div
          className="content-grid"
          variants={staggerContainer}
          style={{
            marginTop: 16,
          }}
        >
          <Card hoverable>
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  CLOUD OVERVIEW
                </span>

                <h3>
                  Estado de la solución
                </h3>

                <p>
                  Resumen de los componentes
                  principales del escenario.
                </p>
              </div>

              <Activity
                size={20}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <div className="service-function">
                <Boxes size={16} />

                <span>
                  <b>
                    Servicios
                  </b>

                  <small>
                    {
                      simulation
                        .selectedServices
                        .length
                    }{' '}
                    seleccionados
                  </small>
                </span>
              </div>

              <div className="service-function">
                <MapPinned
                  size={16}
                />

                <span>
                  <b>
                    Región
                  </b>

                  <small>
                    {regionCode}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Users size={16} />

                <span>
                  <b>
                    Capacidad
                  </b>

                  <small>
                    {simulation.users.toLocaleString()}{' '}
                    usuarios
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Activity
                  size={16}
                />

                <span>
                  <b>
                    Disponibilidad
                  </b>

                  <small>
                    {simulation.availability}
                  </small>
                </span>
              </div>
            </div>
          </Card>

          <Card hoverable>
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  FINOPS
                </span>

                <h3>
                  Resumen económico
                </h3>

                <p>
                  Lectura rápida de los principales
                  componentes de gasto.
                </p>
              </div>

              <BarChart3
                size={20}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
              }}
            >
              <div className="service-function">
                <CircleDollarSign
                  size={16}
                />

                <span>
                  <b>
                    Mensual
                  </b>

                  <small>
                    {usd(monthly)}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <TrendingUp
                  size={16}
                />

                <span>
                  <b>
                    Anual
                  </b>

                  <small>
                    {usd(
                      simulation.annualCost
                    )}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Server
                  size={16}
                />

                <span>
                  <b>
                    Mayor costo
                  </b>

                  <small>
                    {topCostService
                      ? `${topCostService.service} · ${usd(
                          topCostService.monthly
                        )}`
                      : 'Sin costos directos'}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Layers3
                  size={16}
                />

                <span>
                  <b>
                    Componentes con costo
                  </b>

                  <small>
                    {costItems.length}
                  </small>
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Accesos rápidos */}
        <motion.div
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <div
            className="card-header"
            style={{
              marginBottom: 13,
            }}
          >
            <div>
              <span className="section-kicker">
                QUICK ACCESS
              </span>

              <h3>
                Centro de operaciones
              </h3>

              <p>
                Accede directamente a los módulos
                que forman la simulación.
              </p>
            </div>

            <Link2 size={20} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Link
              to="/dashboard/planning"
              className="card"
              style={{
                textDecoration:
                  'none',
                color: 'inherit',
                padding: 16,
                transition:
                  'transform .18s ease, border-color .18s ease',
              }}
            >
              <span className="service-icon">
                <Cloud size={18} />
              </span>

              <span className="section-kicker">
                CONFIGURATION
              </span>

              <h3
                style={{
                  margin:
                    '5px 0 4px',
                  color:
                    'var(--text)',
                  fontSize: 15,
                }}
              >
                Planificación
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--muted)',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Modifica la propuesta,
                región, disponibilidad
                y servicios.
              </p>

              <span
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: 5,
                  marginTop: 12,
                  color:
                    'var(--primary)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Abrir
                <ArrowRight
                  size={14}
                />
              </span>
            </Link>

            <Link
              to="/dashboard/infrastructure"
              className="card"
              style={{
                textDecoration:
                  'none',
                color: 'inherit',
                padding: 16,
              }}
            >
              <span className="service-icon">
                <Globe2 size={18} />
              </span>

              <span className="section-kicker">
                GLOBAL
              </span>

              <h3
                style={{
                  margin:
                    '5px 0 4px',
                  color:
                    'var(--text)',
                  fontSize: 15,
                }}
              >
                Infraestructura
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--muted)',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Consulta región, servicios
                y alcance del despliegue
                simulado.
              </p>

              <span
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: 5,
                  marginTop: 12,
                  color:
                    'var(--primary)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Abrir
                <ArrowRight
                  size={14}
                />
              </span>
            </Link>

            <Link
              to="/dashboard/security"
              className="card"
              style={{
                textDecoration:
                  'none',
                color: 'inherit',
                padding: 16,
              }}
            >
              <span className="service-icon">
                <ShieldCheck
                  size={18}
                />
              </span>

              <span className="section-kicker">
                SECURITY
              </span>

              <h3
                style={{
                  margin:
                    '5px 0 4px',
                  color:
                    'var(--text)',
                  fontSize: 15,
                }}
              >
                Seguridad
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--muted)',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Revisa controles, IAM,
                red, datos y
                recomendaciones.
              </p>

              <span
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: 5,
                  marginTop: 12,
                  color:
                    'var(--primary)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Abrir
                <ArrowRight
                  size={14}
                />
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Arquitectura / seguridad */}
        <motion.div
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <div className="overview-strip executive">
            <div>
              <span className="overview-icon">
                <Net size={20} />
              </span>

              <div>
                <b>
                  Arquitectura
                </b>

                <small>
                  {architectureState}
                </small>
              </div>
            </div>

            <div>
              <span className="overview-icon">
                <Route size={20} />
              </span>

              <div>
                <b>
                  Routing
                </b>

                <small>
                  {hasRoute53
                    ? 'Route 53 activo'
                    : 'Route 53 no seleccionado'}
                </small>
              </div>
            </div>

            <div>
              <span className="overview-icon">
                <Lock size={20} />
              </span>

              <div>
                <b>
                  Identidad
                </b>

                <small>
                  {hasIam
                    ? 'IAM configurado'
                    : 'IAM requiere revisión'}
                </small>
              </div>
            </div>

            <div>
              <span className="overview-icon">
                {security.review === 0 ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle
                    size={20}
                  />
                )}
              </span>

              <div>
                <b>
                  Seguridad
                </b>

                <small>
                  {security.review}{' '}
                  controles por revisar
                </small>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nota final */}
        <motion.div
          className="pricing-note"
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <Sparkles size={18} />

          <div>
            <b>
              Dashboard ejecutivo
            </b>

            <span>
              Toda esta información se genera a
              partir de la simulación activa y se
              mantiene sincronizada con los módulos
              de Costos, Infraestructura, Seguridad,
              Network y Servicios.
            </span>
          </div>
        </motion.div>
      </motion.div>

      {showReport && (
        <ReportModal
          simulation={simulation}
          regionCode={regionCode}
          simulationDate={simulationDate}
          securityScore={security.score}
          securityLabel={security.label}
          architectureState={architectureState}
          architectureFlow={architectureFlow}
          onClose={() => setShowReport(false)}
        />
      )}
    </Page>
  );
}

export default Dashboard;