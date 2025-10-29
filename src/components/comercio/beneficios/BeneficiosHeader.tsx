'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';

interface BeneficiosHeaderProps {
  totalBeneficios: number;
  beneficiosActivos: number;
}

export const BeneficiosHeader: React.FC<BeneficiosHeaderProps> = ({
  totalBeneficios,
  beneficiosActivos
}) => {
  return (
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-lg">
        <Gift className="w-10 h-10 text-white" />
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </motion.div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
        Gestión de Beneficios
      </h1>
      
      <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-4">
        Crea y administra beneficios atractivos para fidelizar a tus clientes
      </p>
      
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{totalBeneficios} beneficios totales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{beneficiosActivos} activos</span>
        </div>
      </div>
    </motion.div>
  );
};