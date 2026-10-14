import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity, History,
  Boxes,
  Cloud,
  Coins,
  Globe2,
  LayoutDashboard,
  Network,
  ServerCog,
  ShieldCheck,
  Layers3,
  Sparkles,
  BrainCircuit,
  ChevronDown,
} from 'lucide-react';

import { useSimulation } from '../context/SimulationContext';

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard, true],
  ['/dashboard/ai-analysis', 'Análisis de proyectos IA', BrainCircuit, false],
  ['/dashboard/planning', 'Planificación', Cloud, false],
  ['/dashboard/costs', 'Costos', Coins, false],
  ['/dashboard/comparison', 'Comparar escenarios', Layers3, false],
  ['/dashboard/infrastructure', 'Infraestructura Global', Globe2, false],
  ['/dashboard/security', 'Seguridad', ShieldCheck, false],
  ['/dashboard/network', 'Arquitectura de Red', Network, false],
  ['/dashboard/services', 'Servicios AWS', Boxes, false],
  ['/dashboard/failures', 'Simulador de fallos', Activity, false],
  ['/dashboard/history', 'Historial de cambios', History, false],
  ['/dashboard/integrations', 'APIs e Integraciones', Sparkles, false],
] as const;

const aiSubmenu = [
  ['upload','Subir proyecto ZIP'],['general','Análisis general'],['risks','Riesgos y vulnerabilidades'],
  ['security','Seguridad del proyecto'],['aws','Arquitectura y servicios AWS'],['performance','Rendimiento y escalabilidad'],
  ['costs','Costos e impacto económico'],['recommendations','Recomendaciones'],['history','Historial de análisis'],['reports','Reportes']
];
export default function Sidebar() {
  const { simulation } = useSimulation();
  const location = useLocation();
  const [aiOpen, setAiOpen] = useState(location.pathname.startsWith('/dashboard/ai-analysis'));
  useEffect(() => { if (location.pathname.startsWith('/dashboard/ai-analysis')) setAiOpen(true); }, [location.pathname]);

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

        {nav.map(([path, name, Icon, exact]) => {
          if (path === '/dashboard/ai-analysis') {
            const isAiActive = location.pathname.startsWith(path);
            return (
              <div key={path} className={`nav-group ${isAiActive ? 'group-active' : ''}`}>
                <button
                  type="button"
                  className={`nav-item ai-sidebar-main ${isAiActive ? 'active' : ''}`}
                  onClick={() => setAiOpen((value) => !value)}
                  aria-expanded={aiOpen}
                  aria-controls="cloudops-ai-submodules"
                  aria-label={`${aiOpen ? 'Ocultar' : 'Mostrar'} submódulos de Análisis de proyectos IA`}
                >
                  <Icon size={19} />
                  <span>{name}</span>
                  <ChevronDown className={`ai-sidebar-arrow ${aiOpen ? 'open' : ''}`} size={17} aria-hidden="true" />
                </button>

                {aiOpen && (
                  <div className="ai-sidebar-subnav" id="cloudops-ai-submodules">
                    {aiSubmenu.map(([tab, label], i) => (
                      <NavLink
                        key={tab}
                        to={`${path}?tab=${tab}`}
                        className={() => isAiActive && (new URLSearchParams(location.search).get('tab') || 'upload') === tab ? 'active' : ''}
                      >
                        {i + 1}. {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={path}>
              <NavLink
                to={path}
                end={exact}
                className={({ isActive }) =>
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                <Icon size={19} />
                <span>{name}</span>
              </NavLink>
            </div>
          );
        })}
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