'use client';

import { Suspense } from 'react';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

/**
 * Componente interno que usa useSearchParams
 */
function AnalyticsTrackerContent() {
  useGoogleAnalytics();
  return null;
}

/**
 * Componente que rastrea automáticamente las navegaciones de página
 * Debe ser usado dentro de un componente cliente
 * Envuelto en Suspense para cumplir con los requisitos de Next.js
 */
export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerContent />
    </Suspense>
  );
}
