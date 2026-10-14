import { Activity, History, Sparkles, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type OperationsTab = 'failures' | 'history' | 'integrations';

export default function OperationsTabs() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const selected = params.get('tab');

  const activeTab: OperationsTab =
    selected === 'history' || selected === 'integrations'
      ? selected
      : 'failures';

  const tabs: {
    id: OperationsTab;
    label: string;
    to: string;
    Icon: LucideIcon;
  }[] = [
    {
      id: 'failures',
      label: 'Simulador de fallos',
      to: '/dashboard/operations?tab=failures',
      Icon: Activity,
    },
    {
      id: 'history',
      label: 'Historial de cambios',
      to: '/dashboard/operations?tab=history',
      Icon: History,
    },
    {
      id: 'integrations',
      label: 'APIs e integraciones',
      to: '/dashboard/operations?tab=integrations',
      Icon: Sparkles,
    },
  ];

  return (
    <nav className="ops-tabs" aria-label="Operaciones y herramientas">
      {tabs.map(({ id, label, to, Icon }) => (
        <Link
          key={id}
          to={to}
          className={activeTab === id ? 'active' : ''}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );
}