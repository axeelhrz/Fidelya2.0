import React from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Gift, BarChart3, Bell, FileText, Settings } from 'lucide-react';

interface SectionTabsProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  activeSection,
  onSectionChange
}) => {
  const tabs = [
    {
      id: 'socios',
      label: 'Gestión de Socios',
      icon: Users,
      color: 'blue',
      description: 'Administrar miembros'
    },
    {
      id: 'comercios',
      label: 'Gestión de Comercios',
      icon: Store,
      color: 'green',
      description: 'Red de comercios afiliados'
    },
    {
      id: 'beneficios',
      label: 'Gestión de Beneficios',
      icon: Gift,
      color: 'purple',
      description: 'Ofertas y promociones'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'indigo',
      description: 'Métricas y análisis'
    },
    {
      id: 'notificaciones',
      label: 'Comunicación',
      icon: Bell,
      color: 'orange',
      description: 'Centro de notificaciones'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: FileText,
      color: 'gray',
      description: 'Informes detallados'
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      color: 'slate',
      description: 'Ajustes del sistema'
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: {
        active: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100',
        inactive: 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border-transparent hover:border-blue-200'
      },
      green: {
        active: 'bg-green-50 text-green-700 border-green-200 shadow-green-100',
        inactive: 'text-gray-600 hover:bg-green-50 hover:text-green-600 border-transparent hover:border-green-200'
      },
      purple: {
        active: 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100',
        inactive: 'text-gray-600 hover:bg-purple-50 hover:text-purple-600 border-transparent hover:border-purple-200'
      },
      indigo: {
        active: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100',
        inactive: 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-transparent hover:border-indigo-200'
      },
      orange: {
        active: 'bg-orange-50 text-orange-700 border-orange-200 shadow-orange-100',
        inactive: 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 border-transparent hover:border-orange-200'
      },
      gray: {
        active: 'bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100',
        inactive: 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 border-transparent hover:border-gray-200'
      },
      slate: {
        active: 'bg-slate-50 text-slate-700 border-slate-200 shadow-slate-100',
        inactive: 'text-gray-600 hover:bg-slate-50 hover:text-slate-600 border-transparent hover:border-slate-200'
      }
    };

    return colorMap[color as keyof typeof colorMap]?.[isActive ? 'active' : 'inactive'] || colorMap.gray[isActive ? 'active' : 'inactive'];
  };

  const getIconColorClasses = (color: string, isActive: boolean) => {
    const iconColorMap = {
      blue: isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500',
      green: isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500',
      purple: isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500',
      indigo: isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500',
      orange: isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500',
      gray: isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500',
      slate: isActive ? 'text-slate-600' : 'text-gray-400 group-hover:text-slate-500'
    };

    return iconColorMap[color as keyof typeof iconColorMap] || iconColorMap.gray;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona tu asociación desde un solo lugar</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeSection === tab.id || activeSection.startsWith(tab.id + '-');
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 whitespace-nowrap min-w-fit ${getColorClasses(tab.color, isActive)}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? `bg-${tab.color}-100` 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <tab.icon className={`w-4 h-4 ${getIconColorClasses(tab.color, isActive)}`} />
                </div>
                
                <div className="text-left">
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-xl border-2 border-${tab.color}-300 bg-${tab.color}-50/50`}
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Quick Actions for Active Section */}
        {(activeSection === 'socios' || activeSection.startsWith('socios-')) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center space-x-3"
          >
            <span className="text-sm text-gray-500">Acciones rápidas:</span>
            <button
              onClick={() => onSectionChange('socios-nuevo')}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
            >
              + Nuevo Socio
            </button>
            <button
              onClick={() => onSectionChange('socios-importar')}
              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
            >
              📥 Importar CSV
            </button>
            <button
              onClick={() => onSectionChange('comercios')}
              className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              🏪 Ir a Comercios
            </button>
          </motion.div>
        )}

        {(activeSection === 'comercios' || activeSection.startsWith('comercios-')) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center space-x-3"
          >
            <span className="text-sm text-gray-500">Acciones rápidas:</span>
            <button
              onClick={() => onSectionChange('comercios-vincular')}
              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
            >
              + Vincular Comercio
            </button>
            <button
              onClick={() => onSectionChange('comercios-solicitudes')}
              className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              📋 Ver Solicitudes
            </button>
            <button
              onClick={() => onSectionChange('socios')}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
            >
              👥 Ir a Socios
            </button>
          </motion.div>
        )}

        {(activeSection === 'beneficios' || activeSection.startsWith('beneficios-')) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center space-x-3"
          >
            <span className="text-sm text-gray-500">Acciones rápidas:</span>
            <button
              onClick={() => onSectionChange('beneficios-crear')}
              className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors"
            >
              + Crear Beneficio
            </button>
            <button
              onClick={() => onSectionChange('beneficios-validaciones')}
              className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              ✅ Ver Validaciones
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
