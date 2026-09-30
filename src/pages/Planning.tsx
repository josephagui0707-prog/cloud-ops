import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, CircleDollarSign, Cloud, Copy,
  Database, Globe2, HardDrive, Pencil, Plus, Route, Server, Shield,
  Trash2, Users, MapPin, X, type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import {
  Card, Page, Title, usd, services, staggerContainer, staggerItem
} from '../components/PageUI';

import {
  useSimulation,
  type SimulationInput,
  type Simulation,
  type SimulationCostItem
} from '../context/SimulationContext';
import RegionMap from '../components/RegionMap';
import { awsRegions } from '../data/awsRegions';

const rates: Record<string, { rate: number; unit: string; detail: string }> = {
  EC2: { rate: 0.0104, unit: 'USD/h', detail: 't3.micro Linux On-Demand' },
  RDS: { rate: 0.017, unit: 'USD/h', detail: 'db.t3.micro MySQL Single-AZ' },
  S3: { rate: 0.023, unit: 'USD/GB-mes', detail: 'S3 Standard' },
  CloudFront: { rate: 0.085, unit: 'USD/GB', detail: 'Transferencia de datos a Internet' },
  'Route 53': { rate: 0.5, unit: 'USD/zona-mes', detail: 'Zona alojada' },
  IAM: { rate: 0, unit: 'USD/mes', detail: 'Gestión de identidades y accesos' },
  VPC: { rate: 0, unit: 'USD/mes', detail: 'Red virtual privada' }
};

const icons: Record<string, LucideIcon> = {
  EC2: Server,
  RDS: Database,
  S3: HardDrive,
  CloudFront: Globe2,
  'Route 53': Route,
  IAM: Shield,
  VPC: Cloud
};

const defaultSelected: string[] = [];
const defaultQuantities: Record<string, number> = {};

type PlanningForm = {
  name: string;
  type: string;
  region: string;
  users: number;
  availability: string;
  objective: string;
  description: string;
  selected: string[];
  quantities: Record<string, number>;
};

const emptyForm: PlanningForm = {
  name: '',
  type: 'Aplicación web empresarial',
  region: 'US East (Ohio)',
  users: 500,
  availability: 'Alta disponibilidad',
  objective: 'Escalabilidad y reducción de costos',
  description: '',
  selected: [...defaultSelected],
  quantities: { ...defaultQuantities }
};

function formFromSimulation(simulation: Simulation): PlanningForm {
  const quantities = simulation.costItems.reduce<Record<string, number>>(
    (acc, item) => ({ ...acc, [item.service]: item.quantity }),
    { ...defaultQuantities }
  );

  return {
    name: simulation.name,
    type: simulation.type,
    region: simulation.region,
    users: simulation.users,
    availability: simulation.availability,
    objective: simulation.objective,
    description: simulation.description,
    selected: [...simulation.selectedServices],
    quantities
  };
}

