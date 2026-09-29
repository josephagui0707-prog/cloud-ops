import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Cloud,
  Coins,
  Globe2,
  LayoutDashboard,
  Network,
  ServerCog,
  ShieldCheck,
  Layers3,
} from 'lucide-react';

import { useSimulation } from '../context/SimulationContext';

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard, true],
  ['/dashboard/planning', 'Planificación', Cloud, false],
  ['/dashboard/costs', 'Costos', Coins, false],
  ['/dashboard/comparison', 'Comparar escenarios', Layers3, false],
  ['/dashboard/infrastructure', 'Infraestructura Global', Globe2, false],
  ['/dashboard/security', 'Seguridad', ShieldCheck, false],
  ['/dashboard/network', 'Arquitectura de Red', Network, false],
  ['/dashboard/services', 'Servicios AWS', Boxes, false],
] as const;

export default function Sidebar() {
  const { simulation } = useSimulation();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand-mark">
          <Cloud size={22} />
        </div>

        <div className="brand-copy">
          <strong>CloudOps</strong>
          <span>FOUNDATIONS</span>
        </div>
      </div>

      <div className="workspace-card">
        <div className="workspace-icon">
          <ServerCog size={18} />
        </div>

        <div>
          <strong>Cloud Architecture</strong>
          <span>AWS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">NAVEGACIÓN</span>

        {nav.map(([path, name, Icon, exact]) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <Icon size={19} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <div className="status-dot" />

        <div>
          <strong>
            {simulation
              ? 'Simulación activa'
              : 'Entorno preparado'}
          </strong>

          <span>
            {simulation
              ? simulation.region
              : 'Sin escenario generado'}
          </span>
        </div>
      </div>
    </aside>
  );
}