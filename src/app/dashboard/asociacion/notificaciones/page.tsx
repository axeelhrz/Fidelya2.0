'use client';

import { ModernNotificationCenter } from '@/components/notifications/ModernNotificationCenter';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={['asociacion']}>
      <ModernNotificationCenter />
    </ProtectedRoute>
  );
}