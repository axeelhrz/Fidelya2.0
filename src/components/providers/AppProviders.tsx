'use client';

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from './ToastProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
};