export function Planning() {
  const {
    simulations,
    activeSimulation,
    createSimulation,
    updateSimulation,
    setActiveSimulation,
    deleteSimulation,
    duplicateSimulation
  } = useSimulation();

  const [form, setForm] = useState<PlanningForm>(() =>
    activeSimulation ? formFromSimulation(activeSimulation) : emptyForm
  );

  const [editingId, setEditingId] = useState<string | null>(
    activeSimulation?.id ?? null
  );
  const [showRegionMap, setShowRegionMap] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Simulation | null>(null);

  const editingSimulation = useMemo(
    () => simulations.find((item) => item.id === editingId) ?? null,
    [simulations, editingId]
  );

  const selectedRegionData = useMemo(
    () =>
      awsRegions.find(
        (region) => region.name === form.region
      ) ?? awsRegions[0],
    [form.region]
  );

  const costItems = useMemo<SimulationCostItem[]>(() => {
    return form.selected.map((service) => {
      const config = rates[service] ?? { rate: 0, unit: 'USD/mes', detail: 'Servicio AWS' };
      const quantity = Math.max(0, form.quantities[service] ?? 1);
      let monthly = 0;
      let usage = `${quantity}`;

      if (service === 'EC2' || service === 'RDS') {
        monthly = quantity * 730 * config.rate;
        usage = `${quantity} × 730 h`;
      } else if (service === 'S3' || service === 'CloudFront') {
        monthly = quantity * config.rate;
        usage = `${quantity} GB`;
      } else if (service === 'Route 53') {
        monthly = quantity * config.rate;
        usage = `${quantity} zona(s)`;
      } else {
        usage = 'Sin costo directo';
      }

      return {
        service,
        detail: config.detail,
        quantity,
        usage,
        rate: config.rate,
        unit: config.unit,
        monthly
      };
    });
  }, [form.selected, form.quantities]);

  const monthlyCost = useMemo(
    () => costItems.reduce((sum, item) => sum + item.monthly, 0),
    [costItems]
  );

  const annualCost = monthlyCost * 12;

  const validation = {
    name: form.name.trim().length >= 3,
    description: form.description.trim().length >= 10,
    users: form.users > 0,
    services: form.selected.length > 0
  };

  const canSave: boolean =
    validation.name &&
    validation.description &&
    validation.users &&
    validation.services;

  const updateForm = <K extends keyof PlanningForm>(
    key: K,
    value: PlanningForm[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleService = (service: string) => {
    setForm((current) => {
      const exists = current.selected.includes(service);

      if (exists) {
        const nextQuantities = { ...current.quantities };
        delete nextQuantities[service];

        return {
          ...current,
          selected: current.selected.filter((item) => item !== service),
          quantities: nextQuantities
        };
      }

      return {
        ...current,
        selected: [...current.selected, service],
        quantities: {
          ...current.quantities,
          [service]: 1
        }
      };
    });
  };

  const setQuantity = (service: string, value: number) => {
    setForm((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        [service]: Math.max(0, value || 0)
      }
    }));
  };

  const loadSimulation = (simulation: Simulation) => {
    setForm(formFromSimulation(simulation));
    setEditingId(simulation.id);
  };

  const newSimulation = () => {
    setForm({
      ...emptyForm,
      selected: [],
      quantities: {}
    });
    setEditingId(null);
    setPendingDelete(null);
  };

  const save = () => {
    if (!canSave) {
      toast.error('Completa correctamente los datos requeridos.');
      return;
    }

    const isEditing = Boolean(editingId && editingSimulation);

    const data: SimulationInput = {
      name: form.name.trim(),
      type: form.type,
      region: form.region,
      users: form.users,
      availability: form.availability,
      objective: form.objective,
      description: form.description.trim(),
      selectedServices: [...form.selected],
      costItems,
      monthlyCost,
      annualCost,
      createdAt: isEditing && editingSimulation
        ? editingSimulation.createdAt
        : new Date().toISOString()
    };

    if (isEditing && editingId) {
      const updated = updateSimulation(editingId, data);

      if (updated) {
        setActiveSimulation(editingId);
        toast.success('Planificación actualizada.');
      } else {
        const created = createSimulation(data);
        setEditingId(created.id);
        toast.success('La planificación anterior ya no existía. Se creó un nuevo escenario.');
      }

      return;
    }

    const created = createSimulation(data);
    setEditingId(created.id);
    setActiveSimulation(created.id);
    toast.success('Nueva planificación creada.');
  };

  const activate = (simulation: Simulation) => {
    setActiveSimulation(simulation.id);
    loadSimulation(simulation);
    toast.success(`"${simulation.name}" está activa.`);
  };

  const duplicate = (simulation: Simulation) => {
    const copy = duplicateSimulation(simulation.id);
    if (copy) {
      loadSimulation(copy);
      toast.success('Planificación duplicada.');
    }
  };

  const requestDelete = (simulation: Simulation): void => {
    setPendingDelete(simulation);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;

    const simulation = pendingDelete;
    const remaining = simulations.filter((item) => item.id !== simulation.id);
    const deletingActive = activeSimulation?.id === simulation.id;
    const deletingEditing = editingId === simulation.id;

    deleteSimulation(simulation.id);
    setPendingDelete(null);

    if (remaining.length === 0) {
      newSimulation();
      toast.success('Planificación eliminada. Puedes crear una nueva.');
      return;
    }

    const next = remaining[0];

    if (deletingActive) {
      setActiveSimulation(next.id);
    }

    if (deletingEditing) {
      loadSimulation(next);
    }

    toast.success('Planificación eliminada.');
  };

  return (
    <Page>
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <Title
          t="Planificación Cloud"
          s="Crea y administra diferentes escenarios Cloud para analizar configuraciones, costos y arquitectura."
          tag="CLOUD SCENARIOS"
        />

        <div className="simulation-meta-strip">
          <span><b>Escenarios:</b> {simulations.length}</span>
          <span><b>Activo:</b> {activeSimulation?.name ?? 'Ninguno'}</span>
          <span>
            <b>Costo activo:</b>{' '}
            {activeSimulation ? usd(activeSimulation.monthlyCost) : usd(0)}
          </span>
        </div>

        <motion.div
          variants={staggerItem}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 16,
            marginBottom: 14
          }}
        >
          <div>
            <span className="section-kicker">SCENARIO MANAGER</span>
            <h3 style={{ margin: '4px 0 0', color: 'var(--text)' }}>
              Tus planificaciones
            </h3>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={newSimulation}
          >
            <Plus size={16} />
            Nueva planificación
          </button>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12
          }}
        >
          {simulations.map((item) => {
            const active = item.id === activeSimulation?.id;
            const editing = item.id === editingId;

            return (
              <Card
                key={item.id}
                hoverable
                style={{
                  border: active ? '1px solid rgba(37,99,235,.45)' : undefined,
                  boxShadow: active
                    ? '0 8px 28px rgba(37,99,235,.10)'
                    : undefined
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <span className="section-kicker">
                      {active ? 'ACTIVE SCENARIO' : 'SCENARIO'}
                    </span>
                    <h3 style={{ margin: '5px 0 3px', color: 'var(--text)' }}>
                      {item.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 11 }}>
                      {item.region} · {item.selectedServices.length} servicios
                    </p>
                  </div>

                  <span className={active ? 'status-badge success' : 'mini-badge'}>
                    {active ? 'Activa' : 'Disponible'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 13
                  }}
                >
                  <div className="service-function">
                    <CircleDollarSign size={15} />
                    <span>
                      <b>{usd(item.monthlyCost)}</b>
                      <small>mensual</small>
                    </span>
                  </div>

                  <div className="service-function">
                    <Users size={15} />
                    <span>
                      <b>{item.users.toLocaleString()}</b>
                      <small>usuarios</small>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginTop: 13
                  }}
                >
                  {!active && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => activate(item)}
                      style={{ flex: 1 }}
                    >
                      Activar
                    </button>
                  )}

                  <button
                    type="button"
                    className="mini-badge"
                    onClick={() => loadSimulation(item)}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Pencil size={13} />
                    {editing ? 'Editando' : 'Editar'}
                  </button>

                  <button
                    type="button"
                    className="mini-badge"
                    onClick={() => duplicate(item)}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Copy size={13} />
                    Copiar
                  </button>

                  <button
                    type="button"
                    onClick={() => requestDelete(item)}
                    style={{
                      width: 34,
                      borderRadius: 9,
                      border: '1px solid rgba(220,38,38,.16)',
                      background: 'var(--soft-red)',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}

          {simulations.length === 0 && (
            <Card>
              <div className="dashboard-empty" style={{ minHeight: 230 }}>
                <div className="empty-icon"><Cloud size={28} /></div>
                <h1 style={{ fontSize: 20 }}>No hay planificaciones</h1>
                <p style={{ fontSize: 12 }}>
                  Crea tu primer escenario Cloud para comenzar.
                </p>
              </div>
            </Card>
          )}
        </motion.div>

        <motion.div
          variants={staggerItem}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, .8fr)',
            gap: 16,
            marginTop: 16
          }}
        >
          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">CONFIGURATION</span>
                <h3>{editingId ? 'Editar escenario' : 'Nueva planificación'}</h3>
                <p>
                  Configura los datos que alimentarán los módulos CloudOps.
                </p>
              </div>
              <Activity size={20} />
            </div>

            <div className="form-grid">
              <label>
                <span>Nombre</span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Ej. E-commerce Regional"
                />
              </label>

              <label>
                <span>Tipo de aplicación</span>
                <select
                  value={form.type}
                  onChange={(e) => updateForm('type', e.target.value)}
                >
                  <option>Aplicación web empresarial</option>
                  <option>E-commerce</option>
                  <option>API / Backend</option>
                  <option>Portal de clientes</option>
                </select>
              </label>

              <div>
                <span style={{ display: 'block', marginBottom: 7 }}>
                  Región principal
                </span>

                <button
                  type="button"
                  className="region-selector-trigger"
                  onClick={() => setShowRegionMap(true)}
                >
                  <span>
                    <Globe2 size={17} />
                  </span>

                  <span className="region-selector-trigger-content">
                    <strong>
                      {selectedRegionData.name}
                    </strong>

                    <small>
                      {selectedRegionData.code} · {selectedRegionData.location}
                    </small>
                  </span>

                  <MapPin size={15} />
                </button>

                <small
                  style={{
                    display: 'block',
                    marginTop: 5,
                    color: 'var(--muted-2)',
                    fontSize: 9,
                  }}
                >
                  Haz clic para explorar y seleccionar una región AWS.
                </small>
              </div>

              <label>
                <span>Usuarios estimados</span>
                <input
                  type="number"
                  min="1"
                  value={form.users}
                  onChange={(e) =>
                    updateForm('users', Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </label>

              <label>
                <span>Disponibilidad</span>
                <select
                  value={form.availability}
                  onChange={(e) => updateForm('availability', e.target.value)}
                >
                  <option>Alta disponibilidad</option>
                  <option>Estándar</option>
                  <option>Crítica 24/7</option>
                </select>
              </label>

              <label>
                <span>Objetivo</span>
                <select
                  value={form.objective}
                  onChange={(e) => updateForm('objective', e.target.value)}
                >
                  <option>Escalabilidad y reducción de costos</option>
                  <option>Modernización</option>
                  <option>Continuidad del negocio</option>
                  <option>Rendimiento global</option>
                </select>
              </label>

              <label className="wide">
                <span>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Describe brevemente la solución..."
                  maxLength={500}
                />
              </label>

              <div className="wide">
                <div className="field-title">Servicios Cloud</div>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11 }}>
                  Selecciona únicamente los servicios que realmente formarán parte de este escenario.
                </p>

                <div
                  className="service-choice-grid"
                  style={{ marginTop: 10 }}
                >
                  {services.map(([service, category, description, Icon]) => {
                    const active = form.selected.includes(service);
                    const item = costItems.find((cost) => cost.service === service);

                    return (
                      <button
                        type="button"
                        key={service}
                        title={description}
                        onClick={() => toggleService(service)}
                        className={active ? 'service-choice selected' : 'service-choice'}
                        style={{ textAlign: 'left', alignItems: 'center' }}
                      >
                        <Icon size={17} />

                        <span style={{ minWidth: 0 }}>
                          <b>{service}</b>
                          <small>{category}</small>
                        </span>

                        <span
                          style={{
                            marginLeft: 'auto',
                            display: 'grid',
                            justifyItems: 'end',
                            gap: 2,
                            flexShrink: 0
                          }}
                        >
                          {active && (
                            <small
                              style={{
                                color: 'var(--primary)',
                                fontWeight: 800,
                                fontSize: 10
                              }}
                            >
                              {usd(item?.monthly ?? 0)}/mes
                            </small>
                          )}

                          {active ? (
                            <CheckCircle2
                              size={16}
                              style={{ color: 'var(--primary)' }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                border: '1px solid var(--border)',
                                borderRadius: '50%'
                              }}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.selected.length > 0 && (
                <div className="wide">
                  <div className="field-title">Consumo estimado</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 8,
                      marginTop: 9
                    }}
                  >
                    {form.selected.map((service) => {
                      const Icon = icons[service] ?? Server;
                      const item = costItems.find((cost) => cost.service === service);

                      return (
                        <div className="simulation-input" key={service}>
                          <div>
                            <Icon size={16} />
                            <span>
                              <b>{service}</b>
                              <small>{item?.usage}</small>
                            </span>
                          </div>

                          <input
                            type="number"
                            min="0"
                            value={form.quantities[service] ?? 1}
                            onChange={(e) =>
                              setQuantity(service, Number(e.target.value))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {costItems.length > 0 && (
                <div className="wide">
                  <div className="field-title">Estimación previa</div>

                  <div
                    style={{
                      display: 'grid',
                      gap: 7,
                      marginTop: 9
                    }}
                  >
                    {costItems.map((item) => (
                      <div
                        key={item.service}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '9px 11px',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          background: 'var(--fill)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            minWidth: 0
                          }}
                        >
                          <CheckCircle2
                            size={15}
                            style={{
                              color: 'var(--security)',
                              flexShrink: 0
                            }}
                          />

                          <div style={{ minWidth: 0 }}>
                            <strong
                              style={{
                                display: 'block',
                                fontSize: 11,
                                color: 'var(--text)'
                              }}
                            >
                              {item.service}
                            </strong>

                            <small
                              style={{
                                color: 'var(--muted)',
                                fontSize: 9
                              }}
                            >
                              {item.usage}
                            </small>
                          </div>
                        </div>

                        <strong
                          style={{
                            color: 'var(--primary)',
                            fontSize: 11,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {usd(item.monthly)}/mes
                        </strong>
                      </div>
                    ))}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '11px',
                        borderRadius: 10,
                        background: 'var(--soft-blue)',
                        marginTop: 2
                      }}
                    >
                      <strong style={{ fontSize: 12, color: 'var(--text)' }}>
                        Total estimado
                      </strong>

                      <strong style={{ fontSize: 15, color: 'var(--primary)' }}>
                        {usd(monthlyCost)}/mes
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="wide">
                {!canSave && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 7,
                      marginBottom: 10,
                      padding: '9px 11px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--fill)',
                      color: 'var(--muted)',
                      fontSize: 10
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                      Completa:
                    </span>
                    {!validation.name && <span>nombre (mín. 3 caracteres)</span>}
                    {!validation.description && <span>descripción (mín. 10 caracteres)</span>}
                    {!validation.users && <span>usuarios válidos</span>}
                    {!validation.services && <span>selecciona al menos un servicio</span>}
                  </div>
                )}
              </div>

              <div className="wide form-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={save}
                  disabled={!canSave}
                  style={{ opacity: canSave ? 1 : 0.55 }}
                >
                  <CheckCircle2 size={16} />
                  {editingSimulation ? 'Actualizar escenario' : 'Crear escenario'}
                </button>

                <button
                  type="button"
                  className="mini-badge"
                  onClick={newSimulation}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)'
                  }}
                >
                  <Plus size={14} />
                  Limpiar / nuevo
                </button>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gap: 16 }}>
            <Card className="estimate-hero">
              <div className="estimate-label">
                <CircleDollarSign size={17} />
                ESTIMACIÓN ACTUAL
              </div>
              <strong>{usd(monthlyCost)}</strong>
              <span>por mes</span>
              <small>Proyección anual: {usd(annualCost)}</small>
            </Card>

            <Card className="blueprint-card" variants={staggerItem}>
              <div className="blueprint-head">
                <span><Cloud size={18} /></span>
                <div>
                  <small>LIVE SIMULATION</small>
                  <h3>{form.name || 'Nueva solución Cloud'}</h3>
                </div>
              </div>

              <div className="blueprint-region">
                <Globe2 size={15} />
                <span>{form.region}</span>
              </div>

              <div className="blueprint-metrics">
                <div>
                  <span>Usuarios</span>
                  <b>{form.users.toLocaleString()}</b>
                </div>
                <div>
                  <span>Servicios</span>
                  <b>{form.selected.length}</b>
                </div>
                <div>
                  <span>Disponibilidad</span>
                  <b>{form.availability}</b>
                </div>
                <div>
                  <span>Costo mensual</span>
                  <b>{usd(monthlyCost)}</b>
                </div>
              </div>

              <div className="blueprint-flow">
                <span>Internet</span><i>→</i>
                <span style={{ opacity: form.selected.includes('Route 53') ? 1 : 0.35 }}>DNS</span><i>→</i>
                <span style={{ opacity: form.selected.includes('CloudFront') ? 1 : 0.35 }}>Edge</span><i>→</i>
                <span style={{ opacity: form.selected.includes('VPC') ? 1 : 0.35 }}>VPC</span><i>→</i>
                <span style={{ opacity: form.selected.includes('EC2') ? 1 : 0.35 }}>App</span><i>→</i>
                <span style={{ opacity: form.selected.includes('RDS') ? 1 : 0.35 }}>DB</span>
              </div>

              {form.selected.length > 0 && (
                <div className="blueprint-services">
                  {form.selected.map((service) => (
                    <span key={service}>
                      <CheckCircle2 size={12} />
                      <b>{service}</b>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="card-header">
                <div>
                  <span className="section-kicker">LIVE REVIEW</span>
                  <h3>Resumen</h3>
                </div>
                <Cloud size={19} />
              </div>

              <div style={{ display: 'grid', gap: 9 }}>
                <div className="service-function">
                  <Server size={15} />
                  <span>
                    <b>Servicios</b>
                    <small>{form.selected.length} seleccionados</small>
                  </span>
                </div>

                <div className="service-function">
                  <Users size={15} />
                  <span>
                    <b>Usuarios</b>
                    <small>{form.users.toLocaleString()}</small>
                  </span>
                </div>

                <div className="service-function">
                  <Globe2 size={15} />
                  <span>
                    <b>Región</b>
                    <small>{form.region}</small>
                  </span>
                </div>

                <div className="service-function">
                  <Shield size={15} />
                  <span>
                    <b>Seguridad</b>
                    <small>
                      {form.selected.includes('IAM')
                        ? 'IAM incluido'
                        : 'IAM pendiente'}
                    </small>
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <div>
                  <span className="section-kicker">NEXT STEP</span>
                  <h3>Comparación</h3>
                </div>
                <Globe2 size={19} />
              </div>

              <p style={{ marginTop: 0 }}>
                Ya puedes crear varios escenarios. El siguiente módulo permitirá
                comparar sus regiones, servicios, disponibilidad y costos.
              </p>

              <Link
                className="primary-button"
                to="/dashboard"
                style={{ textDecoration: 'none', marginTop: 8 }}
              >
                <Activity size={15} />
                Ver escenario activo
              </Link>
            </Card>
          </div>
        </motion.div>

        {form.selected.length === 0 && (
          <motion.div className="pricing-note" variants={staggerItem}>
            <AlertTriangle size={18} />
            <div>
              <b>Selecciona los servicios que utilizarás</b>
              <span>
                La estimación aparecerá automáticamente cuando agregues servicios.
              </span>
            </div>
          </motion.div>
          )}
          <AnimatePresence>
            {pendingDelete && (
              <motion.div
                key="delete-confirmation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPendingDelete(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  background: 'rgba(2, 6, 23, .62)',
                  backdropFilter: 'blur(5px)'
                }}
                role="presentation"
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: .98 }}
                  transition={{ duration: .18 }}
                  onClick={(event) => event.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-simulation-title"
                  style={{
                    width: 'min(92vw, 460px)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    background: 'var(--card)',
                    color: 'var(--text)',
                    boxShadow: '0 24px 70px rgba(0,0,0,.28)',
                    padding: 20
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--soft-red)',
                        color: 'var(--danger, #DC2626)',
                        flexShrink: 0
                      }}
                    >
                      <Trash2 size={20} />
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      aria-label="Cerrar confirmación"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        border: '1px solid var(--border)',
                        background: 'var(--fill)',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <span className="section-kicker">CONFIRMAR ACCIÓN</span>
                    <h3
                      id="delete-simulation-title"
                      style={{ margin: '5px 0 7px', color: 'var(--text)' }}
                    >
                      ¿Eliminar esta planificación?
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--muted)',
                        fontSize: 12,
                        lineHeight: 1.6
                      }}
                    >
                      Vas a eliminar{' '}
                      <strong style={{ color: 'var(--text)' }}>
                        “{pendingDelete.name}”
                      </strong>
                      . Esta acción quitará el escenario de tu lista de planificaciones.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginTop: 20
                    }}
                  >
                    <button
                      type="button"
                      className="mini-badge"
                      onClick={() => setPendingDelete(null)}
                      style={{
                        flex: '1 1 130px',
                        minHeight: 40,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--fill)',
                        color: 'var(--text)',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={confirmDelete}
                      style={{
                        flex: '1 1 130px',
                        minHeight: 40,
                        cursor: 'pointer',
                        border: '1px solid rgba(220,38,38,.22)',
                        borderRadius: 10,
                        background: 'var(--danger, #DC2626)',
                        color: '#fff',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 800
                      }}
                    >
                      <Trash2 size={15} />
                      Sí, eliminar
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {showRegionMap && (
            <RegionMap
              value={form.region}
              onClose={() => setShowRegionMap(false)}
              onSelect={(region) => {
                updateForm('region', region.name);
                setShowRegionMap(false);
                toast.success(`Región seleccionada: ${region.name}`);
              }}
            />
          )}
      </motion.div>
    </Page>
  );
}

export default Planning;