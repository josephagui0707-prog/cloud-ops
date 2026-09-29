import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Info,
  Network,
  Route,
  Search,
  Server,
  Shield,
  X,
} from 'lucide-react';

import {
  Card,
  Page,
  Title,
  usd,
  services,
  staggerContainer,
  staggerItem,
  cardHover,
  tapScale,
} from '../components/PageUI';

import { useSimulation } from '../context/SimulationContext';

type FilterMode = 'all' | 'selected' | 'available';

type ServiceRecord = {
  name: string;
  category: string;
  description: string;
  Icon: typeof Cpu;
};

const serviceRecords: ServiceRecord[] = services.map(
  ([name, category, description, Icon]) => ({
    name,
    category,
    description,
    Icon,
  })
);

const getServiceDetails = (
  name: string,
  monthlyCost: number,
  costDetail?: string,
  usage?: string
) => {
  const details: Record<
    string,
    {
      role: string;
      scope: string;
      examples: string;
    }
  > = {
    EC2: {
      role: 'Computación',
      scope: 'Ejecuta servidores virtuales y cargas de trabajo de aplicaciones.',
      examples:
        'Aplicaciones web, APIs, procesos backend y cargas de cómputo.',
    },

    S3: {
      role: 'Almacenamiento',
      scope: 'Almacena objetos y archivos de forma escalable.',
      examples:
        'Archivos, imágenes, documentos, backups y datos estáticos.',
    },

    RDS: {
      role: 'Base de datos',
      scope:
        'Proporciona una base de datos relacional administrada.',
      examples:
        'Aplicaciones empresariales, sistemas transaccionales y datos estructurados.',
    },

    IAM: {
      role: 'Seguridad',
      scope:
        'Administra identidades, usuarios, grupos y permisos de acceso.',
      examples:
        'Control de acceso, políticas, usuarios administrativos y roles.',
    },

    VPC: {
      role: 'Networking',
      scope:
        'Permite definir una red virtual aislada para los recursos Cloud.',
      examples:
        'Subredes, segmentación, rutas y controles de red.',
    },

    'Route 53': {
      role: 'DNS',
      scope:
        'Gestiona resolución DNS y direccionamiento de nombres de dominio.',
      examples:
        'Dominios, health checks y direccionamiento hacia servicios.',
    },

    CloudFront: {
      role: 'Distribución',
      scope:
        'Distribuye contenido mediante una red global de entrega.',
      examples:
        'Contenido web, archivos estáticos y distribución de contenido.',
    },
  };

  const base = details[name] ?? {
    role: 'Servicio Cloud',
    scope: 'Servicio considerado dentro de la arquitectura.',
    examples: 'Uso definido por la simulación.',
  };

  return {
    ...base,
    monthlyCost,
    costDetail,
    usage,
  };
};

