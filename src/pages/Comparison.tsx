import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Globe2,
  Layers3,
  Users,
  X,
} from 'lucide-react';

import {
  Card,
  Page,
  Title,
  usd,
} from '../components/PageUI';
import {
  useSimulation,
  type Simulation,
} from '../context/SimulationContext';

export default function Comparison() {
  const { simulations } = useSimulation();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    simulations.slice(0, 3).map((item) => item.id)
  );

  const selected = useMemo(
    () =>
      selectedIds
        .map((id) =>
          simulations.find((item) => item.id === id)
        )
        .filter((item): item is Simulation => !!item),
    [selectedIds, simulations]
  );

  const updateScenario = (index: number, id: string) => {
    setSelectedIds((current) => {
      const next = [...current];
      next[index] = id;
      return next;
    });
  };

  const addScenario = () => {
    if (selectedIds.length >= 3) return;

    const available = simulations.find(
      (item) => !selectedIds.includes(item.id)
    );

    if (available) {
      setSelectedIds((current) => [...current, available.id]);
    }
  };

  const removeScenario = (index: number) => {
    setSelectedIds((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const allServices = useMemo(() => {
    return Array.from(
      new Set(
        selected.flatMap(
          (item) => item.selectedServices
        )
      )
    );
  }, [selected]);

  if (simulations.length < 2) {
    return (
      <Page>
        <Title
          t="Comparación de escenarios"
          s="Compara diferentes planificaciones Cloud antes de elegir cuál utilizar como escenario activo."
          tag="SCENARIO COMPARISON"
        />

        <div className="dashboard-empty">
          <div className="empty-icon">
            <Layers3 size={32} />
          </div>

          <span className="section-kicker">
            COMPARISON WORKSPACE
          </span>

          <h1>Necesitas al menos 2 planificaciones</h1>

          <p>
            Crea otra planificación para poder comparar regiones,
            usuarios, servicios, disponibilidad y costos.
          </p>

          <Link
            to="/dashboard/planning"
            className="primary-button"
            style={{ textDecoration: 'none' }}
          >
            Crear planificación
            <ArrowRight size={16} />
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Title
        t="Comparación de escenarios"
        s="Analiza diferentes configuraciones Cloud lado a lado."
        tag="SCENARIO COMPARISON"
      />

      <div className="comparison-toolbar">
        <div>
          <span className="section-kicker">
            SCENARIOS
          </span>
          <h3>Escenarios seleccionados</h3>
        </div>

        {selectedIds.length < 3 && simulations.length > selectedIds.length && (
          <button
            type="button"
            className="mini-badge"
            onClick={addScenario}
            style={{
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
            }}
          >
            + Comparar otro
          </button>
        )}
      </div>

      <div
        className="comparison-selectors"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${selectedIds.length}, minmax(0, 1fr))`,
          gap: 12,
          marginTop: 12,
        }}
      >
        {selectedIds.map((id, index) => (
          <Card key={`${id}-${index}`}>
            <div className="comparison-select-head">
              <span className="mini-badge">
                Escenario {String.fromCharCode(65 + index)}
              </span>

              {selectedIds.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeScenario(index)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              value={id}
              onChange={(e) =>
                updateScenario(index, e.target.value)
              }
              style={{ width: '100%', marginTop: 10 }}
            >
              {simulations.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={
                    selectedIds.includes(item.id) &&
                    item.id !== id
                  }
                >
                  {item.name}
                </option>
              ))}
            </select>
          </Card>
        ))}
      </div>

      <Card className="comparison-table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <span className="section-kicker">
              OVERVIEW
            </span>
            <h3>Resumen de escenarios</h3>
            <p>
              Comparación directa de los parámetros principales.
            </p>
          </div>
          <Layers3 size={20} />
        </div>

        <div className="comparison-table">
          <div className="comparison-row comparison-head">
            <span>Característica</span>
            {selected.map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>

          <div className="comparison-row">
            <span>
              <Globe2 size={14} />
              Región
            </span>
            {selected.map((item) => (
              <strong key={item.id}>
                {item.region}
              </strong>
            ))}
          </div>

          <div className="comparison-row">
            <span>
              <Users size={14} />
              Usuarios
            </span>
            {selected.map((item) => (
              <strong key={item.id}>
                {item.users.toLocaleString()}
              </strong>
            ))}
          </div>

          <div className="comparison-row">
            <span>Tipo</span>
            {selected.map((item) => (
              <span key={item.id}>{item.type}</span>
            ))}
          </div>

          <div className="comparison-row">
            <span>Disponibilidad</span>
            {selected.map((item) => (
              <span key={item.id}>
                {item.availability}
              </span>
            ))}
          </div>

          <div className="comparison-row">
            <span>Objetivo</span>
            {selected.map((item) => (
              <span key={item.id}>
                {item.objective}
              </span>
            ))}
          </div>

          <div className="comparison-row">
            <span>
              <Layers3 size={14} />
              Servicios
            </span>
            {selected.map((item) => (
              <strong key={item.id}>
                {item.selectedServices.length}
              </strong>
            ))}
          </div>

          <div className="comparison-row highlight-row">
            <span>
              <CircleDollarSign size={14} />
              Costo mensual
            </span>
            {selected.map((item) => (
              <strong key={item.id}>
                {usd(item.monthlyCost)}
              </strong>
            ))}
          </div>

          <div className="comparison-row">
            <span>Costo anual</span>
            {selected.map((item) => (
              <strong key={item.id}>
                {usd(item.annualCost)}
              </strong>
            ))}
          </div>
        </div>
      </Card>

      <Card className="comparison-table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <span className="section-kicker">
              SERVICE MATRIX
            </span>
            <h3>Servicios incluidos</h3>
            <p>
              Permite ver qué componentes forman parte de cada escenario.
            </p>
          </div>
          <Layers3 size={20} />
        </div>

        <div className="comparison-table">
          <div className="comparison-row comparison-head">
            <span>Servicio</span>
            {selected.map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>

          {allServices.map((service) => (
            <div className="comparison-row" key={service}>
              <span>{service}</span>

              {selected.map((item) => {
                const included =
                  item.selectedServices.includes(service);

                return (
                  <span key={item.id}>
                    {included ? (
                      <b
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--security)',
                        }}
                      >
                        <Check size={14} />
                        Incluido
                      </b>
                    ) : (
                      <span
                        style={{
                          color: 'var(--muted-2)',
                        }}
                      >
                        —
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 16,
        }}
      >
        <Link
          to="/dashboard/planning"
          className="primary-button"
          style={{ textDecoration: 'none' }}
        >
          Volver a Planificación
          <ArrowRight size={15} />
        </Link>
      </div>
    </Page>
  );
}