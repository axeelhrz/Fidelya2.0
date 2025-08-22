'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
} from 'lucide-react';
import { VincularSocioDialog } from './VincularSocioDialog';
import toast from 'react-hot-toast';

interface AddRegisteredSocioButtonProps {
  onSocioAdded?: () => void;
  className?: string;
}

export const AddRegisteredSocioButton: React.FC<AddRegisteredSocioButtonProps> = ({
  onSocioAdded,
  className = "flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border border-white/20 relative overflow-hidden group"
}) => {
  const [showVincularDialog, setShowVincularDialog] = useState(false);

  const handleSocioAdded = async () => {
    setShowVincularDialog(false);
    if (onSocioAdded) {
      await onSocioAdded();
    }
    toast.success('Socio vinculado exitosamente');
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowVincularDialog(true)}
        className={className}
      >
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <UserPlus className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Vincular Socio Existente</span>
      </motion.button>

      {/* Dialog de vinculación */}
      <VincularSocioDialog
        open={showVincularDialog}
        onClose={() => setShowVincularDialog(false)}
        onSuccess={handleSocioAdded}
      />
    </>
  );
};