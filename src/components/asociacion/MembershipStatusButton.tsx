'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';

interface MembershipStatusButtonProps {
  className?: string;
  showDetails?: boolean;
}

export const MembershipStatusButton: React.FC<MembershipStatusButtonProps> = ({
  className = '',
  showDetails = true
}) => {
  const {
    isUpdating,
    lastUpdateTime,
    updateCount,
    error,
    updateMembershipStatus
  } = useMembershipStatus();

  const handleManualUpdate = () => {
    if (!isUpdating) {
      updateMembershipStatus();
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Manual Update Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleManualUpdate}
        disabled={isUpdating}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl
          ${isUpdating 
            ? 'bg-blue-100 text-blue-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
          }
        `}
      >
        <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
        <span className="text-sm">
          {isUpdating ? 'Actualizando...' : 'Actualizar Membresías'}
        </span>
      </motion.button>

      {/* Status Details */}
      {showDetails && (
        <div className="flex items-center space-x-4">
          {/* Last Update Info */}
          {lastUpdateTime && !isUpdating && (
            <div className="flex items-center space-x-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <div className="text-xs">
                <div>Última actualización:</div>
                <div className="font-medium">
                  {lastUpdateTime.toLocaleTimeString()}
                  {updateCount > 0 && (
                    <span className="ml-1 text-blue-600">
                      ({updateCount} actualizadas)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {lastUpdateTime && updateCount === 0 && !isUpdating && !error && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Todas las membresías están actualizadas</span>
            </div>
          )}

          {/* Error Indicator */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Error en actualización</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};