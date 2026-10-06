import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Cloud, Copy, Database, Globe2,
  HardDrive, Pencil, Plus, Route, Server, Shield, Trash2, Users, MapPin, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import {
  Card, Page, Title, usd, services, staggerContainer, staggerItem,
} from '../components/PageUI';
import {
  useSimulation,
  type SimulationInput,
  type Simulation,
  type SimulationCostItem,
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
  VPC: { rate: 0, unit: 'USD/mes', detail: 'Red virtual privada' },
};

const defaultSelected: string[] = [];
const defaultCostQuantities: Record<string, number> = {
  EC2: 1,
  RDS: 1,
  S3: 100,
  CloudFront: 50,
  'Route 53': 1,
  IAM: 1,
  VPC: 1,
};

type PlanningForm = {
  name: string;
  type: string;
  region: string;
  users: number;
  availability: string;
  objective: string;
  description: string;
  selected: string[];
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
};

function buildCostItem(service: string, quantity: number): SimulationCostItem {
  const config = rates[service] ?? {
    rate: 0,
    unit: 'USD/mes',
    detail: 'Servicio AWS',
  };
  const safeQuantity = Math.max(0, quantity || 0);
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

function getCostItemsForPlanning(
  selected: string[],
  existing: SimulationCostItem[] = []
): SimulationCostItem[] {
  return selected.map((service) => {
    const previous = existing.find((item) => item.service === service);
    return buildCostItem(service, previous?.quantity ?? defaultCostQuantities[service] ?? 1);
  });
}

function formFromSimulation(simulation: Simulation): PlanningForm {
  return {
    name: simulation.name,
    type: simulation.type,
    region: simulation.region,
    users: simulation.users,
    availability: simulation.availability,
    objective: simulation.objective,
    description: simulation.description,
    selected: [...simulation.selectedServices],
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
    duplicateSimulation,
  } = useSimulation();

  const [form, setForm] = useState<PlanningForm>(() =>
    activeSimulation ? formFromSimulation(activeSimulation) : emptyForm
  );
  const [editingId, setEditingId] = useState<string | null>(activeSimulation?.id ?? null);
  const [showRegionMap, setShowRegionMap] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Simulation | null>(null);

  const editingSimulation = useMemo(
    () => simulations.find((item) => item.id === editingId) ?? null,
    [simulations, editingId]
  );

  const selectedRegionData = useMemo(
    () => awsRegions.find((region) => region.name === form.region) ?? awsRegions[0],
    [form.region]
  );

  const validation = {
    name: form.name.trim().length >= 3,
    description: form.description.trim().length >= 10,
    users: form.users > 0,
    services: form.selected.length > 0,
  };

  const canSave =
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
    setForm((current) => ({
      ...current,
      selected: current.selected.includes(service)
        ? current.selected.filter((item) => item !== service)
        : [...current.selected, service],
    }));
  };

  const loadSimulation = (simulation: Simulation) => {
    setForm(formFromSimulation(simulation));
    setEditingId(simulation.id);
  };

  const newSimulation = () => {
    setForm({ ...emptyForm, selected: [] });
    setEditingId(null);
    setPendingDelete(null);
  };

  const save = () => {
    if (!canSave) {
      toast.error('Completa correctamente los datos requeridos.');
      return;
    }

    const isEditing = Boolean(editingId && editingSimulation);
    const currentItems = editingSimulation?.costItems ?? activeSimulation?.costItems ?? [];
    const selectedCostItems = getCostItemsForPlanning(form.selected, currentItems);
    const monthlyCost = selectedCostItems.reduce((sum, item) => sum + item.monthly, 0);

    const data: SimulationInput = {
      name: form.name.trim(),
      type: form.type,
      region: form.region,
      users: form.users,
      availability: form.availability,
      objective: form.objective,
      description: form.description.trim(),
      selectedServices: [...form.selected],
      costItems: selectedCostItems,
      monthlyCost,
      annualCost: monthlyCost * 12,
      createdAt:
        isEditing && editingSimulation
          ? editingSimulation.createdAt
          : new Date().toISOString(),
    };

    if (isEditing && editingId) {
      const updated = updateSimulation(editingId, data);
      if (updated) {
        setActiveSimulation(editingId);
        toast.success('Planificación actualizada.');
      } else {
        const created = createSimulation(data);
        setEditingId(created.id);
        setActiveSimulation(created.id);
        toast.success('Se creó un nuevo escenario.');
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
      setActiveSimulation(copy.id);
      toast.success('Planificación duplicada.');
    }
  };

  const requestDelete = (simulation: Simulation) => {
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
    if (deletingActive) setActiveSimulation(next.id);
    if (deletingEditing) loadSimulation(next);
    toast.success('Planificación eliminada.');
  };

  return (
    <Page>
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <Title
          t="Planificación Cloud"
          s="Define el escenario, la región y los servicios que formarán parte de la solución."
          tag="CLOUD SCENARIOS"
        />

        <div className="simulation-meta-strip">
          <span><b>Escenarios:</b> {simulations.length}</span>
          <span><b>Activo:</b> {activeSimulation?.name ?? 'Ninguno'}</span>
          <span><b>Gestión de costos:</b> módulo Costos</span>
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
            marginBottom: 14,
          }}
        >
          <div>
            <span className="section-kicker">SCENARIO MANAGER</span>
            <h3 style={{ margin: '4px 0 0', color: 'var(--text)' }}>Tus planificaciones</h3>
          </div>
          <button type="button" className="primary-button" onClick={newSimulation}>
            <Plus size={16} />
            Nueva planificación
          </button>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
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
                  boxShadow: active ? '0 8px 28px rgba(37,99,235,.10)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="section-kicker">{active ? 'ACTIVE SCENARIO' : 'SCENARIO'}</span>
                    <h3 style={{ margin: '5px 0 3px', color: 'var(--text)' }}>{item.name}</h3>
                    <p style={{ margin: 0, fontSize: 11 }}>
                      {item.region} · {item.selectedServices.length} servicios
                    </p>
                  </div>
                  <span className={active ? 'status-badge success' : 'mini-badge'}>
                    {active ? 'Activa' : 'Disponible'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 13 }}>
                  <div className="service-function">
                    <Users size={15} />
                    <span><b>{item.users.toLocaleString()}</b><small>usuarios</small></span>
                  </div>
                  <div className="service-function">
                    <Activity size={15} />
                    <span><b>{item.availability}</b><small>disponibilidad</small></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 13 }}>
                  <Link
                    to="/dashboard/costs"
                    className="mini-badge"
                    style={{
                      textDecoration: 'none',
                      flex: '1 1 110px',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 5,
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                    }}
                    onClick={() => activate(item)}
                  >
                    Costos
                  </Link>
                  {!active && (
                    <button type="button" className="primary-button" onClick={() => activate(item)} style={{ flex: '1 1 90px' }}>
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
                      gap: 5,
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
                      gap: 5,
                    }}
                    title="Duplicar"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(item)}
                    style={{
                      width: 34,
                      minWidth: 34,
                      borderRadius: 9,
                      border: '1px solid rgba(220,38,38,.16)',
                      background: 'var(--soft-red)',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
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
                <p style={{ fontSize: 12 }}>Crea tu primer escenario Cloud para comenzar.</p>
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
            marginTop: 16,
          }}
        >
          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">SCENARIO CONFIGURATION</span>
                <h3>{editingId ? 'Editar escenario' : 'Nueva planificación'}</h3>
                <p>Configura la solución que luego será dimensionada económicamente en Costos.</p>
              </div>
              <Cloud size={20} />
            </div>

            <div className="form-grid">
              <label>
                <span>Nombre</span>
                <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ej. E-commerce Regional" />
              </label>

              <label>
                <span>Tipo de aplicación</span>
                <select value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
                  <option>Aplicación web empresarial</option>
                  <option>E-commerce</option>
                  <option>API / Backend</option>
                  <option>Portal de clientes</option>
                </select>
              </label>

              <div>
                <span style={{ display: 'block', marginBottom: 7 }}>Región principal</span>
                <button type="button" className="region-selector-trigger" onClick={() => setShowRegionMap(true)}>
                  <span><Globe2 size={17} /></span>
                  <span className="region-selector-trigger-content">
                    <strong>{selectedRegionData.name}</strong>
                    <small>{selectedRegionData.code} · {selectedRegionData.location}</small>
                  </span>
                  <MapPin size={15} />
                </button>
                <small style={{ display: 'block', marginTop: 5, color: 'var(--muted-2)', fontSize: 9 }}>
                  Explora y selecciona una región AWS.
                </small>
              </div>

              <label>
                <span>Usuarios estimados</span>
                <input
                  type="number"
                  min="1"
                  value={form.users}
                  onChange={(e) => updateForm('users', Math.max(1, Number(e.target.value) || 1))}
                />
                <small style={{ marginTop: 5, color: 'var(--muted-2)' }}>
                  Referencia de carga para dimensionar el escenario en Costos.
                </small>
              </label>

              <label>
                <span>Disponibilidad</span>
                <select value={form.availability} onChange={(e) => updateForm('availability', e.target.value)}>
                  <option>Alta disponibilidad</option>
                  <option>Estándar</option>
                  <option>Crítica 24/7</option>
                </select>
              </label>

              <label>
                <span>Objetivo</span>
                <select value={form.objective} onChange={(e) => updateForm('objective', e.target.value)}>
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
                  Selecciona únicamente los servicios que formarán parte de este escenario.
                </p>

                <div
                  className="service-choice-grid"
                  style={{
                    marginTop: 10,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  }}
                >
                  {services.map(([service, category, description, Icon]) => {
                    const active = form.selected.includes(service);
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
                        <span style={{ marginLeft: 'auto', display: 'grid', justifyItems: 'end', gap: 2, flexShrink: 0 }}>
                          {active ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                          ) : (
                            <span style={{ width: 16, height: 16, border: '1px solid var(--border)', borderRadius: '50%' }} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="wide">
                <div
                  className="pricing-note"
                  style={{ marginTop: 2 }}
                >
                  <Activity size={18} />
                  <div>
                    <b>El costo se configura en Costos</b>
                    <span>
                      Aquí defines la arquitectura y los servicios. Allí podrás editar cantidades, consumos, subtotales y el costo total sin mezclar la configuración con el análisis económico.
                    </span>
                  </div>
                  {form.selected.length > 0 && (
                    <Link to="/dashboard/costs" className="mini-badge" style={{ textDecoration: 'none' }}>
                      Revisar costos
                    </Link>
                  )}
                </div>
              </div>

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
                      fontSize: 10,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--text)' }}>Completa:</span>
                    {!validation.name && <span>nombre (mín. 3 caracteres)</span>}
                    {!validation.description && <span>descripción (mín. 10 caracteres)</span>}
                    {!validation.users && <span>usuarios válidos</span>}
                    {!validation.services && <span>selecciona al menos un servicio</span>}
                  </div>
                )}
              </div>

              <div className="wide form-actions">
                <button type="button" className="primary-button" onClick={save} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.55 }}>
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
                    color: 'var(--text)',
                  }}
                >
                  <Plus size={14} />
                  Limpiar / nuevo
                </button>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gap: 16 }}>
            <Card className="blueprint-card" variants={staggerItem}>
              <div className="blueprint-head">
                <span><Cloud size={18} /></span>
                <div>
                  <small>SCENARIO PREVIEW</small>
                  <h3>{form.name || 'Nueva solución Cloud'}</h3>
                </div>
              </div>
              <div className="blueprint-region">
                <Globe2 size={15} />
                <span>{form.region}</span>
              </div>
              <div className="blueprint-metrics">
                <div><span>Usuarios</span><b>{form.users.toLocaleString()}</b></div>
                <div><span>Servicios</span><b>{form.selected.length}</b></div>
                <div><span>Disponibilidad</span><b>{form.availability}</b></div>
                <div><span>Módulo económico</span><b>Costos</b></div>
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
                    <span key={service}><CheckCircle2 size={12} /><b>{service}</b></span>
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
                <div className="service-function"><Server size={15} /><span><b>Servicios</b><small>{form.selected.length} seleccionados</small></span></div>
                <div className="service-function"><Users size={15} /><span><b>Usuarios</b><small>{form.users.toLocaleString()}</small></span></div>
                <div className="service-function"><Globe2 size={15} /><span><b>Región</b><small>{form.region}</small></span></div>
                <div className="service-function"><Shield size={15} /><span><b>Seguridad</b><small>{form.selected.includes('IAM') ? 'IAM incluido' : 'IAM pendiente'}</small></span></div>
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <div>
                  <span className="section-kicker">NEXT STEP</span>
                  <h3>Costos</h3>
                </div>
                <Activity size={19} />
              </div>
              <p style={{ marginTop: 0 }}>
                Después de guardar la planificación, utiliza Costos para dimensionar recursos, ajustar consumo y analizar el impacto económico del escenario.
              </p>
              <Link to="/dashboard/costs" className="primary-button" style={{ textDecoration: 'none', marginTop: 8 }}>
                <Activity size={15} />
                Ir a Costos
              </Link>
            </Card>
          </div>
        </motion.div>

        {form.selected.length === 0 && (
          <motion.div className="pricing-note" variants={staggerItem}>
            <AlertTriangle size={18} />
            <div>
              <b>Selecciona los servicios que utilizarás</b>
              <span>La configuración económica estará disponible en Costos después de crear el escenario.</span>
            </div>
          </motion.div>
        )}

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

        <AnimatePresence>
          {pendingDelete && (
            <motion.div
              key="delete-confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingDelete(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, background: 'rgba(2, 6, 23, .62)', backdropFilter: 'blur(5px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: .97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: .98 }}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-simulation-title"
                style={{
                  width: 'min(92vw, 460px)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 18,
                  background: 'var(--card)', color: 'var(--text)', boxShadow: '0 24px 70px rgba(0,0,0,.28)', padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--soft-red)', color: 'var(--danger, #DC2626)' }}>
                    <Trash2 size={20} />
                  </div>
                  <button type="button" onClick={() => setPendingDelete(null)} aria-label="Cerrar confirmación" style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--fill)', color: 'var(--muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ marginTop: 16 }}>
                  <span className="section-kicker">CONFIRMAR ACCIÓN</span>
                  <h3 id="delete-simulation-title" style={{ margin: '5px 0 7px', color: 'var(--text)' }}>¿Eliminar esta planificación?</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
                    Vas a eliminar <strong style={{ color: 'var(--text)' }}>“{pendingDelete.name}”</strong>. Esta acción quitará el escenario de tu lista de planificaciones.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
                  <button type="button" className="mini-badge" onClick={() => setPendingDelete(null)} style={{ flex: '1 1 130px', minHeight: 40, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--fill)', color: 'var(--text)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                    Cancelar
                  </button>
                  <button type="button" onClick={confirmDelete} style={{ flex: '1 1 130px', minHeight: 40, cursor: 'pointer', border: '1px solid rgba(220,38,38,.22)', borderRadius: 10, background: 'var(--danger, #DC2626)', color: '#fff', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Page>
  );
}

export default Planning;
