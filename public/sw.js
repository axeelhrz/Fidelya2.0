// Service Worker para manejar push notifications
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  if (!event.data) {
    console.warn('⚠️ Push event without data');
    return;
  }

  try {
    const data = event.data.json();
    const { notification, data: customData } = data;
    
    const options = {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      badge: notification.badge || '/favicon.ico',
      tag: notification.tag || 'fidelita-notification',
      requireInteraction: customData?.priority === 'urgent',
      actions: customData?.actionUrl ? [
        {
          action: 'view',
          title: 'Ver más',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Descartar',
          icon: '/favicon.ico'
        }
      ] : [],
      data: customData
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  } catch (error) {
    console.error('❌ Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  
  if (action === 'dismiss') {
    return;
  }
  
  const urlToOpen = action === 'view' && data?.actionUrl 
    ? data.actionUrl 
    : '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event);
  
  // Aquí podrías enviar analytics sobre notificaciones cerradas
  const { data } = event.notification;
  if (data?.tracking_id) {
    // Enviar evento de cierre al servidor
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_id: data.tracking_id })
    }).catch(console.error);
  }
});
