'use client';

import React from 'react';
import { useValidaciones } from '@/hooks/useValidaciones';
import { useComercio } from '@/hooks/useComercio';
import { useAuth } from '@/hooks/useAuth';

export const ValidacionesDebug: React.FC = () => {
  const { user } = useAuth();
  const { validaciones, loading: validacionesLoading, getStats } = useValidaciones();
  const { stats: comercioStats, loading: comercioLoading } = useComercio();

  const validacionesStats = getStats();

  if (!user) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="font-bold text-red-800">Debug: Usuario no autenticado</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-bold text-gray-800">🔍 Debug de Validaciones</h3>
      
      {/* Info del Usuario */}
      <div className="bg-blue-50 p-3 rounded">
        <h4 className="font-semibold text-blue-800">Usuario Actual:</h4>
        <p><strong>ID:</strong> {user.uid}</p>
        <p><strong>Rol:</strong> {user.role}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Nombre:</strong> {user.nombre}</p>
      </div>

      {/* Stats del Hook useValidaciones */}
      <div className="bg-green-50 p-3 rounded">
        <h4 className="font-semibold text-green-800">Hook useValidaciones:</h4>
        <p><strong>Loading:</strong> {validacionesLoading ? 'Sí' : 'No'}</p>
        <p><strong>Total Validaciones:</strong> {validaciones.length}</p>
        <p><strong>Validaciones Exitosas:</strong> {validacionesStats.validacionesExitosas}</p>
        <p><strong>Validaciones Fallidas:</strong> {validacionesStats.validacionesFallidas}</p>
        <p><strong>Clientes Únicos:</strong> {validacionesStats.clientesUnicos}</p>
        <p><strong>Monto Total Descuentos:</strong> ${validacionesStats.montoTotalDescuentos}</p>
      </div>

      {/* Stats del Hook useComercio */}
      {user.role === 'comercio' && (
        <div className="bg-purple-50 p-3 rounded">
          <h4 className="font-semibold text-purple-800">Hook useComercio:</h4>
          <p><strong>Loading:</strong> {comercioLoading ? 'Sí' : 'No'}</p>
          {comercioStats ? (
            <>
              <p><strong>Validaciones Hoy:</strong> {comercioStats.validacionesHoy}</p>
              <p><strong>Validaciones Mes:</strong> {comercioStats.validacionesMes}</p>
              <p><strong>Clientes Únicos:</strong> {comercioStats.clientesUnicos}</p>
              <p><strong>Beneficios Activos:</strong> {comercioStats.beneficiosActivos}</p>
              <p><strong>Ingresos Mensuales:</strong> ${comercioStats.ingresosMensuales}</p>
            </>
          ) : (
            <p>No hay stats disponibles</p>
          )}
        </div>
      )}

      {/* Lista de Validaciones */}
      <div className="bg-yellow-50 p-3 rounded">
        <h4 className="font-semibold text-yellow-800">Últimas Validaciones:</h4>
        {validaciones.length === 0 ? (
          <p className="text-yellow-700">No hay validaciones</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {validaciones.slice(0, 5).map((validacion, index) => (
              <div key={validacion.id} className="bg-white p-2 rounded border text-sm">
                <p><strong>#{index + 1}</strong> - ID: {validacion.id}</p>
                <p><strong>Comercio:</strong> {validacion.comercioNombre}</p>
                <p><strong>Socio:</strong> {validacion.socioNombre}</p>
                <p><strong>Estado:</strong> {validacion.resultado}</p>
                <p><strong>Fecha:</strong> {validacion.fechaHora.toDate().toLocaleString()}</p>
                <p><strong>Monto:</strong> ${validacion.montoDescuento}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón de Refresh */}
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Recargar Página
        </button>
      </div>
    </div>
  );
};