export function Services() {
  const { simulation } = useSimulation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [filterMode, setFilterMode] =
    useState<FilterMode>('all');
  const [selectedServiceName, setSelectedServiceName] =
    useState<string | null>(null);

  const categories = useMemo(
    () => [
      'Todas',
      ...Array.from(
        new Set(
          serviceRecords.map((service) => service.category)
        )
      ),
    ],
    []
  );

  const selectedCount =
    simulation?.selectedServices.length ?? 0;

  const availableCount =
    serviceRecords.length - selectedCount;

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return serviceRecords.filter((service) => {
      const isSelected =
        simulation?.selectedServices.includes(
          service.name
        ) ?? false;

      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query);

      const matchesCategory =
        category === 'Todas' ||
        service.category === category;

      const matchesMode =
        filterMode === 'all' ||
        (filterMode === 'selected' && isSelected) ||
        (filterMode === 'available' && !isSelected);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMode
      );
    });
  }, [
    search,
    category,
    filterMode,
    simulation,
  ]);

  const selectedService = useMemo(() => {
    if (!selectedServiceName) return null;

    return (
      serviceRecords.find(
        (service) =>
          service.name === selectedServiceName
      ) ?? null
    );
  }, [selectedServiceName]);

  const selectedServiceCost = useMemo(() => {
    if (!selectedServiceName || !simulation) {
      return null;
    }

    return (
      simulation.costItems.find(
        (item) =>
          item.service === selectedServiceName
      ) ?? null
    );
  }, [selectedServiceName, simulation]);

  const detail = selectedService
    ? getServiceDetails(
        selectedService.name,
        selectedServiceCost?.monthly ?? 0,
        selectedServiceCost?.detail,
        selectedServiceCost?.usage
      )
    : null;

  return (
    <Page>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <Title
          t="Servicios AWS"
          s="Catálogo técnico de los servicios disponibles y su participación en la arquitectura Cloud"
          tag="SERVICE CATALOG"
        />

        {/* Información de la simulación */}
        {simulation ? (
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
              <b>Seleccionados</b>{' '}
              {selectedCount} de {serviceRecords.length}
            </span>

            <span>
              <b>Costo</b>{' '}
              {usd(simulation.monthlyCost)} / mes
            </span>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerItem}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '14px 16px',
              marginBottom: 18,
              border: '1px solid var(--border)',
              borderRadius: 14,
              background: 'var(--card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--soft-blue)',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Info size={18} />
              </span>

              <div>
                <strong
                  style={{
                    display: 'block',
                    color: 'var(--text)',
                    fontSize: 13,
                  }}
                >
                  No hay una simulación activa
                </strong>

                <span
                  style={{
                    display: 'block',
                    marginTop: 2,
                    color: 'var(--muted)',
                    fontSize: 12,
                  }}
                >
                  El catálogo funciona normalmente,
                  pero ningún servicio está marcado
                  como parte de una propuesta.
                </span>
              </div>
            </div>

            <a
              href="/dashboard/planning"
              className="primary-button"
              style={{
                textDecoration: 'none',
              }}
            >
              Configurar simulación
            </a>
          </motion.div>
        )}

        {/* Resumen del catálogo */}
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
                <Server size={20} />
              </span>

              <span className="mini-badge">
                AWS
              </span>
            </div>

            <span className="stat-label">
              Servicios disponibles
            </span>

            <strong>
              {serviceRecords.length}
            </strong>

            <small>
              Catálogo de la simulación
            </small>
          </Card>

          <Card
            className="stat-card premium"
            hoverable
          >
            <div className="stat-top">
              <span className="stat-icon green">
                <CheckCircle2 size={20} />
              </span>

              <span className="trend positive">
                <CheckCircle2 size={14} />
                Seleccionados
              </span>
            </div>

            <span className="stat-label">
              Servicios en propuesta
            </span>

            <strong>
              {selectedCount}
            </strong>

            <small>
              Parte de la arquitectura actual
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
                Categorías
              </span>
            </div>

            <span className="stat-label">
              Categorías disponibles
            </span>

            <strong>
              {categories.length - 1}
            </strong>

            <small>
              Compute, Storage, Database,
              Networking y Security
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
                Simulado
              </span>
            </div>

            <span className="stat-label">
              Costo mensual de propuesta
            </span>

            <strong>
              {simulation
                ? usd(simulation.monthlyCost)
                : usd(0)}
            </strong>

            <small>
              Según los servicios seleccionados
            </small>
          </Card>
        </motion.div>

        {/* Barra de búsqueda y filtros */}
        <motion.div
          className="service-toolbar"
          variants={staggerItem}
          style={{
            marginTop: 16,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 10,
              width: '100%',
            }}
          >
            <div className="search-box">
              <Search size={18} />

              <input
                placeholder="Buscar servicio, categoría o función..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 7,
              }}
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCategory(item)
                  }
                  style={{
                    border:
                      category === item
                        ? '1px solid #2563EB'
                        : '1px solid var(--border)',
                    background:
                      category === item
                        ? 'var(--soft-blue)'
                        : 'var(--card)',
                    color:
                      category === item
                        ? 'var(--primary)'
                        : 'var(--muted)',
                    borderRadius: 999,
                    padding: '7px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition:
                      'all .18s ease',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 7,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              minWidth: 280,
              justifyContent: 'flex-end',
            }}
          >
            {[
              ['all', 'Todos'],
              ['selected', 'Seleccionados'],
              ['available', 'No seleccionados'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilterMode(
                    value as FilterMode
                  )
                }
                style={{
                  border:
                    filterMode === value
                      ? '1px solid #2563EB'
                      : '1px solid var(--border)',
                  background:
                    filterMode === value
                      ? 'var(--soft-blue)'
                      : 'var(--card)',
                  color:
                    filterMode === value
                      ? 'var(--primary)'
                      : 'var(--muted)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}

            <span
              className="mini-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 34,
              }}
            >
              {filteredServices.length} resultado
              {filteredServices.length !== 1
                ? 's'
                : ''}
            </span>
          </div>
        </motion.div>

        {/* Catálogo */}
        {filteredServices.length > 0 ? (
          <motion.div
            className="service-grid"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map(
                (service) => {
                  const isSelected =
                    simulation?.selectedServices.includes(
                      service.name
                    ) ?? false;

                  const costItem =
                    simulation?.costItems.find(
                      (item) =>
                        item.service ===
                        service.name
                    );

                  return (
                    <motion.div
                      key={service.name}
                      layout
                      initial={{
                        opacity: 0,
                        scale: 0.94,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.94,
                      }}
                      transition={{
                        duration: 0.22,
                      }}
                      whileHover={cardHover}
                      className="card service-card premium"
                    >
                      <div className="service-card-top">
                        <span className="service-icon">
                          <service.Icon size={20} />
                        </span>

                        <span
                          className={
                            isSelected
                              ? 'status-badge success'
                              : 'status-badge warning'
                          }
                        >
                          {isSelected
                            ? 'En propuesta'
                            : 'No seleccionado'}
                        </span>
                      </div>

                      <span className="category-badge">
                        {service.category}
                      </span>

                      <h3>
                        Amazon {service.name}
                      </h3>

                      <p>
                        {service.description}
                      </p>

                      <div className="divider" />

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '1fr auto',
                          gap: 10,
                          alignItems: 'end',
                        }}
                      >
                        <div className="service-function">
                          <Info size={15} />

                          <span>
                            <b>
                              Función principal
                            </b>

                            <small>
                              {service.description}
                            </small>
                          </span>
                        </div>

                        {isSelected &&
                          costItem && (
                            <div
                              style={{
                                textAlign:
                                  'right',
                              }}
                            >
                              <small
                                style={{
                                  display:
                                    'block',
                                  color:
                                    'var(--muted-2)',
                                  fontSize: 9,
                                }}
                              >
                                COSTO / MES
                              </small>

                              <strong
                                style={{
                                  display:
                                    'block',
                                  marginTop: 2,
                                  color:
                                    'var(--text)',
                                  fontSize: 13,
                                }}
                              >
                                {usd(
                                  costItem.monthly
                                )}
                              </strong>
                            </div>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedServiceName(
                            service.name
                          )
                        }
                        className="primary-button"
                        style={{
                          width: '100%',
                          justifyContent:
                            'center',
                          marginTop: 2,
                          background:
                            isSelected
                              ? undefined
                              : 'var(--fill-2)',
                          color:
                            isSelected
                              ? undefined
                              : 'var(--text)',
                          border:
                            isSelected
                              ? undefined
                              : '1px solid var(--border)',
                        }}
                      >
                        <ExternalLink size={15} />
                        Ver detalles
                      </button>
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            className="dashboard-empty"
            variants={staggerItem}
            style={{
              minHeight: 420,
              marginTop: 16,
            }}
          >
            <div className="empty-icon">
              <Search size={30} />
            </div>

            <span className="section-kicker">
              SERVICE CATALOG
            </span>

            <h1
              style={{
                fontSize: 25,
              }}
            >
              No encontramos servicios
            </h1>

            <p>
              No hay servicios que coincidan con
              los filtros actuales. Prueba con otra
              búsqueda o cambia la categoría.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setSearch('');
                setCategory('Todas');
                setFilterMode('all');
              }}
            >
              Limpiar filtros
            </button>
          </motion.div>
        )}

        {/* Estado de la propuesta */}
        <motion.div
          className="overview-strip executive"
          variants={staggerItem}
          style={{
            marginTop: 16,
          }}
        >
          <div>
            <span className="overview-icon">
              <CheckCircle2 size={20} />
            </span>

            <div>
              <b>En propuesta</b>

              <small>
                {selectedCount} servicios
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <Activity size={20} />
            </span>

            <div>
              <b>Disponibles</b>

              <small>
                {availableCount} servicios
              </small>
            </div>
          </div>

          <div>
            <span className="overview-icon">
              <CircleDollarSign size={20} />
            </span>

            <div>
              <b>Consumo mensual</b>

              <small>
                {simulation
                  ? usd(simulation.monthlyCost)
                  : usd(0)}
              </small>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedService && detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setSelectedServiceName(null)
            }
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'grid',
              placeItems: 'center',
              padding: 20,
              background:
                'rgba(15,23,42,.58)',
              backdropFilter: 'blur(7px)',
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 18,
                scale: 0.97,
              }}
              transition={{
                duration: 0.22,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: 'min(720px, 100%)',
                maxHeight: 'min(720px, 90vh)',
                overflowY: 'auto',
                borderRadius: 22,
                border:
                  '1px solid var(--border)',
                background:
                  'var(--card)',
                boxShadow:
                  '0 30px 80px rgba(0,0,0,.24)',
                padding: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 13,
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="service-icon"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 13,
                    }}
                  >
                    <selectedService.Icon
                      size={23}
                    />
                  </span>

                  <div>
                    <span className="section-kicker">
                      {selectedService.category}
                    </span>

                    <h2
                      style={{
                        margin:
                          '3px 0 0',
                        color:
                          'var(--text)',
                        fontSize: 25,
                      }}
                    >
                      Amazon{' '}
                      {selectedService.name}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedServiceName(
                      null
                    )
                  }
                  aria-label="Cerrar"
                  style={{
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 10,
                    border:
                      '1px solid var(--border)',
                    background:
                      'var(--card)',
                    color:
                      'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 17,
                }}
              >
                <span className="category-badge">
                  {detail.role}
                </span>

                <span
                  className={
                    simulation?.selectedServices.includes(
                      selectedService.name
                    )
                      ? 'status-badge success'
                      : 'status-badge warning'
                  }
                >
                  {simulation?.selectedServices.includes(
                    selectedService.name
                  )
                    ? 'Incluido en propuesta'
                    : 'No incluido'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderRadius: 15,
                    background:
                      'var(--fill)',
                    border:
                      '1px solid var(--border)',
                  }}
                >
                  <span
                    className="section-kicker"
                  >
                    DESCRIPCIÓN
                  </span>

                  <p
                    style={{
                      margin:
                        '7px 0 0',
                      color:
                        'var(--muted)',
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    {selectedService.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 15,
                      borderRadius: 15,
                      background:
                        'var(--card)',
                      border:
                        '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="section-kicker"
                    >
                      ALCANCE
                    </span>

                    <p
                      style={{
                        margin:
                          '6px 0 0',
                        color:
                          'var(--muted)',
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {detail.scope}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 15,
                      borderRadius: 15,
                      background:
                        'var(--card)',
                      border:
                        '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="section-kicker"
                    >
                      APLICACIONES
                    </span>

                    <p
                      style={{
                        margin:
                          '6px 0 0',
                        color:
                          'var(--muted)',
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {detail.examples}
                    </p>
                  </div>
                </div>

                {simulation?.selectedServices.includes(
                  selectedService.name
                ) && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(3, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background:
                          'var(--soft-green)',
                        border:
                          '1px solid rgba(22,163,74,.15)',
                      }}
                    >
                      <span
                        className="section-kicker"
                      >
                        ESTADO
                      </span>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 5,
                          color:
                            'var(--success-fg)',
                          fontSize: 13,
                        }}
                      >
                        En propuesta
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background:
                          'var(--soft-blue)',
                        border:
                          '1px solid rgba(37,99,235,.15)',
                      }}
                    >
                      <span
                        className="section-kicker"
                      >
                        COSTO / MES
                      </span>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 5,
                          color:
                            'var(--primary)',
                          fontSize: 13,
                        }}
                      >
                        {usd(
                          detail.monthlyCost
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background:
                          'var(--fill)',
                        border:
                          '1px solid var(--border)',
                      }}
                    >
                      <span
                        className="section-kicker"
                      >
                        CONSUMO
                      </span>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 5,
                          color:
                            'var(--text)',
                          fontSize: 13,
                        }}
                      >
                        {detail.usage ??
                          'Configurado'}
                      </strong>
                    </div>
                  </div>
                )}

                {simulation &&
                  selectedServiceCost && (
                    <div
                      style={{
                        padding: 15,
                        borderRadius: 15,
                        border:
                          '1px solid var(--border)',
                        background:
                          'var(--fill)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          gap: 12,
                          alignItems:
                            'center',
                        }}
                      >
                        <div>
                          <span className="section-kicker">
                            REFERENCIA DE COSTO
                          </span>

                          <strong
                            style={{
                              display:
                                'block',
                              marginTop: 4,
                              color:
                                'var(--text)',
                              fontSize: 13,
                            }}
                          >
                            {
                              selectedServiceCost.detail
                            }
                          </strong>
                        </div>

                        <div
                          style={{
                            textAlign:
                              'right',
                          }}
                        >
                          <span
                            style={{
                              display:
                                'block',
                              color:
                                'var(--muted-2)',
                              fontSize: 10,
                            }}
                          >
                            TARIFA
                          </span>

                          <strong
                            style={{
                              color:
                                'var(--text)',
                              fontSize: 13,
                            }}
                          >
                            {selectedServiceCost.rate ===
                            0
                              ? 'Sin costo directo'
                              : `${usd(
                                  selectedServiceCost.rate
                                )} ${
                                  selectedServiceCost.unit
                                }`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    setSelectedServiceName(
                      null
                    )
                  }
                  style={{
                    background:
                      'var(--fill-2)',
                    color:
                      'var(--text)',
                    border:
                      '1px solid var(--border)',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}

export default Services;