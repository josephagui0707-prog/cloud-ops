import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  Info,
  Lock,
  Network,
  RefreshCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

import {
  Card,
  Page,
  Title,
  staggerContainer,
  staggerItem,
} from '../components/PageUI';

import { useSimulation } from '../context/SimulationContext';

type SecurityStatus = 'Correcto' | 'Revisión';

type SecurityControl = {
  id: string;
  title: string;
  description: string;
  status: SecurityStatus;
  recommendation: string;
  Icon: typeof CheckCircle2;
};

export function Security() {
  const { simulation } = useSimulation();
  const [showRecommendations, setShowRecommendations] =
    useState(true);

  const selectedServices =
    simulation?.selectedServices ?? [];

  const hasIAM = selectedServices.includes('IAM');
  const hasVPC = selectedServices.includes('VPC');
  const hasS3 = selectedServices.includes('S3');
  const hasRDS = selectedServices.includes('RDS');
  const hasCloudFront =
    selectedServices.includes('CloudFront');

  /*
   * Evaluación simulada.
   *
   * No representa una auditoría real de AWS.
   * El estado se genera a partir de la configuración
   * del escenario actual.
   */
  const controls = useMemo<SecurityControl[]>(() => {
    if (!simulation) {
      return [
        {
          id: 'shared-responsibility',
          title: 'Modelo de responsabilidad compartida',
          description:
            'AWS y el cliente mantienen responsabilidades diferentes dentro del modelo Cloud.',
          status: 'Revisión',
          recommendation:
            'Genera una simulación para evaluar los controles relacionados con la arquitectura.',
          Icon: Shield,
        },
        {
          id: 'iam',
          title: 'IAM y mínimo privilegio',
          description:
            'Usuarios, roles y permisos deben limitarse de acuerdo con la función requerida.',
          status: 'Revisión',
          recommendation:
            'Incluye IAM en la propuesta para representar el control de identidades.',
          Icon: UserRoundCheck,
        },
        {
          id: 'mfa',
          title: 'MFA en cuentas privilegiadas',
          description:
            'La autenticación multifactor añade una capa adicional para cuentas sensibles.',
          status: 'Revisión',
          recommendation:
            'El login de la aplicación tiene dos pasos, pero eso no se considera automáticamente MFA de AWS.',
          Icon: ShieldAlert,
        },
        {
          id: 'data-protection',
          title: 'Protección de datos',
          description:
            'El almacenamiento y tratamiento de datos requiere controles adecuados de protección.',
          status: 'Revisión',
          recommendation:
            'Incluye servicios de almacenamiento o bases de datos y define posteriormente sus controles de protección.',
          Icon: Lock,
        },
        {
          id: 'network',
          title: 'Seguridad de red',
          description:
            'La arquitectura debería incluir una red virtual y segmentación de recursos.',
          status: 'Revisión',
          recommendation:
            'Incluye VPC para representar la red virtual de la solución.',
          Icon: Network,
        },
        {
          id: 'audit',
          title: 'Auditoría y trazabilidad',
          description:
            'Los accesos y acciones importantes deberían poder ser registrados y revisados.',
          status: 'Revisión',
          recommendation:
            'La simulación actual no incluye un servicio específico de auditoría; puede incorporarse como mejora futura.',
          Icon: RefreshCcw,
        },
      ];
    }

    return [
      {
        id: 'shared-responsibility',
        title: 'Modelo de responsabilidad compartida',
        description:
          'La simulación distingue entre responsabilidades del proveedor Cloud y del cliente.',
        status: 'Correcto',
        recommendation:
          'Mantener diferenciadas las responsabilidades de infraestructura y configuración.',
        Icon: ShieldCheck,
      },
      {
        id: 'iam',
        title: 'IAM y mínimo privilegio',
        description: hasIAM
          ? 'IAM está incluido en la propuesta de arquitectura y representa la gestión de identidades y permisos.'
          : 'IAM no está incluido actualmente en la propuesta de arquitectura.',
        status: hasIAM
          ? 'Correcto'
          : 'Revisión',
        recommendation: hasIAM
          ? 'Revisar posteriormente roles y permisos específicos de cada componente.'
          : 'Agregar IAM desde Planificación Cloud para reforzar la representación de identidad y acceso.',
        Icon: UserRoundCheck,
      },
      {
        id: 'mfa',
        title: 'MFA en cuentas privilegiadas',
        description:
          'La autenticación multifactor se considera una medida adicional para cuentas con privilegios elevados.',
        status: 'Revisión',
        recommendation:
          'El login de dos pasos de esta aplicación no implica automáticamente MFA de AWS. Podemos conectar este control con tu módulo de autenticación en una etapa posterior.',
        Icon: ShieldAlert,
      },
      {
        id: 'data-protection',
        title: 'Protección de datos',
        description:
          hasS3 || hasRDS
            ? `La propuesta incluye ${
                hasS3 && hasRDS
                  ? 'S3 y RDS'
                  : hasS3
                  ? 'S3'
                  : 'RDS'
              }, por lo que existe una capa de almacenamiento o datos que debe ser protegida.`
            : 'La propuesta actual no incluye servicios de almacenamiento de objetos ni base de datos.',
        status:
          hasS3 || hasRDS
            ? 'Correcto'
            : 'Revisión',
        recommendation:
          hasS3 || hasRDS
            ? 'Verificar cifrado, gestión de claves, permisos y políticas de acceso en una futura versión.'
            : 'Agregar los servicios de datos necesarios según el escenario de negocio.',
        Icon: Database,
      },
      {
        id: 'network',
        title: 'Seguridad de red',
        description: hasVPC
          ? 'VPC está incluida en la propuesta y representa una red virtual aislada para los recursos Cloud.'
          : 'La propuesta actual no incluye VPC.',
        status: hasVPC
          ? 'Correcto'
          : 'Revisión',
        recommendation: hasVPC
          ? 'Definir posteriormente subredes, rutas y controles de acceso.'
          : 'Agregar VPC desde Planificación para representar la arquitectura de red.',
        Icon: Network,
      },
      {
        id: 'audit',
        title: 'Auditoría y trazabilidad',
        description:
          'La simulación representa un escenario de seguridad, pero no incluye actualmente un servicio específico de auditoría.',
        status: 'Revisión',
        recommendation:
          'Como siguiente mejora se puede agregar un módulo de logging y auditoría al escenario.',
        Icon: RefreshCcw,
      },
    ];
  }, [
    simulation,
    hasIAM,
    hasVPC,
    hasS3,
    hasRDS,
  ]);

  const correctCount = controls.filter(
    (control) => control.status === 'Correcto'
  ).length;

  const reviewCount = controls.length - correctCount;

  const securityScore = useMemo(() => {
    if (!simulation) return 0;

    const score =
      40 + correctCount * 10 - reviewCount * 1;

    return Math.min(100, Math.max(0, score));
  }, [simulation, correctCount, reviewCount]);

  const securityGrade =
    securityScore >= 90
      ? 'A'
      : securityScore >= 80
      ? 'B'
      : securityScore >= 70
      ? 'C'
      : 'D';

  const scoreLabel =
    securityScore >= 90
      ? 'Postura simulada sólida'
      : securityScore >= 80
      ? 'Postura simulada estable'
      : securityScore >= 70
      ? 'Requiere algunas mejoras'
      : 'Requiere atención';

  const recommendationCount =
    controls.filter(
      (control) => control.status === 'Revisión'
    ).length;

  /*
   * Estado vacío
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
            <ShieldCheck size={34} />
          </div>

          <span className="section-kicker">
            SECURITY CENTER
          </span>

          <h1>
            No hay una simulación activa
          </h1>

          <p>
            La postura de seguridad se calcula a partir
            de los servicios incluidos en la simulación
            actual. Primero genera una propuesta en
            Planificación Cloud.
          </p>

          <a
            href="/dashboard/planning"
            className="primary-button"
            style={{
              textDecoration: 'none',
            }}
          >
            <Shield size={17} />
            Configurar simulación
          </a>

          <div className="empty-features">
            <span>
              <UserRoundCheck size={16} />
              IAM
            </span>

            <span>
              <Network size={16} />
              Red
            </span>

            <span>
              <Database size={16} />
              Datos
            </span>

            <span>
              <ShieldCheck size={16} />
              Controles
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
          t="Seguridad"
          s="Evalúa de forma simulada los controles de identidad, datos, red y responsabilidad compartida"
          tag="SECURITY CENTER"
        />

        {/* Escenario activo */}
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
            <b>Servicios</b>{' '}
            {simulation.selectedServices.length}
          </span>

          <span>
            Evaluación simulada
          </span>
        </motion.div>

        {/* Resumen de seguridad */}
        <motion.div
          className="security-summary"
          variants={staggerItem}
        >
          <div>
            <ShieldCheck size={27} />

            <div>
              <b>
                Security posture
              </b>

              <span>
                {correctCount} controles correctos ·{' '}
                {reviewCount} requieren revisión
              </span>

              <small
                style={{
                  display: 'block',
                  marginTop: 4,
                  opacity: 0.76,
                }}
              >
                {scoreLabel}
              </small>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 125,
                height: 8,
                borderRadius: 999,
                overflow: 'hidden',
                background:
                  'rgba(148,163,184,.18)',
              }}
            >
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${securityScore}%`,
                }}
                transition={{
                  duration: 0.9,
                  ease: 'easeOut',
                }}
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background:
                    securityScore >= 80
                      ? '#16A34A'
                      : securityScore >= 70
                      ? '#F59E0B'
                      : '#DC2626',
                }}
              />
            </div>

            <span className="security-grade">
              {securityScore}
            </span>

            <span
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background:
                  'rgba(255,255,255,.12)',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {securityGrade}
            </span>
          </div>
        </motion.div>

        {/* Métricas */}
        <motion.div
          className="stats-grid"
          variants={staggerContainer}
        >
          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <CheckCircle2 size={20} />
              </span>

              <span className="trend positive">
                Activos
              </span>
            </div>

            <span className="stat-label">
              Controles correctos
            </span>

            <strong>
              {correctCount}
            </strong>

            <small>
              De {controls.length} controles evaluados
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon amber">
                <AlertTriangle size={20} />
              </span>

              <span className="trend warning">
                Revisión
              </span>
            </div>

            <span className="stat-label">
              Controles pendientes
            </span>

            <strong>
              {reviewCount}
            </strong>

            <small>
              Recomendaciones de mejora
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <UserRoundCheck size={20} />
              </span>

              <span className="mini-badge">
                IAM
              </span>
            </div>

            <span className="stat-label">
              Gestión de identidad
            </span>

            <strong>
              {hasIAM ? 'Activa' : 'Pendiente'}
            </strong>

            <small>
              {hasIAM
                ? 'IAM incluido en la propuesta'
                : 'IAM no incluido'}
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon blue">
                <Network size={20} />
              </span>

              <span className="mini-badge">
                NETWORK
              </span>
            </div>

            <span className="stat-label">
              Seguridad de red
            </span>

            <strong>
              {hasVPC ? 'Activa' : 'Pendiente'}
            </strong>

            <small>
              {hasVPC
                ? 'VPC incluida en la arquitectura'
                : 'VPC no incluida'}
            </small>
          </Card>
        </motion.div>

        {/* Controles */}
        <motion.div
          className="security-toolbar"
          variants={staggerItem}
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="section-kicker">
              CONTROL ASSESSMENT
            </span>

            <h3
              style={{
                margin: '4px 0 0',
                color: 'var(--text)',
              }}
            >
              Controles de seguridad
            </h3>

            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--muted)',
                fontSize: 12,
              }}
            >
              El estado se calcula según la configuración
              de la simulación actual.
            </p>
          </div>

          <button
            type="button"
            className="mini-badge"
            onClick={() =>
              setShowRecommendations(
                (current) => !current
              )
            }
            style={{
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
            }}
          >
            {showRecommendations
              ? 'Ocultar recomendaciones'
              : 'Mostrar recomendaciones'}
          </button>
        </motion.div>

        <motion.div
          className="security-list"
          variants={staggerContainer}
        >
          {controls.map((control) => {
            const isCorrect =
              control.status === 'Correcto';

            return (
              <motion.div
                variants={staggerItem}
                key={control.id}
              >
                <Card
                  hoverable
                  className="security-card"
                >
                  <span
                    className={
                      isCorrect
                        ? 'security-item-icon green'
                        : 'security-item-icon amber'
                    }
                  >
                    <control.Icon size={20} />
                  </span>

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3>
                        {control.title}
                      </h3>

                      {control.id ===
                        'mfa' && (
                        <span
                          className="mini-badge"
                          style={{
                            fontSize: 9,
                          }}
                        >
                          REVISIÓN MANUAL
                        </span>
                      )}
                    </div>

                    <p>
                      {control.description}
                    </p>

                    {showRecommendations && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 7,
                          alignItems: 'flex-start',
                          marginTop: 9,
                          padding: '9px 10px',
                          borderRadius: 10,
                          background:
                            isCorrect
                              ? 'var(--soft-green)'
                              : 'var(--soft-amber)',
                          color: 'var(--muted)',
                        }}
                      >
                        {isCorrect ? (
                          <CheckCircle2
                            size={14}
                            style={{
                              flexShrink: 0,
                              color:
                                '#16A34A',
                              marginTop: 1,
                            }}
                          />
                        ) : (
                          <AlertTriangle
                            size={14}
                            style={{
                              flexShrink: 0,
                              color:
                                '#F59E0B',
                              marginTop: 1,
                            }}
                          />
                        )}

                        <span
                          style={{
                            fontSize: 11,
                            lineHeight: 1.5,
                          }}
                        >
                          {control.recommendation}
                        </span>
                      </div>
                    )}
                  </div>

                  <span
                    className={
                      isCorrect
                        ? 'status-badge success'
                        : 'status-badge warning'
                    }
                  >
                    {control.status}
                  </span>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Responsabilidad compartida */}
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
                  AWS
                </span>

                <h3>
                  Seguridad de la nube
                </h3>
              </div>

              <Shield size={20} />
            </div>

            <p>
              AWS es responsable de la seguridad de
              la infraestructura subyacente, incluyendo
              instalaciones físicas, hardware y
              componentes administrados que forman
              parte de sus servicios.
            </p>

            <div className="divider" />

            <div
              className="service-function"
            >
              <ShieldCheck size={16} />

              <span>
                <b>
                  Responsabilidad del proveedor
                </b>

                <small>
                  Infraestructura física y servicios
                  Cloud subyacentes.
                </small>
              </span>
            </div>
          </Card>

          <Card hoverable>
            <div className="card-header">
              <div>
                <span className="section-kicker">
                  CLIENTE
                </span>

                <h3>
                  Seguridad en la nube
                </h3>
              </div>

              <Lock size={20} />
            </div>

            <p>
              El cliente mantiene la responsabilidad
              sobre sus datos, identidades, permisos,
              configuraciones, aplicaciones y controles
              que dependen de la arquitectura definida.
            </p>

            <div className="divider" />

            <div
              className="service-function"
            >
              <UserRoundCheck size={16} />

              <span>
                <b>
                  Responsabilidad del cliente
                </b>

                <small>
                  Identidades, datos, permisos y
                  configuración de los recursos.
                </small>
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Componentes de datos */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <div>
            <span className="overview-icon">
              <Database size={20} />
            </span>

            <div>
              <b>Datos</b>

              <small>
                {hasS3 || hasRDS
                  ? 'Servicios de datos incluidos'
                  : 'Sin servicio de datos'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Network size={20} />
            </span>

            <div>
              <b>Red</b>

              <small>
                {hasVPC
                  ? 'VPC configurada'
                  : 'VPC pendiente'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <UserRoundCheck size={20} />
            </span>

            <div>
              <b>Identidades</b>

              <small>
                {hasIAM
                  ? 'IAM configurado'
                  : 'IAM pendiente'}
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <ShieldAlert size={20} />
            </span>

            <div>
              <b>Recomendaciones</b>

              <small>
                {recommendationCount} pendientes
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
              Evaluación simulada
            </b>

            <span>
              La puntuación y los estados de este
              módulo son una representación académica
              basada en la configuración de la
              simulación. No sustituyen una evaluación
              real de seguridad de AWS.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Page>
  );
}

export default Security;