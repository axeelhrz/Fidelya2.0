'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SocioWelcomeCardProps {
  user: {
    nombre: string;
    numeroSocio?: string;
    avatar?: string;
  };
  onLogout: () => void;
}

export const SocioWelcomeCard: React.FC<SocioWelcomeCardProps> = memo(({ 
  user, 
  onLogout 
}) => {
  // Generar fecha actual en español
  const fechaActual = useMemo(() => {
    const fecha = new Date();
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        {/* Información del usuario */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {user.nombre}
          </h2>
          <p className="text-gray-600 text-sm">
            {fechaActual}
          </p>
        </div>

        {/* Botón de cerrar sesión */}
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      </div>
    </motion.div>
  );
});

SocioWelcomeCard.displayName = 'SocioWelcomeCard';