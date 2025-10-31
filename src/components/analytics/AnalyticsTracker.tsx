'use client';

import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

/**
 * Componente que rastrea automáticamente las navegaciones de página
 * Debe ser usado dentro de un componente cliente
 */
export function AnalyticsTracker() {
  useGoogleAnalytics();
  return null;
}
