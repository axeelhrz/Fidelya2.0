'use client';

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { notificationInitService } from '@/lib/notification-init';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  useEffect(() => {
    // Initialize notification system on client side
    const initializeNotifications = async () => {
      try {
        await notificationInitService.initialize({
          enableBrowserNotifications: true,
          enableSounds: true,
          maxRetries: 3,
        });
      } catch (error) {
        console.error('Failed to initialize notification system:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationInitService.shutdown();
    };
  }, []);

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid #d1fae5',
              background: '#f0fdf4',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid #fecaca',
              background: '#fef2f2',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid #c7d2fe',
              background: '#f0f4ff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};