import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  Globe2,
  HardDrive,
  Info,
  Lock,
  Network as Net,
  Route,
  Server,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

import {
  Card,
  Page,
  Title,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';

import { useSimulation } from '../context/SimulationContext';

type ServiceNodeProps = {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  tone?: 'blue' | 'green' | 'amber';
};

function ServiceNode({
  active,
  icon,
  title,
  subtitle,
  description,
  tone = 'blue',
}: ServiceNodeProps) {
  const iconClass =
    tone === 'green'
      ? 'var(--security)'
      : tone === 'amber'
      ? 'var(--cost)'
      : 'var(--primary)';

  return (
    <motion.div
      className={`arch-node ${active ? '' : 'arch-node-disabled'}`}
      whileHover={
        active
          ? {
              y: -3,
            }
          : undefined
      }
      style={{
        opacity: active ? 1 : 0.62,
      }}
    >
      <span
        style={{
          color: active ? iconClass : 'var(--muted-2)',
          background: active
            ? 'var(--soft-blue)'
            : 'var(--fill)',
        }}
      >
        {icon}
      </span>

      <b>{title}</b>

      <small>
        {active ? subtitle : 'No seleccionado'}
      </small>

      <small
        style={{
          marginTop: 1,
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        {description}
      </small>
    </motion.div>
  );
}

function FlowLink() {
  return (
    <div className="animated-link">
      <i />
    </div>
  );
}

function EmptyNetworkState() {
  return (
    <div
      className="dashboard-empty"
      style={{
        minHeight: 430,
      }}
    >
      <div className="empty-icon">
        <Net size={34} />
      </div>

      <span className="section-kicker">
        NETWORK TOPOLOGY
      </span>

      <h1>
        No hay una simulación activa
      </h1>

      <p>
        La arquitectura de red se construye a partir de la
        región, disponibilidad y servicios definidos en
        Planificación Cloud.
      </p>

      <a
        className="primary-button"
        href="/dashboard/planning"
        style={{
          textDecoration: 'none',
        }}
      >
        <Cloud size={17} />
        Configurar arquitectura
      </a>

      <div className="empty-features">
        <span>
          <Globe2 size={16} />
          Internet / Edge
        </span>

        <span>
          <Net size={16} />
          VPC
        </span>

        <span>
          <Server size={16} />
          Compute
        </span>

        <span>
          <Database size={16} />
          Data
        </span>
      </div>
    </div>
  );
}

export function NetworkPage() {
  const { simulation } = useSimulation();

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

  const multiAz =
    simulation?.availability !== 'Estándar';

  const primaryRegion = simulation?.region ?? '';

  const regionCode = useMemo(() => {
    const map: Record<string, string> = {
      'US East (Ohio)': 'us-east-2',
      'Europe (Ireland)': 'eu-west-1',
      'South America (São Paulo)': 'sa-east-1',
    };

    return map[primaryRegion] ?? 'aws-region';
  }, [primaryRegion]);

  const networkScore = useMemo(() => {
    if (!simulation) return 0;

    let score = 40;

    if (hasRoute53) score += 8;
    if (hasCloudFront) score += 10;
    if (hasVpc) score += 12;
    if (hasEc2) score += 8;
    if (hasRds) score += 8;
    if (multiAz) score += 8;
    if (hasIam) score += 6;
    if (hasS3) score += 4;

    return Math.min(100, score);
  }, [
    simulation,
    hasRoute53,
    hasCloudFront,
    hasVpc,
    hasEc2,
    hasRds,
    hasIam,
    hasS3,
    multiAz,
  ]);

  const topologyState = useMemo(() => {
    if (!simulation) return 'Sin configuración';

    const required =
      hasVpc && hasEc2;

    if (
      required &&
      hasRoute53 &&
      hasCloudFront &&
      hasRds &&
      multiAz
    ) {
      return 'Arquitectura completa';
    }

    if (required) {
      return 'Arquitectura funcional';
    }

    return 'Requiere configuración';
  }, [
    simulation,
    hasVpc,
    hasEc2,
    hasRoute53,
    hasCloudFront,
    hasRds,
    multiAz,
  ]);

  if (!simulation) {
    return (
      <Page>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <Title
            t="Arquitectura de Red"
            s="Diagrama lógico de una solución web segura y segmentada sobre AWS"
            tag="NETWORK TOPOLOGY"
          />

          <EmptyNetworkState />
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
          t="Arquitectura de Red"
          s="Diagrama lógico de la arquitectura generada a partir de la simulación Cloud activa"
          tag="NETWORK TOPOLOGY"
        />

        {/* Información del escenario */}
        <motion.div
          className="simulation-meta-strip"
          variants={staggerItem}
        >
          <span>
            <b>Escenario</b>{' '}
            {simulation.name}
          </span>

          <span>
            <b>Región</b>{' '}
            {simulation.region}
          </span>

          <span>
            <b>Disponibilidad</b>{' '}
            {simulation.availability}
          </span>

          <span>
            <b>Estado</b>{' '}
            {topologyState}
          </span>
        </motion.div>

        {/* Indicadores */}
        <motion.div
          className="stats-grid"
          variants={staggerContainer}
        >
          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Net size={20} />
              </span>

              <span
                className={
                  hasVpc
                    ? 'trend positive'
                    : 'trend warning'
                }
              >
                {hasVpc ? 'Activo' : 'Pendiente'}
              </span>
            </div>

            <span className="stat-label">
              Red virtual
            </span>

            <strong>
              {hasVpc ? 'VPC' : '—'}
            </strong>

            <small>
              {hasVpc
                ? 'Segmentación disponible'
                : 'VPC no seleccionada'}
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Server size={20} />
              </span>

              <span
                className={
                  hasEc2
                    ? 'trend positive'
                    : 'trend warning'
                }
              >
                {hasEc2 ? 'Activo' : 'Pendiente'}
              </span>
            </div>

            <span className="stat-label">
              Compute
            </span>

            <strong>
              {hasEc2 ? 'EC2' : '—'}
            </strong>

            <small>
              {hasEc2
                ? 'Capa de aplicación'
                : 'EC2 no seleccionado'}
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <Database size={20} />
              </span>

              <span
                className={
                  hasRds
                    ? 'trend positive'
                    : 'trend warning'
                }
              >
                {hasRds ? 'Activo' : 'Pendiente'}
              </span>
            </div>

            <span className="stat-label">
              Base de datos
            </span>

            <strong>
              {hasRds ? 'RDS' : '—'}
            </strong>

            <small>
              {hasRds
                ? 'Capa privada de datos'
                : 'RDS no seleccionado'}
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon amber">
                <ShieldCheck size={20} />
              </span>

              <span className="mini-badge">
                SCORE
              </span>
            </div>

            <span className="stat-label">
              Cobertura de arquitectura
            </span>

            <strong>
              {networkScore}
            </strong>

            <small>
              Configuración simulada de red
            </small>
          </Card>
        </motion.div>

        {/* Arquitectura */}
        <Card
          className="network-card pro-network"
          variants={staggerItem}
        >
          <div className="network-toolbar">
            <div>
              <span className="section-kicker">
                REFERENCE ARCHITECTURE
              </span>

              <h3>
                Flujo de tráfico y segmentación
              </h3>

              <p>
                Internet
                {hasRoute53
                  ? ' → Route 53'
                  : ' → DNS no configurado'}
                {hasCloudFront
                  ? ' → CloudFront'
                  : ' → CDN no configurado'}
                {hasVpc
                  ? ' → VPC'
                  : ' → VPC no seleccionada'}
                {hasEc2
                  ? ' → EC2'
                  : ' → EC2 no seleccionado'}
                {hasRds
                  ? ' → RDS'
                  : ''}
              </p>
            </div>

            <span
              className={
                topologyState ===
                'Arquitectura completa'
                  ? 'status-badge success'
                  : topologyState ===
                    'Arquitectura funcional'
                  ? 'status-badge success'
                  : 'status-badge warning'
              }
            >
              {topologyState}
            </span>
          </div>

          <div className="arch-canvas">
            {/* Edge / tráfico público */}
            <div className="edge-flow">
              <ServiceNode
                active
                icon={<Globe2 size={23} />}
                title="Internet"
                subtitle="Usuarios"
                description={`${simulation.users.toLocaleString()} usuarios estimados`}
              />

              <FlowLink />

              <ServiceNode
                active={hasRoute53}
                icon={<Route size={23} />}
                title="Route 53"
                subtitle="DNS"
                description="Resolución de nombres"
              />

              <FlowLink />

              <ServiceNode
                active={hasCloudFront}
                icon={<Cloud size={23} />}
                title="CloudFront"
                subtitle="CDN / Edge"
                description="Distribución global"
              />
            </div>

            {/* VPC */}
            <div
              className="vpc-boundary"
              style={{
                opacity: hasVpc ? 1 : 0.78,
                boxShadow: hasVpc
                  ? undefined
                  : 'inset 0 0 0 2px rgba(245,158,11,.24)',
              }}
            >
              <div className="vpc-header">
                <div>
                  <span>
                    <Net size={18} />
                  </span>

                  <div>
                    <b>
                      Amazon VPC
                    </b>

                    <small>
                      {hasVpc
                        ? `10.0.0.0/16 · ${primaryRegion}`
                        : 'No seleccionada en la simulación'}
                    </small>
                  </div>
                </div>

                <span className="mini-badge">
                  {hasVpc
                    ? 'Aislamiento lógico'
                    : 'Requiere VPC'}
                </span>
              </div>

              {/* Availability Zones */}
              <div
                className="az-grid"
                style={{
                  gridTemplateColumns:
                    multiAz
                      ? '1fr 1fr'
                      : '1fr',
                }}
              >
                {/* AZ A */}
                <div className="az-box">
                  <div className="az-title">
                    Availability Zone A
                    <small>
                      {regionCode}a
                    </small>
                  </div>

                  <div className="subnet public">
                    <span className="subnet-label">
                      Public Subnet · 10.0.1.0/24
                    </span>

                    <motion.div
                      className={`resource-node ${
                        hasEc2
                          ? ''
                          : 'arch-node-disabled'
                      }`}
                      whileHover={
                        hasEc2
                          ? {
                              scale: 1.02,
                            }
                          : undefined
                      }
                      style={{
                        opacity: hasEc2
                          ? 1
                          : 0.58,
                      }}
                    >
                      <span>
                        <Server size={19} />
                      </span>

                      <div>
                        <b>
                          {hasEc2
                            ? 'EC2 Web/App A'
                            : 'EC2 no seleccionado'}
                        </b>

                        <small>
                          {hasEc2
                            ? 'Security Group: web-sg'
                            : 'Recurso no incluido'}
                        </small>
                      </div>
                    </motion.div>
                  </div>

                  <div className="subnet private">
                    <span className="subnet-label">
                      Private DB Subnet · 10.0.11.0/24
                    </span>

                    <motion.div
                      className={`resource-node database ${
                        hasRds
                          ? ''
                          : 'arch-node-disabled'
                      }`}
                      whileHover={
                        hasRds
                          ? {
                              scale: 1.02,
                            }
                          : undefined
                      }
                      style={{
                        opacity: hasRds
                          ? 1
                          : 0.58,
                      }}
                    >
                      <span>
                        <Database size={19} />
                      </span>

                      <div>
                        <b>
                          {hasRds
                            ? 'RDS Primary'
                            : 'RDS no seleccionado'}
                        </b>

                        <small>
                          {hasRds
                            ? 'Sin IP pública'
                            : 'Recurso no incluido'}
                        </small>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* AZ B */}
                {multiAz && (
                  <div className="az-box">
                    <div className="az-title">
                      Availability Zone B
                      <small>
                        {regionCode}b
                      </small>
                    </div>

                    <div className="subnet public">
                      <span className="subnet-label">
                        Public Subnet · 10.0.2.0/24
                      </span>

                      <motion.div
                        className={`resource-node ${
                          hasEc2
                            ? ''
                            : 'arch-node-disabled'
                        }`}
                        whileHover={
                          hasEc2
                            ? {
                                scale: 1.02,
                              }
                            : undefined
                        }
                        style={{
                          opacity: hasEc2
                            ? 1
                            : 0.58,
                        }}
                      >
                        <span>
                          <Server size={19} />
                        </span>

                        <div>
                          <b>
                            {hasEc2
                              ? 'EC2 Web/App B'
                              : 'EC2 no seleccionado'}
                          </b>

                          <small>
                            {hasEc2
                              ? 'Alta disponibilidad'
                              : 'Recurso no incluido'}
                          </small>
                        </div>
                      </motion.div>
                    </div>

                    <div className="subnet private">
                      <span className="subnet-label">
                        Private DB Subnet · 10.0.12.0/24
                      </span>

                      <motion.div
                        className={`resource-node database standby ${
                          hasRds
                            ? ''
                            : 'arch-node-disabled'
                        }`}
                        whileHover={
                          hasRds
                            ? {
                                scale: 1.02,
                              }
                            : undefined
                        }
                        style={{
                          opacity: hasRds
                            ? 1
                            : 0.58,
                        }}
                      >
                        <span>
                          <Database size={19} />
                        </span>

                        <div>
                          <b>
                            {hasRds
                              ? 'RDS Standby'
                              : 'RDS no seleccionado'}
                          </b>

                          <small>
                            {hasRds
                              ? 'Replica Multi-AZ'
                              : 'Recurso no incluido'}
                          </small>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>

              {/* Flujo interno */}
              <div className="vpc-flow-line">
                <span>
                  {hasCloudFront
                    ? 'CloudFront entrega tráfico hacia la capa de aplicación.'
                    : 'La capa Edge no está incluida actualmente.'}
                </span>

                <ArrowRight size={16} />

                <span>
                  {hasEc2 && hasRds
                    ? 'EC2 accede a RDS mediante la red privada.'
                    : hasEc2
                    ? 'EC2 queda como capa de aplicación.'
                    : 'No existe una capa de aplicación configurada.'}
                </span>
              </div>
            </div>

            {/* Servicios fuera del flujo principal */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: 12,
                marginTop: 14,
              }}
            >
              {/* S3 */}
              <motion.div
                className="resource-node"
                whileHover={
                  hasS3
                    ? {
                        y: -2,
                      }
                    : undefined
                }
                style={{
                  opacity: hasS3 ? 1 : 0.5,
                  background:
                    hasS3
                      ? 'var(--card)'
                      : 'var(--fill)',
                }}
              >
                <span>
                  <HardDrive size={19} />
                </span>

                <div>
                  <b>
                    {hasS3
                      ? 'Amazon S3'
                      : 'S3 no seleccionado'}
                  </b>

                  <small>
                    {hasS3
                      ? 'Almacenamiento de objetos · acceso mediante capa de red'
                      : 'Servicio no incluido en la simulación'}
                  </small>
                </div>
              </motion.div>

              {/* IAM */}
              <motion.div
                className="resource-node"
                whileHover={
                  hasIam
                    ? {
                        y: -2,
                      }
                    : undefined
                }
                style={{
                  opacity: hasIam ? 1 : 0.5,
                  background:
                    hasIam
                      ? 'var(--card)'
                      : 'var(--fill)',
                }}
              >
                <span
                  style={{
                    background: hasIam
                      ? 'var(--soft-green)'
                      : 'var(--fill)',
                    color: hasIam
                      ? 'var(--security)'
                      : 'var(--muted-2)',
                  }}
                >
                  <Lock size={19} />
                </span>

                <div>
                  <b>
                    {hasIam
                      ? 'IAM'
                      : 'IAM no seleccionado'}
                  </b>

                  <small>
                    {hasIam
                      ? 'Control global de identidades y permisos'
                      : 'Control de identidad no incluido'}
                  </small>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Insights */}
          <div className="network-insights">
            <div>
              {hasVpc && hasRds ? (
                <ShieldCheck size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}

              <span>
                <b>Segmentación</b>

                <small>
                  {hasVpc && hasRds
                    ? 'Base de datos representada en una subred privada.'
                    : 'Selecciona VPC y RDS para representar una capa de datos privada.'}
                </small>
              </span>
            </div>

            <div>
              {multiAz && hasEc2 && hasRds ? (
                <CheckCircle2 size={18} />
              ) : (
                <Activity size={18} />
              )}

              <span>
                <b>Alta disponibilidad</b>

                <small>
                  {multiAz && hasEc2 && hasRds
                    ? 'Compute y datos distribuidos entre dos Availability Zones.'
                    : 'La simulación actual no representa una arquitectura Multi-AZ completa.'}
                </small>
              </span>
            </div>

            <div>
              {hasCloudFront ? (
                <Zap size={18} />
              ) : (
                <Info size={18} />
              )}

              <span>
                <b>Entrega global</b>

                <small>
                  {hasCloudFront
                    ? 'CloudFront se encuentra en la capa Edge antes de la VPC.'
                    : 'CloudFront no está incluido en la simulación actual.'}
                </small>
              </span>
            </div>
          </div>
        </Card>

        {/* Componentes de la arquitectura */}
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
                  TRAFFIC FLOW
                </span>

                <h3>
                  Flujo de entrada
                </h3>
              </div>

              <Globe2 size={20} />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 9,
              }}
            >
              <div className="service-function">
                <Globe2 size={16} />

                <span>
                  <b>Internet</b>

                  <small>
                    Punto de entrada de los
                    usuarios hacia la solución.
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Route size={16} />

                <span>
                  <b>
                    {hasRoute53
                      ? 'Route 53 activo'
                      : 'Route 53 pendiente'}
                  </b>

                  <small>
                    {hasRoute53
                      ? 'Resolución DNS de la arquitectura.'
                      : 'No forma parte del escenario actual.'}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Cloud size={16} />

                <span>
                  <b>
                    {hasCloudFront
                      ? 'CloudFront activo'
                      : 'CloudFront pendiente'}
                  </b>

                  <small>
                    {hasCloudFront
                      ? 'Capa Edge para distribución de contenido.'
                      : 'No forma parte del escenario actual.'}
                  </small>
                </span>
              </div>
            </div>
          </Card>

          <Card hoverable>
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  PRIVATE LAYER
                </span>

                <h3>
                  Recursos internos
                </h3>
              </div>

              <Lock size={20} />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 9,
              }}
            >
              <div className="service-function">
                <Server size={16} />

                <span>
                  <b>
                    {hasEc2
                      ? 'EC2'
                      : 'EC2 no incluido'}
                  </b>

                  <small>
                    {hasEc2
                      ? 'Capa de aplicación dentro de la VPC.'
                      : 'No existe un recurso de cómputo en este escenario.'}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Database size={16} />

                <span>
                  <b>
                    {hasRds
                      ? 'RDS'
                      : 'RDS no incluido'}
                  </b>

                  <small>
                    {hasRds
                      ? 'Base de datos representada en la red privada.'
                      : 'No existe una base de datos administrada en este escenario.'}
                  </small>
                </span>
              </div>

              <div className="service-function">
                <Net size={16} />

                <span>
                  <b>
                    {hasVpc
                      ? 'VPC'
                      : 'VPC no incluida'}
                  </b>

                  <small>
                    {hasVpc
                      ? `Red virtual ${regionCode}`
                      : 'No existe segmentación de red configurada.'}
                  </small>
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Estado final */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <div>
            <span className="overview-icon">
              <Net size={20} />
            </span>

            <div>
              <b>VPC</b>

              <small>
                {hasVpc
                  ? 'Configurada'
                  : 'Pendiente'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Server size={20} />
            </span>

            <div>
              <b>Compute</b>

              <small>
                {hasEc2
                  ? 'EC2 configurado'
                  : 'No configurado'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Database size={20} />
            </span>

            <div>
              <b>Data</b>

              <small>
                {hasRds
                  ? 'RDS configurado'
                  : hasS3
                  ? 'S3 configurado'
                  : 'Sin servicio de datos'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Users size={20} />
            </span>

            <div>
              <b>Disponibilidad</b>

              <small>
                {multiAz
                  ? 'Multi-AZ'
                  : 'Una AZ'}
              </small>
            </div>
          </div>
        </motion.div>

        {/* Nota */}
        <motion.div
          className="pricing-note"
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <Info size={18} />

          <div>
            <b>
              Arquitectura simulada
            </b>

            <span>
              Los nodos representan una propuesta
              lógica de arquitectura Cloud y no una
              infraestructura AWS desplegada realmente.
              La topología se genera según la
              configuración de la simulación activa.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Page>
  );
}

export default NetworkPage;