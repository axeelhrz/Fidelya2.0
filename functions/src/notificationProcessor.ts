import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { enhancedNotificationService } from './services/enhanced-notifications.service';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Función para procesar notificaciones en background
export const processNotificationQueue = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    console.log('🔄 Processing notification queue...');
    
    try {
      // Obtener notificaciones pendientes
      const pendingQuery = db.collection('notificationQueue')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', admin.firestore.Timestamp.now())
        .orderBy('scheduledFor', 'asc')
        .limit(10);

      const snapshot = await pendingQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No pending notifications to process');
        return null;
      }

      console.log(`📤 Processing ${snapshot.docs.length} notifications`);

      // Procesar cada notificación
      const promises = snapshot.docs.map(async (doc) => {
        const queueItem = doc.data() as NotificationQueueItem;
        
        try {
          // Marcar como procesando
          await doc.ref.update({
            status: 'processing',
            processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Enviar notificación
          const result = await enhancedNotificationService.sendNotificationToUser(
            queueItem.notificationId,
            queueItem.recipientId,
            queueItem.notificationData
          );

          // Verificar si algún canal fue exitoso
          const hasSuccess = result.email.success || result.sms.success || result.push.success;

          if (hasSuccess) {
            // Marcar como completado
            await doc.ref.update({
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              result: result,
            });
            console.log(`✅ Successfully processed notification ${queueItem.notificationId}`);
          } else {
            // Programar reintento
            await scheduleRetry(doc.ref, queueItem, 'All delivery channels failed');
          }

        } catch (error) {
          console.error(`❌ Error processing notification ${queueItem.notificationId}:`, error);
          const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error);
          await scheduleRetry(doc.ref, queueItem, errorMessage);
        }
      });

      await Promise.all(promises);
      console.log('✅ Batch processing completed');
      
    } catch (error) {
      console.error('❌ Error in notification queue processor:', error);
    }

    return null;
  });

