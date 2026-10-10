import { Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { useOperations } from '../operations/OperationsContext';
import { budgetLevel } from '../operations/model';

export default function OperationsBanner() {
  const { simulation: s } = useSimulation();
  const { budgets, storageError } = useOperations();
  const level = s ? budgetLevel(s.monthlyCost, budgets[s.id]) : 'unset';

  return (
    <div className="ops ops-banners" aria-live="polite">
      {storageError && (
        <div role="alert" className="ops-alert critical">
          No se pudo guardar operaciones e historial en este navegador. Los cambios de esta sesión podrían perderse.
        </div>
      )}
      {s && ['warning', 'critical'].includes(level) && (
        <Link className={`ops-alert ${level}`} to="/dashboard/costs">
          {s.name}: {level === 'critical' ? 'presupuesto alcanzado o superado' : 'estimación al 80 % o más del presupuesto'} · Abrir Costos →
        </Link>
      )}
    </div>
  );
}
