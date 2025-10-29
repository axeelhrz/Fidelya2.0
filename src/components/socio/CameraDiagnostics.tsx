'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Monitor,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CameraDiagnosticsProps {
  isVisible: boolean;
  onClose: () => void;
  cameraError?: {
    name: string;
    message: string;
    constraint?: string;
  } | null;
}

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  solution?: string;
}

const DiagnosticsContainer = styled.div`
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 0.875rem;
`;

const DiagnosticsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  .title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #1e293b;
  }
`;

const DiagnosticsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DiagnosticItem = styled.div<{ status: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid;
  
  ${({ status }) => {
    switch (status) {
      case 'success':
        return `
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border-color: #86efac;
          color: #166534;
        `;
      case 'error':
        return `
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border-color: #fca5a5;
          color: #991b1b;
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-color: #fcd34d;
          color: #92400e;
        `;
      case 'info':
        return `
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border-color: #93c5fd;
          color: #1e40af;
        `;
    }
  }}
  
  .icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .content {
    flex: 1;
    min-width: 0;
    
    .name {
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .message {
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    
    .details {
      font-size: 0.75rem;
      opacity: 0.8;
      font-family: monospace;
      background: rgba(0, 0, 0, 0.1);
      padding: 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      word-break: break-all;
    }
    
    .solution {
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.9;
    }
  }
`;

