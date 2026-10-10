import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Database,
  Globe2,
  HardDrive,
  Layers3,
  MapPinned,
  Server,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';

import {
  Card,
  Page,
  Title,
  usd,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';

import { useSimulation } from '../context/SimulationContext';

type RegionDefinition = {
  name: string;
  code: string;
  location: string;
  continent: string;
};

const regions: RegionDefinition[] = [
  {
    name: 'US East (Ohio)',
    code: 'us-east-2',
    location: 'Columbus, Estados Unidos',
    continent: 'Norteamérica',
  },
  {
    name: 'Europe (Ireland)',
    code: 'eu-west-1',
    location: 'Dublín, Irlanda',
    continent: 'Europa',
  },
  {
    name: 'South America (São Paulo)',
    code: 'sa-east-1',
    location: 'São Paulo, Brasil',
    continent: 'Sudamérica',
  },
];

const getServiceIcon = (service: string) => {
  switch (service) {
    case 'EC2':
      return Server;

    case 'S3':
      return HardDrive;

    case 'RDS':
      return Database;

    case 'IAM':
      return ShieldCheck;

    case 'VPC':
      return Cloud;

    case 'Route 53':
      return MapPinned;

    case 'CloudFront':
      return Globe2;

    default:
      return Boxes;
  }
};

const formatRegionName = (region: string) => {
  return region
    .replace('US East ', '')
    .replace('Europe ', '')
    .replace('South America ', '');
};

export function Infrastructure() {
  const { simulation } = useSimulation();

  const primaryRegion = useMemo(() => {
    if (!simulation) return regions[0];

    return (
      regions.find(
        (region) => region.name === simulation.region
      ) ?? regions[0]
    );
  }, [simulation]);

  const alternativeRegions = useMemo(
    () =>
      regions.filter(
        (region) => region.name !== primaryRegion.name
      ),
    [primaryRegion]
  );

  const totalConfiguredUnits = useMemo(() => {
    if (!simulation) return 0;

    return simulation.costItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [simulation]);

  const costServices = useMemo(() => {
    if (!simulation) return 0;

    return simulation.costItems.filter(
      (item) => item.monthly > 0
    ).length;
  }, [simulation]);

  const availabilityLabel =
    simulation?.availability ?? 'Sin configuración';

  const serviceCount =
    simulation?.selectedServices.length ?? 0;

  /*
   * Estado vacío si todavía no existe una simulación.
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
            <Globe2 size={34} />
          </div>

          <span className="section-kicker">
            AWS GLOBAL INFRASTRUCTURE
          </span>

          <h1>
            No hay una infraestructura configurada
          </h1>

          <p>
            La infraestructura global se genera a partir
            de la simulación creada en Planificación.
            Selecciona una región y servicios para
            visualizar el escenario.
          </p>

          <a
            className="primary-button"
            href="/dashboard/planning"
          >
            <Cloud size={17} />
            Configurar infraestructura
          </a>

          <div className="empty-features">
            <span>
              <Globe2 size={16} />
              Región principal
            </span>

            <span>
              <Boxes size={16} />
              Servicios desplegados
            </span>

            <span>
              <Activity size={16} />
              Estado de infraestructura
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
          t="Infraestructura Global"
          s="Visualiza la región principal, los servicios considerados y el alcance de la solución Cloud"
          tag="AWS GLOBAL INFRASTRUCTURE"
        />

        {/* Contexto de la simulación */}
        <motion.div
          className="simulation-meta-strip"
          variants={staggerItem}
        >
          <span>
            <b>Escenario</b> {simulation.name}
          </span>

          <span>
            <b>Región principal</b>{' '}
            {simulation.region}
          </span>

          <span>
            {serviceCount} servicios configurados
          </span>

          <span>
            {simulation.users.toLocaleString()} usuarios
          </span>
        </motion.div>

        {/* Indicadores principales */}
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
                <Globe2 size={20} />
              </span>

              <span className="trend positive">
                <CheckCircle2 size={14} />
                Activa
              </span>
            </div>

            <span className="stat-label">
              Región principal
            </span>

            <strong
              className="security-value"
            >
              {primaryRegion.code}
            </strong>

            <small>
              {formatRegionName(
                primaryRegion.name
              )}
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Boxes size={20} />
              </span>

              <span className="mini-badge">
                Simulado
              </span>
            </div>

            <span className="stat-label">
              Servicios considerados
            </span>

            <strong>
              {serviceCount}
            </strong>

            <small>
              Dentro del escenario actual
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <Users size={20} />
              </span>

              <span className="trend positive">
                <CheckCircle2 size={14} />
                Planificado
              </span>
            </div>

            <span className="stat-label">
              Usuarios estimados
            </span>

            <strong>
              {simulation.users.toLocaleString()}
            </strong>

            <small>
              Carga estimada de la solución
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon amber">
                <CircleDollarSign size={20} />
              </span>

              <span className="mini-badge">
                Mensual
              </span>
            </div>

            <span className="stat-label">
              Costo de la infraestructura
            </span>

            <strong>
              {usd(simulation.monthlyCost)}
            </strong>

            <small>
              Proyección anual:{' '}
              {usd(simulation.annualCost)}
            </small>
          </Card>
        </motion.div>

        {/* Región principal */}
        <motion.div
          className="content-grid"
          variants={staggerContainer}
        >
          <Card className="chart-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  PRIMARY REGION
                </span>

                <h3>
                  {primaryRegion.name}
                </h3>

                <p>
                  Región seleccionada para la
                  solución Cloud actual.
                </p>
              </div>

              <span className="status-badge success">
                Operativa
              </span>
            </div>

            <div className="region-detail-grid">
              <div className="region-detail-item">
                <span>Ubicación: </span>
                <strong>
                  {primaryRegion.location}
                </strong>
              </div>

              <div className="region-detail-item">
                <span>Continente: </span>
                <strong>
                  {primaryRegion.continent}
                </strong>
              </div>

              <div className="region-detail-item">
                <span>Código de región: </span>
                <strong>
                  {primaryRegion.code}
                </strong>
              </div>

              <div className="region-detail-item">
                <span>Disponibilidad requerida: </span>
                <strong>
                  {availabilityLabel}
                </strong>
              </div>
            </div>

            <div className="divider" />

            <div className="card-header">
              <div>
                <span className="section-kicker">
                  DEPLOYED SERVICES
                </span>

                <h3>
                  Servicios de la simulación
                </h3>
              </div>

              <span className="mini-badge">
                {serviceCount} seleccionados
              </span>
            </div>

            {simulation.selectedServices.length > 0 ? (
              <div className="service-grid">
                {simulation.selectedServices.map(
                  (service) => {
                    const Icon =
                      getServiceIcon(service);

                    return (
                      <motion.div
                        className="card service-card premium"
                        key={service}
                        whileHover={{
                          y: -3,
                        }}
                      >
                        <div className="service-card-top">
                          <span className="service-icon">
                            <Icon size={18} />
                          </span>

                          <span className="status-badge success">
                            Activo
                          </span>
                        </div>

                        <span className="section-kicker">
                          AWS SERVICE
                        </span>

                        <h3>
                          {service}
                        </h3>

                        <p>
                          Servicio considerado
                          dentro de la
                          infraestructura de
                          esta simulación.
                        </p>
                      </motion.div>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                className="dashboard-empty"
                style={{
                  minHeight: 180,
                  marginTop: 14,
                }}
              >
                <div className="empty-icon">
                  <Boxes size={26} />
                </div>

                <h1
                  style={{
                    fontSize: 20,
                  }}
                >
                  Sin servicios configurados
                </h1>

                <p
                  style={{
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  La simulación actual no tiene
                  servicios Cloud seleccionados.
                </p>
              </div>
            )}
          </Card>

          {/* Resumen de infraestructura */}
          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            <Card className="region-card premium">
              <div className="region-top">
                <span className="region-icon">
                  <Layers3 size={21} />
                </span>

                <span className="status-badge success">
                  Configurado
                </span>
              </div>

              <span className="section-kicker">
                INFRASTRUCTURE PROFILE
              </span>

              <h3>
                Alcance del escenario
              </h3>

              <p>
                Resumen de los componentes y
                condiciones definidas en la
                planificación.
              </p>

              <div className="divider" />

              <small>
                SERVICIOS
              </small>

              <b>
                {serviceCount} servicios
              </b>

              <small>
                UNIDADES DE CONSUMO
              </small>

              <b>
                {totalConfiguredUnits.toLocaleString()}
              </b>

              <small>
                SERVICIOS CON COSTO
              </small>

              <b>
                {costServices}
              </b>
            </Card>

            <Card className="region-card premium">
              <div className="region-top">
                <span className="region-icon">
                  <Activity size={21} />
                </span>

                <span className="status-badge success">
                  Estable
                </span>
              </div>

              <span className="section-kicker">
                AVAILABILITY
              </span>

              <h3>
                {simulation.availability}
              </h3>

              <p>
                Nivel de disponibilidad requerido
                para la solución configurada.
              </p>

              <div className="divider" />

              <small>
                OBJETIVO
              </small>

              <b>
                {simulation.objective}
              </b>

              <small>
                REGIÓN
              </small>

              <span className="service-list-text">
                {primaryRegion.code}
              </span>
            </Card>
          </div>
        </motion.div>

        {/* Regiones alternativas */}
        <motion.div
          style={{ marginTop: 16 }}
          variants={staggerItem}
        >
          <div
            className="card-header"
            style={{
              marginBottom: 14,
            }}
          >
            <div>
              <span className="section-kicker">
                GLOBAL OPTIONS
              </span>

              <h3>
                Regiones alternativas
              </h3>

              <p>
                Otras regiones contempladas como
                posibles ubicaciones para futuras
                expansiones de la solución.
              </p>
            </div>

            <span className="mini-badge">
              No desplegadas
            </span>
          </div>

          <div className="region-grid">
            {alternativeRegions.map(
              (region) => (
                <Card
                  hoverable
                  className="region-card premium"
                  key={region.code}
                >
                  <div className="region-top">
                    <span className="region-icon">
                      <Globe2 size={21} />
                    </span>

                    <span className="status-badge warning">
                      Disponible
                    </span>
                  </div>

                  <span className="section-kicker">
                    {region.code}
                  </span>

                  <h3>
                    {region.name}
                  </h3>

                  <p>
                    {region.location}
                  </p>

                  <div className="divider" />

                  <small>
                    ROL
                  </small>

                  <b>
                    Región alternativa
                  </b>

                  <small>
                    SERVICIOS
                  </small>

                  <span className="service-list-text">
                    No desplegados en la
                    simulación actual
                  </span>
                </Card>
              )
            )}
          </div>
        </motion.div>

        {/* Resumen final */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
          style={{ marginTop: 16 }}
        >
          <div>
            <span className="overview-icon">
              <Globe2 size={20} />
            </span>

            <div>
              <b>Región activa</b>

              <small>
                {primaryRegion.name}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Boxes size={20} />
            </span>

            <div>
              <b>Servicios</b>

              <small>
                {serviceCount} configurados
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Users size={20} />
            </span>

            <div>
              <b>Capacidad estimada</b>

              <small>
                {simulation.users.toLocaleString()}{' '}
                usuarios
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <CircleDollarSign size={20} />
            </span>

            <div>
              <b>Inversión simulada</b>

              <small>
                {usd(simulation.monthlyCost)} / mes
              </small>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Page>
  );
}
export default Infrastructure;