// Función para limpiar notificaciones expiradas
export const cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('🧹 Cleaning up expired notifications...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Limpiar notificaciones expiradas
      const expiredQuery = db.collection('notifications')
        .where('expiresAt', '<=', now);

      const expiredSnapshot = await expiredQuery.get();
      
      if (!expiredSnapshot.empty) {
        const batch = db.batch();
        expiredSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🗑️ Deleted ${expiredSnapshot.docs.length} expired notifications`);
      }

      // Limpiar registros de entrega antiguos (más de 30 días)
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      const oldDeliveriesQuery = db.collection('notificationDeliveries')
        .where('createdAt', '<=', thirtyDaysAgo)
        .limit(500);

      const oldDeliveriesSnapshot = await oldDeliveriesQuery.get();
      
      if (!oldDeliveriesSnapshot.empty) {
        const batch = db.batch();
        oldDeliveriesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🗑️ Deleted ${oldDeliveriesSnapshot.docs.length} old delivery records`);
      }

      // Limpiar cola de notificaciones completadas/fallidas (más de 7 días)
      const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const oldQueueQuery = db.collection('notificationQueue')
        .where('status', 'in', ['completed', 'failed'])
        .where('updatedAt', '<=', sevenDaysAgo)
        .limit(500);

      const oldQueueSnapshot = await oldQueueQuery.get();
      
      if (!oldQueueSnapshot.empty) {
        const batch = db.batch();
        oldQueueSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🗑️ Deleted ${oldQueueSnapshot.docs.length} old queue items`);
      }

    } catch (error) {
      console.error('❌ Error in cleanup function:', error);
    }

    return null;
  });

// Función auxiliar para programar reintentos
interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  actionUrl?: string;
  actionLabel?: string;
  [key: string]: string | number | boolean | object | undefined;
}

interface NotificationQueueItem {
  notificationId: string;
  recipientId: string;
  notificationData: NotificationData;
  attempts?: number;
  maxAttempts?: number;
  scheduledFor?: admin.firestore.Timestamp;
  status?: string;
  processingStartedAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  result?: {
    email: { success: boolean; [key: string]: unknown };
    sms: { success: boolean; [key: string]: unknown };
    push: { success: boolean; [key: string]: unknown };
  };
  lastError?: string;
}

async function scheduleRetry(
  docRef: admin.firestore.DocumentReference,
  queueItem: NotificationQueueItem,
  errorMessage: string
) {
  const newAttempts = (queueItem.attempts || 0) + 1;
  const maxAttempts = queueItem.maxAttempts || 3;

  if (newAttempts >= maxAttempts) {
    // Máximo de intentos alcanzado
    await docRef.update({
      status: 'failed',
      attempts: newAttempts,
      lastError: errorMessage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`❌ Notification ${queueItem.notificationId} failed after ${newAttempts} attempts`);
  } else {
    // Programar reintento con backoff exponencial
    const retryDelays = [30000, 120000, 300000, 900000, 1800000]; // 30s, 2m, 5m, 15m, 30m
    const delayIndex = Math.min(newAttempts - 1, retryDelays.length - 1);
    const delay = retryDelays[delayIndex];
    const nextRetryAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + delay));

    await docRef.update({
      status: 'pending',
      attempts: newAttempts,
      lastError: errorMessage,
      scheduledFor: nextRetryAt,
      processingStartedAt: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`⏰ Scheduled retry for notification ${queueItem.notificationId} in ${Math.round(delay / 1000)}s (attempt ${newAttempts}/${maxAttempts})`);
  }
}

// Función para manejar webhooks de entrega
export const handleDeliveryWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const events = req.body;
    
    if (!Array.isArray(events)) {
      res.status(400).send('Invalid payload');
      return;
    }

    console.log(`📥 Received ${events.length} delivery events`);

    for (const event of events) {
      try {
        await processDeliveryEvent(event);
      } catch (error) {
        console.error('❌ Error processing delivery event:', error);
      }
    }

    res.status(200).json({ success: true, processed: events.length });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

interface DeliveryEvent {
  event: string;
  tracking_id: string;
  email?: string;
  timestamp?: number;
  reason?: string;
  url?: string;
  [key: string]: unknown;
}

async function processDeliveryEvent(event: DeliveryEvent) {
  const { event: eventType, tracking_id, email, timestamp } = event;
  
  if (!tracking_id) {
    console.warn('⚠️ Event without tracking_id:', event);
    return;
  }

  // Buscar el registro de entrega por tracking_id en metadata
  const deliveriesQuery = db.collection('notificationDeliveries')
    .where('metadata.trackingId', '==', tracking_id)
    .limit(1);

  const snapshot = await deliveriesQuery.get();
  
  if (snapshot.empty) {
    console.warn('⚠️ No delivery record found for tracking_id:', tracking_id);
    return;
  }

  const deliveryDoc = snapshot.docs[0];
  const updates: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  switch (eventType) {
    case 'delivered':
      updates.status = 'delivered';
      updates.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
      console.log(`✅ Email delivered: ${email}`);
      break;
    
    case 'bounce':
    case 'dropped':
      updates.status = 'failed';
      updates.failureReason = `Email ${eventType}: ${event.reason || 'Unknown reason'}`;
      console.log(`❌ Email ${eventType}: ${email}`);
      break;
    
    case 'open':
      updates['metadata.opened'] = true;
      updates['metadata.openedAt'] = timestamp;
      console.log(`👀 Email opened: ${email}`);
      break;
    
    case 'click':
      updates['metadata.clicked'] = true;
      updates['metadata.clickedAt'] = timestamp;
      updates['metadata.clickedUrl'] = event.url;
      console.log(`🔗 Email link clicked: ${email} -> ${event.url}`);
      break;
  }

  await deliveryDoc.ref.update(updates);
  console.log(`📝 Updated delivery record for event ${eventType}`);
}