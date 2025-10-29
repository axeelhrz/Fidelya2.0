import React from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp } from 'lucide-react';

interface TopBenefitsProps {
  data: Array<{ beneficioId: string; titulo: string; usos: number }>;
}

export const TopBenefits: React.FC<TopBenefitsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No hay beneficios utilizados aún</p>
      </div>
    );
  }

  const maxUsos = Math.max(...data.map(item => item.usos));

  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((beneficio, index) => (
        <motion.div
          key={beneficio.beneficioId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {beneficio.titulo}
              </p>
              <p className="text-xs text-gray-500">
                {beneficio.usos} {beneficio.usos === 1 ? 'uso' : 'usos'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(beneficio.usos / maxUsos) * 100}%` }}
              />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};