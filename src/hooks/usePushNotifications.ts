'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useAuth();

  // Verificar soporte para push notifications
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Registrar service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported) {
      console.warn('⚠️ Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  // Guardar token en Firestore
  const saveTokenToFirestore = useCallback(async (fcmToken: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(fcmToken),
        lastTokenUpdate: new Date()
      });
      console.log('✅ FCM token saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }, [user?.uid]);

  // Solicitar permisos y obtener token FCM
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas en este navegador');
      return null;
    }

    setIsRegistering(true);

    try {
      // Solicitar permiso
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Permisos de notificación denegados');
        return null;
      }

      // Registrar service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('Error al registrar el service worker');
        return null;
      }

      // Obtener token FCM (esto requiere Firebase SDK)
      const { getMessaging, getToken } = await import('firebase/messaging');
      const messaging = getMessaging();
      
      const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
      if (!vapidKey) {
        console.error('❌ VAPID key not configured');
        toast.error('Configuración de push notifications incompleta');
        return null;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (fcmToken) {
        setToken(fcmToken);
        console.log('✅ FCM token obtained:', fcmToken);
        
        // Guardar token en Firestore
        if (user?.uid) {
          await saveTokenToFirestore(fcmToken);
        }
        
        toast.success('Notificaciones push activadas');
        return fcmToken;
      } else {
        console.warn('⚠️ No FCM token available');
        toast.error('No se pudo obtener el token de notificaciones');
        return null;
      }
    } catch (error) {
      console.error('❌ Error requesting push permission:', error);
      toast.error('Error al configurar las notificaciones push');
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported, user?.uid, registerServiceWorker, saveTokenToFirestore]);

  // Remover token de Firestore
  const removeTokenFromFirestore = useCallback(async (fcmToken: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pushTokens: arrayRemove(fcmToken),
        lastTokenUpdate: new Date()
      });
      console.log('✅ FCM token removed from Firestore');
    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
    }
  }, [user?.uid]);

  // Desactivar notificaciones push
  const unsubscribe = useCallback(async () => {
    if (!token) return;

    try {
      setIsRegistering(true);
      
      // Remover token de Firestore
      await removeTokenFromFirestore(token);
      
      // Limpiar estado local
      setToken(null);
      setPermission('default');
      
      toast.success('Notificaciones push desactivadas');
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      toast.error('Error al desactivar las notificaciones push');
    } finally {
      setIsRegistering(false);
    }
  }, [token, removeTokenFromFirestore]);

  // Verificar y actualizar token al cargar
  useEffect(() => {
    const checkExistingToken = async () => {
      if (!isSupported || !user?.uid || permission !== 'granted') return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const { getMessaging, getToken } = await import('firebase/messaging');
        const messaging = getMessaging();
        
        const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
        if (!vapidKey) return;

        const fcmToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });

        if (fcmToken && fcmToken !== token) {
          setToken(fcmToken);
          await saveTokenToFirestore(fcmToken);
        }
      } catch (error) {
        console.error('❌ Error checking existing token:', error);
      }
    };

    checkExistingToken();
  }, [isSupported, user?.uid, permission, token, saveTokenToFirestore]);

  return {
    isSupported,
    permission,
    token,
    isRegistering,
    requestPermission,
    unsubscribe,
    isEnabled: permission === 'granted' && !!token
  };
};
