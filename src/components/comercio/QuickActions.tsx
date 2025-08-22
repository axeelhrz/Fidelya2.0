import React from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Gift, 
  BarChart3, 
  Settings, 
} from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'generate-qr',
      label: 'Generar QR',
      icon: QrCode,
      color: 'from-blue-500 to-blue-600',
      description: 'Crear código QR',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'view-beneficios',
      label: 'Beneficios',
      icon: Gift,
      color: 'from-green-500 to-emerald-600',
      description: 'Gestionar ofertas',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      id: 'view-analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      description: 'Ver estadísticas',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'view-profile',
      label: 'Perfil',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      description: 'Configurar cuenta',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction(action.id)}
          className={`
            relative p-6 rounded-2xl bg-gradient-to-br ${action.color} 
            text-white shadow-lg hover:shadow-xl transition-all duration-300
            group overflow-hidden
          `}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <action.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">{action.label}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      ))}
    </div>
  );
};