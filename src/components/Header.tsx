import { Bell, LogOut, Moon, Search, Sun, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return <header className="topbar">
    <div className="topbar-title"><span className="eyebrow">CLOUD MANAGEMENT CONSOLE</span><strong>CloudOps Dashboard</strong></div>
    <div className="topbar-actions">
      <div className="global-search"><Search size={17}/><span>Buscar recurso o servicio</span></div>
      <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
      <button className="icon-button" aria-label="Notificaciones"><Bell size={18}/><span className="notification-dot"/></button>
      <div className="system-pill"><Activity size={16}/> Sistema estable</div>
      <div className="topbar-user"><div className="topbar-user-info"><strong>{user?.name}</strong><span>{user?.role}</span></div><div className="avatar">{user?.initials}</div><button onClick={logout} className="icon-button" aria-label="Cerrar sesión"><LogOut size={17}/></button></div>
    </div>
  </header>;
}
