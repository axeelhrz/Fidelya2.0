import { NextRequest, NextResponse } from 'next/server';
import { greenAPIService } from '@/services/green-api.service';

interface WhatsAppRequest {
  phone?: string;
  to?: string;
  message: string;
  title?: string;
  recipientId?: string;
  recipientName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppRequest = await request.json();
    
    // Aceptar tanto 'phone' como 'to'
    const phoneNumber = body.phone || body.to;
    const { message, title, recipientId, recipientName } = body;

    console.log(`\n📱 WhatsApp API: Solicitud recibida`);
    console.log(`👤 Destinatario: ${recipientName || 'Desconocido'} (${phoneNumber})`);
    console.log(`📝 Mensaje: ${message.substring(0, 50)}...`);

    if (!phoneNumber || !message) {
      console.error('❌ WhatsApp API: Faltan parámetros requeridos');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Número de teléfono y mensaje son requeridos'
        },
        { status: 400 }
      );
    }

    console.log(`🚀 WhatsApp API: Enviando con Green API...`);
    
    // Enviar usando Green API
    const result = await greenAPIService.sendMessage(phoneNumber, message, title);

    if (result.success) {
      console.log(`✅ WhatsApp API: Mensaje enviado exitosamente`);
      console.log(`✅ ID del mensaje: ${result.messageId}`);
      
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        phone: result.phoneUsed,
        recipientId,
        recipientName,
        timestamp: result.timestamp
      });
    } else {
      console.error(`❌ WhatsApp API: Error enviando: ${result.error}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Error desconocido al enviar WhatsApp',
          phone: phoneNumber,
          recipientId,
          recipientName
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 WhatsApp API: Error crítico:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estado de Green API
export async function GET() {
  try {
    const status = await greenAPIService.getInstanceStatus();
    const config = greenAPIService.getConfig();
    
    return NextResponse.json({
      success: true,
      configured: greenAPIService.isConfigured(),
      status,
      config,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ WhatsApp API: Error obteniendo estado:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo estado de Green API',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}