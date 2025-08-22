import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AsociacionSidebar } from './AsociacionSidebar';
import { ComercioSidebar } from './ComercioSidebar';
import { SocioSidebar } from './SocioSidebar';

interface DashboardSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = (props) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  switch (user.role) {
    case 'asociacion':
      return <AsociacionSidebar {...props} />;
    case 'comercio':
      return <ComercioSidebar {...props} />;
    case 'socio':
      return <SocioSidebar {...props} />;
    default:
      return null;
  }
};

export default DashboardSidebar;