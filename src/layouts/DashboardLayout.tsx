import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Cloud, Coins, Globe2, ShieldCheck, Network, Boxes,
  Bell, Search, Activity, ServerCog, LogOut, Moon, Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard, true],
  ['/dashboard/planning', 'Planificación Cloud', Cloud, false],
  ['/dashboard/costs', 'Costos', Coins, false],
  ['/dashboard/infrastructure', 'Infraestructura Global', Globe2, false],
  ['/dashboard/security', 'Seguridad', ShieldCheck, false],
  ['/dashboard/network', 'Arquitectura de Red', Network, false],
  ['/dashboard/services', 'Servicios AWS', Boxes, false],
] as const;

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-mark"><Cloud size={22} /></div>
          <div className="brand-copy">
            <strong>CloudOps</strong>
            <span>FOUNDATIONS</span>
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-icon"><ServerCog size={18}/></div>
          <div>
            <strong>Cloud Architecture</strong>
            <span>AWS · Semanas 5 y 6</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">NAVEGACIÓN</span>
          {nav.map(([path, name, Icon, exact]) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={19}/>
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-status">
          <div className="status-dot" />
          <div>
            <strong>Entorno operativo</strong>
            <span>Frontend local activo</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <span className="eyebrow">CLOUD MANAGEMENT CONSOLE</span>
            <strong>CloudOps Dashboard</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={17}/><span>Buscar recurso o servicio</span></div>
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button" aria-label="Notificaciones"><Bell size={18}/><span className="notification-dot"/></button>
            <div className="system-pill"><Activity size={16}/> Sistema estable</div>

            <div className="topbar-user">
              <div className="topbar-user-info">
                <strong>{user?.name}</strong>
                <span>{user?.role}</span>
              </div>
              <div className="avatar">{user?.initials}</div>
              <button
                onClick={logout}
                className="icon-button"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={17}/>
              </button>
            </div>
          </div>
        </header>

        <section className="page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}