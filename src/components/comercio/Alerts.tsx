'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useComercios } from '@/hooks/useComercios';
import { useBeneficios } from '@/hooks/useBeneficios';
import { 
  AlertTriangle, 
  QrCode, 
  Calendar, 
  User, 
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Alerts: React.FC = () => {
  const { comerciosVinculados } = useComercios();
  const comercio = comerciosVinculados && comerciosVinculados.length > 0 ? comerciosVinculados[0] : null;
  const { beneficios } = useBeneficios();
  const router = useRouter();

  // Compute expired beneficios from beneficios array
  const expiredBeneficios = beneficios.filter(
    (b) => {
      if (!b.fechaFin) return false;
      // Firestore Timestamp has a toDate method
      if (typeof b.fechaFin === 'object' && typeof b.fechaFin.toDate === 'function') {
        return b.fechaFin.toDate() < new Date();
      }
      // If it's not a Timestamp, assume it's a string or Date and convert it
      const fechaFinDate = new Date(b.fechaFin as unknown as string | Date);
      return fechaFinDate < new Date();
    }
  );

  // Check for various alert conditions
  const alerts = [];

  // Check if QR is generated (assuming we need to check this)
  const hasQR = true; // This would come from your QR management logic
  if (!hasQR) {
    alerts.push({
      id: 'no-qr',
      type: 'warning',
      icon: QrCode,
      title: '¡Generá tu código QR!',
      message: 'Necesitas un código QR para que los socios puedan validar beneficios.',
      action: 'Generar QR',
      actionPath: '/dashboard/comercio/qr',
      color: '#f59e0b'
    });
  }

  // Check for expired benefits
  if (expiredBeneficios.length > 0) {
    alerts.push({
      id: 'expired-benefits',
      type: 'error',
      icon: Calendar,
      title: 'Beneficios vencidos',
      message: `Tenés ${expiredBeneficios.length} beneficio${expiredBeneficios.length > 1 ? 's' : ''} vencido${expiredBeneficios.length > 1 ? 's' : ''}. Editalos para volver a activarlos.`,
      action: 'Editar beneficios',
      actionPath: '/dashboard/comercio/beneficios',
      color: '#ef4444'
    });
  }

  // Check for incomplete profile
  const isProfileIncomplete = !comercio?.direccion || !comercio?.telefono || !comercio?.descripcion;
  if (isProfileIncomplete) {
    alerts.push({
      id: 'incomplete-profile',
      type: 'info',
      icon: User,
      title: 'Completá tu perfil',
      message: 'Completá los datos de tu comercio para que los socios te encuentren más fácil.',
      action: 'Ir a perfil',
      actionPath: '/dashboard/comercio/perfil',
      color: '#06b6d4'
    });
  }

  // Success message if everything is good
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      type: 'success',
      icon: CheckCircle,
      title: '¡Todo en orden!',
      message: 'Tu comercio está configurado correctamente y listo para recibir validaciones.',
      action: null,
      actionPath: null,
      color: '#10b981'
    });
  }

  const handleAction = (actionPath: string | null) => {
    if (actionPath) {
      router.push(actionPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#ef4444',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: 'white' }} />
        </div>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: '2px'
          }}>
            Alertas y recordatorios
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b'
          }}>
            Mantené tu comercio optimizado
          </p>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {alerts.map((alert, index) => {
          const IconComponent = alert.icon;
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: alert.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent style={{ width: '18px', height: '18px', color: 'white' }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontWeight: 600,
                      color: '#1e293b',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      {alert.title}
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginBottom: alert.action ? '12px' : '0',
                      lineHeight: 1.4
                    }}>
                      {alert.message}
                    </p>

                    {/* Action Button */}
                    {alert.action && (
                      <button
                        onClick={() => handleAction(alert.actionPath)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: `1px solid ${alert.color}`,
                          backgroundColor: 'white',
                          color: alert.color,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = alert.color;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = alert.color;
                        }}
                      >
                        {alert.action}
                        <ArrowRight style={{ width: '12px', height: '12px' }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};