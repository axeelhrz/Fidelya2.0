'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Search,
  Clock,
  Calendar,
  User,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMembershipStatusSync } from '@/hooks/useMembershipStatusSync';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface InconsistentSocio {
  socioId: string;
  nombre: string;
  currentStatus: string;
  calculatedStatus: string;
  fechaVencimiento: Date | null;
}

interface MembershipStatusSyncToolProps {
  asociacionId?: string;
  onStatusUpdated?: () => void;
}

export const MembershipStatusSyncTool: React.FC<MembershipStatusSyncToolProps> = ({
  asociacionId: propAsociacionId,
  onStatusUpdated
}) => {
  const { user } = useAuth();
  const {
    syncing,
    syncAssociationStatuses,
    diagnoseInconsistencies,
    syncSocioStatus,
  } = useMembershipStatusSync();

  const [inconsistentSocios, setInconsistentSocios] = useState<InconsistentSocio[]>([]);
  const [totalSocios, setTotalSocios] = useState(0);
  const [diagnosing, setDiagnosing] = useState(false);
  const [lastDiagnosis, setLastDiagnosis] = useState<Date | null>(null);
  const [syncingIndividual, setSyncingIndividual] = useState<string | null>(null);

  const asociacionId = propAsociacionId || user?.uid;

  // Auto-diagnose on component mount
  useEffect(() => {
    if (asociacionId && !diagnosing && !lastDiagnosis) {
      handleDiagnose();
    }
  }, [asociacionId]);

  const handleDiagnose = async () => {
    if (!asociacionId || diagnosing) return;

    try {
      setDiagnosing(true);
      console.log('🔍 Starting diagnosis...');

      const result = await diagnoseInconsistencies(asociacionId);
      
      setInconsistentSocios(result.inconsistentSocios);
      setTotalSocios(result.totalSocios);
      setLastDiagnosis(new Date());

      console.log('🔍 Diagnosis completed:', {
        totalSocios: result.totalSocios,
        inconsistentSocios: result.inconsistentSocios.length
      });
    } catch (error) {
      console.error('❌ Error during diagnosis:', error);
      toast.error('Error al diagnosticar inconsistencias');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSyncAll = async () => {
    if (!asociacionId || syncing) return;

    try {
      console.log('🔄 Starting bulk sync...');
      
      const result = await syncAssociationStatuses(asociacionId);
      
      if (result.synced > 0) {
        // Re-diagnose after sync to update the list
        await handleDiagnose();
        onStatusUpdated?.();
      }

      console.log('✅ Bulk sync completed:', result);
    } catch (error) {
      console.error('❌ Error during bulk sync:', error);
    }
  };

  const handleSyncIndividual = async (socioId: string) => {
    if (syncingIndividual || syncing) return;

    try {
      setSyncingIndividual(socioId);
      console.log(`🔄 Syncing individual socio: ${socioId}`);

      const success = await syncSocioStatus(socioId);
      
      if (success) {
        // Remove from inconsistent list and re-diagnose
        setInconsistentSocios(prev => prev.filter(s => s.socioId !== socioId));
        onStatusUpdated?.();
      }
    } catch (error) {
      console.error('❌ Error syncing individual socio:', error);
    } finally {
      setSyncingIndividual(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'al_dia':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'vencido':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'pendiente':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'al_dia':
        return 'Al día';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      default:
        return status;
    }
  };

  if (!asociacionId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">No se pudo identificar la asociación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
              <h3 className="text-xl font-bold text-gray-900">
                Sincronización de Estados
              </h3>
              <p className="text-sm text-gray-600">
                Herramienta para corregir inconsistencias en estados de membresía
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDiagnose}
              disabled={diagnosing || syncing}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Search className={`w-4 h-4 ${diagnosing ? 'animate-spin' : ''}`} />
              <span>Diagnosticar</span>
            </Button>
            
            {inconsistentSocios.length > 0 && (
              <Button
                onClick={handleSyncAll}
                disabled={syncing || diagnosing}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar Todo</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalSocios}</p>
                <p className="text-sm text-gray-600">Total Socios</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{inconsistentSocios.length}</p>
                <p className="text-sm text-red-600">Inconsistencias</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {totalSocios - inconsistentSocios.length}
                </p>
                <p className="text-sm text-green-600">Correctos</p>
              </div>
            </div>
          </div>
        </div>

        {lastDiagnosis && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              Último diagnóstico: {lastDiagnosis.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Inconsistent Socios List */}
      <div className="p-6">
        {diagnosing ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Diagnosticando inconsistencias...</p>
          </div>
        ) : inconsistentSocios.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Todo está sincronizado!
            </h4>
            <p className="text-gray-600">
              No se encontraron inconsistencias en los estados de membresía
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Socios con Inconsistencias
              </h4>
              <span className="text-sm text-gray-500">
                {inconsistentSocios.length} encontrados
              </span>
            </div>

            <div className="space-y-3">
              {inconsistentSocios.map((socio, index) => (
                <motion.div
                  key={socio.socioId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{socio.nombre}</h5>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Actual:</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(socio.currentStatus)}`}>
                              {getStatusText(socio.currentStatus)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Debería ser:</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(socio.calculatedStatus)}`}>
                              {getStatusText(socio.calculatedStatus)}
                            </span>
                          </div>
                        </div>
                        {socio.fechaVencimiento && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Vence: {socio.fechaVencimiento.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSyncIndividual(socio.socioId)}
                      disabled={syncingIndividual === socio.socioId || syncing}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {syncingIndividual === socio.socioId ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Corregir
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with instructions */}
      {inconsistentSocios.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">¿Qué hace esta herramienta?</h5>
              <p className="text-sm text-blue-700 mt-1">
                Detecta y corrige automáticamente las diferencias entre el estado mostrado en la administración 
                y el que ve el socio en su dispositivo móvil. Los estados se calculan basándose en la fecha de vencimiento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};