import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Webhook para recibir eventos de entrega de SendGrid
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const signature = request.headers.get('X-Webhook-Signature');

    // Verificar firma del webhook (implementar según el proveedor)
    if (webhookSecret && signature) {
      // Aquí implementarías la verificación de la firma
      // Por ejemplo, para SendGrid sería verificar el hash HMAC
    }

    const events = await request.json();
    
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`📥 Received ${events.length} delivery events`);

    for (const event of events) {
      try {
        await processDeliveryEvent(event);
      } catch (error) {
        console.error('❌ Error processing delivery event:', error);
      }
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface DeliveryEvent {
  event: string;
  tracking_id: string;
  email: string;
  timestamp?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
  url?: string;
}

async function processDeliveryEvent(event: DeliveryEvent) {
  const { event: eventType, tracking_id, email, timestamp } = event;
  
  if (!tracking_id) {
    console.warn('⚠️ Event without tracking_id:', event);
    return;
  }

  // Buscar el registro de entrega por tracking_id
  // En un caso real, tendrías que hacer una consulta a Firestore
  // Por simplicidad, asumimos que el tracking_id contiene el deliveryId
  
  const deliveryId = tracking_id.split('_')[0]; // Extraer deliveryId del tracking_id
  
  if (!deliveryId) {
    console.warn('⚠️ Could not extract deliveryId from tracking_id:', tracking_id);
    return;
  }

  const updates: {
    status?: string;
    deliveredAt?: unknown;
    failureReason?: string;
    metadata?: Record<string, unknown>;
    updatedAt: unknown;
  } = {
    updatedAt: serverTimestamp(),
  };

  switch (eventType) {
    case 'delivered':
      updates.status = 'delivered';
      updates.deliveredAt = serverTimestamp();
      console.log(`✅ Email delivered: ${email}`);
      break;
    
    case 'bounce':
    case 'dropped':
      updates.status = 'failed';
      updates.failureReason = `Email ${eventType}: ${event.reason || 'Unknown reason'}`;
      console.log(`❌ Email ${eventType}: ${email}`);
      break;
    
    case 'open':
      updates.metadata = {
        ...event.metadata,
        opened: true,
        openedAt: timestamp,
      };
      console.log(`👀 Email opened: ${email}`);
      break;
    
    case 'click':
      updates.metadata = {
        ...event.metadata,
        clicked: true,
        clickedAt: timestamp,
        clickedUrl: event.url,
      };
      console.log(`🔗 Email link clicked: ${email} -> ${event.url}`);
      break;
  }

  try {
    await updateDoc(doc(db, 'notificationDeliveries', deliveryId), updates);
    console.log(`📝 Updated delivery record ${deliveryId} for event ${eventType}`);
  } catch (error) {
    console.error(`❌ Error updating delivery record ${deliveryId}:`, error);
  }
}
