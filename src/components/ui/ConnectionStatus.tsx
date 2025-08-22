'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Signal } from 'lucide-react';

// Type definition for navigator.connection
type NetworkInformation = {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  onchange?: (() => void) | null;
};

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check connection quality
    const checkConnectionQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator.connection as NetworkInformation | undefined);
        if (connection) {
          const effectiveType = connection.effectiveType;
          switch (effectiveType) {
            case '4g':
              setConnectionQuality('excellent');
              break;
            case '3g':
              setConnectionQuality('good');
              break;
            default:
              setConnectionQuality('poor');
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    checkConnectionQuality();

    // Periodic sync update
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        setLastSync(new Date());
      }
    }, 30000); // Update every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50 border-red-200';
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'good':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={14} />;
    return <Wifi size={14} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    switch (connectionQuality) {
      case 'excellent':
        return 'Excelente';
      case 'good':
        return 'Buena';
      case 'poor':
        return 'Limitada';
      default:
        return 'Conectado';
    }
  };

  const formatLastSync = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ${getStatusColor()} ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-bold">{getStatusText()}</span>
        </div>
        
        <div className="w-px h-4 bg-current opacity-30" />
        
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Signal size={12} />
          <span>{formatLastSync()}</span>
        </div>
        
        {isOnline && (
          <motion.div
            className="w-2 h-2 rounded-full bg-current opacity-60"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