const SystemInfo = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  
  .info-title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.75rem;
    
    .info-item {
      display: flex;
      justify-content: space-between;
      
      .label {
        color: #64748b;
        font-weight: 600;
      }
      
      .value {
        color: #1e293b;
        font-weight: 700;
        text-align: right;
      }
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

export const CameraDiagnostics: React.FC<CameraDiagnosticsProps> = ({
  isVisible,
  onClose,
  cameraError
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});

  const runDiagnostics = React.useCallback(async () => {
    const results: DiagnosticResult[] = [];

    // 1. Verificar HTTPS
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    results.push({
      name: 'Conexión Segura (HTTPS)',
      status: isHTTPS ? 'success' : 'error',
      message: isHTTPS 
        ? 'La conexión es segura' 
        : 'Se requiere HTTPS para acceder a la cámara',
      solution: !isHTTPS ? 'Accede al sitio usando HTTPS' : undefined
    });

    // 2. Verificar MediaDevices API
    const hasMediaDevices = !!(navigator.mediaDevices);
    results.push({
      name: 'MediaDevices API',
      status: hasMediaDevices ? 'success' : 'error',
      message: hasMediaDevices 
        ? 'API de medios disponible' 
        : 'API de medios no disponible',
      solution: !hasMediaDevices ? 'Actualiza tu navegador a una versión más reciente' : undefined
    });

    // 3. Verificar getUserMedia
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
    results.push({
      name: 'getUserMedia',
      status: hasGetUserMedia ? 'success' : 'error',
      message: hasGetUserMedia 
        ? 'Función de acceso a cámara disponible' 
        : 'Función de acceso a cámara no disponible',
      solution: !hasGetUserMedia ? 'Tu navegador no soporta acceso a la cámara' : undefined
    });

    // 4. Verificar dispositivos de cámara
    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        results.push({
          name: 'Cámaras Detectadas',
          status: cameras.length > 0 ? 'success' : 'warning',
          message: `${cameras.length} cámara(s) encontrada(s)`,
          details: cameras.map(cam => cam.label || 'Cámara sin nombre').join(', ') || 'Sin detalles disponibles',
          solution: cameras.length === 0 ? 'Conecta una cámara o verifica que esté funcionando' : undefined
        });
      } catch (error) {
        results.push({
          name: 'Detección de Cámaras',
          status: 'error',
          message: 'Error al detectar cámaras',
          details: (error as Error).message,
          solution: 'Verifica los permisos del navegador'
        });
      }
    }

    // 5. Verificar permisos
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        results.push({
          name: 'Permisos de Cámara',
          status: permission.state === 'granted' ? 'success' : 
                  permission.state === 'denied' ? 'error' : 'warning',
          message: `Estado: ${permission.state}`,
          solution: permission.state === 'denied' ? 
            'Ve a configuración del navegador y permite el acceso a la cámara' : 
            permission.state === 'prompt' ? 'Se solicitarán permisos al usar la cámara' : undefined
        });
      } catch {
        results.push({
          name: 'Verificación de Permisos',
          status: 'info',
          message: 'No se pudo verificar el estado de permisos',
          details: 'Esto es normal en algunos navegadores'
        });
      }
    }

    // 6. Verificar constraints soportadas
    if (navigator.mediaDevices?.getSupportedConstraints) {
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      const importantConstraints = ['facingMode', 'torch', 'width', 'height', 'frameRate'];
      const supported = importantConstraints.filter(c => constraints[c as keyof MediaTrackSupportedConstraints]);
      
      results.push({
        name: 'Características Soportadas',
        status: supported.length > 2 ? 'success' : 'warning',
        message: `${supported.length}/${importantConstraints.length} características soportadas`,
        details: `Soportadas: ${supported.join(', ')}`,
        solution: supported.length < 2 ? 'Tu dispositivo tiene soporte limitado para cámara' : undefined
      });
    }

    // 7. Información del error actual
    if (cameraError) {
      results.push({
        name: 'Error Actual',
        status: 'error',
        message: getErrorDescription(cameraError.name),
        details: `${cameraError.name}: ${cameraError.message}`,
        solution: getErrorSolution(cameraError.name)
      });
    }

    setDiagnostics(results);
  }, [cameraError]);

  const collectSystemInfo = React.useCallback(() => {
    const info: Record<string, string> = {};
    
    // Información del navegador
    info['Navegador'] = getBrowserName();
    info['User Agent'] = navigator.userAgent.substring(0, 50) + '...';
    info['Plataforma'] = navigator.platform;
    info['Idioma'] = navigator.language;
    
    // Información de la pantalla
    info['Resolución'] = `${screen.width}x${screen.height}`;
    info['Densidad'] = `${window.devicePixelRatio}x`;
    
    // Información de la conexión
    // Minimal NetworkInformation type for TypeScript
    type NetworkInformation = {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection) {
      info['Conexión'] = connection.effectiveType || 'Desconocida';
    }
    
    // Información del dispositivo
    info['Tipo'] = /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Desktop';
    info['Touch'] = 'ontouchstart' in window ? 'Sí' : 'No';
    
    setSystemInfo(info);
  }, []);

  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Desconocido';
  };

  const getErrorDescription = (errorName: string): string => {
    switch (errorName) {
      case 'NotAllowedError':
        return 'Permisos denegados por el usuario';
      case 'NotFoundError':
        return 'No se encontró ninguna cámara';
      case 'NotReadableError':
        return 'Cámara en uso por otra aplicación';
      case 'OverconstrainedError':
        return 'Configuración no soportada';
      case 'SecurityError':
        return 'Error de seguridad';
      case 'AbortError':
        return 'Operación cancelada';
      default:
        return 'Error desconocido';
    }
  };

  const getErrorSolution = (errorName: string): string => {
    switch (errorName) {
      case 'NotAllowedError':
        return 'Permite el acceso a la cámara en la configuración del navegador';
      case 'NotFoundError':
        return 'Conecta una cámara o verifica que esté funcionando';
      case 'NotReadableError':
        return 'Cierra otras aplicaciones que usen la cámara';
      case 'SecurityError':
        return 'Asegúrate de usar HTTPS';
      default:
        return 'Intenta recargar la página';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <XCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
    }
  };

  const copyDiagnostics = () => {
    const diagnosticsText = diagnostics.map(d => 
      `${d.name}: ${d.status.toUpperCase()} - ${d.message}${d.details ? ` (${d.details})` : ''}`
    ).join('\n');
    
    const systemInfoText = Object.entries(systemInfo).map(([key, value]) => 
      `${key}: ${value}`
    ).join('\n');
    
    const fullReport = `DIAGNÓSTICO DE CÁMARA\n\n${diagnosticsText}\n\nINFORMACIÓN DEL SISTEMA\n${systemInfoText}`;
    
    navigator.clipboard.writeText(fullReport).then(() => {
      alert('Diagnóstico copiado al portapapeles');
    }).catch(() => {
      console.log('Diagnóstico:', fullReport);
      alert('No se pudo copiar. Revisa la consola del navegador.');
    });
  };

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
      collectSystemInfo();
    }
  }, [isVisible, cameraError, runDiagnostics, collectSystemInfo]);

  if (!isVisible) return null;

  return (
    <DiagnosticsContainer>
      <DiagnosticsHeader>
        <div className="title">
          <Settings size={16} />
          Diagnóstico de Cámara
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </DiagnosticsHeader>

      <DiagnosticsList>
        {diagnostics.map((diagnostic, index) => (
          <DiagnosticItem key={index} status={diagnostic.status}>
            <div className="icon">
              {getStatusIcon(diagnostic.status)}
            </div>
            <div className="content">
              <div className="name">{diagnostic.name}</div>
              <div className="message">{diagnostic.message}</div>
              {diagnostic.details && (
                <div className="details">{diagnostic.details}</div>
              )}
              {diagnostic.solution && (
                <div className="solution">💡 {diagnostic.solution}</div>
              )}
            </div>
          </DiagnosticItem>
        ))}
      </DiagnosticsList>

      <SystemInfo>
        <div className="info-title">
          <Monitor size={14} />
          Información del Sistema
        </div>
        <div className="info-grid">
          {Object.entries(systemInfo).map(([key, value]) => (
            <div key={key} className="info-item">
              <span className="label">{key}:</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>
      </SystemInfo>

      <ActionButtons>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            runDiagnostics();
            collectSystemInfo();
          }}
          leftIcon={<RefreshCw size={14} />}
        >
          Actualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyDiagnostics}
          leftIcon={<Info size={14} />}
        >
          Copiar Reporte
        </Button>
      </ActionButtons>
    </DiagnosticsContainer>
  );
};
