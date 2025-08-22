import { NextRequest, NextResponse } from 'next/server';
import { freeWhatsAppService } from '@/services/free-whatsapp.service';

interface WhatsAppRequest {
  to: string;
  message: string;
  title?: string;
  forceProvider?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { to, message, title }: WhatsAppRequest = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Número de teléfono y mensaje son requeridos'
        },
        { status: 400 }
      );
    }

    console.log(`📱 API: Enviando WhatsApp GRATIS a: ${to}`);
    console.log(`📝 API: Mensaje: ${message.substring(0, 50)}...`);
    
    // Enviar usando proveedores gratuitos
    const result = await freeWhatsAppService.sendMessage(to, message, title);

    if (result.success) {
      console.log(`✅ API: WhatsApp enviado exitosamente con ${result.provider}`);
      
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        cost: 0, // ¡Gratis!
        timestamp: result.timestamp
      });
    } else {
      console.error('❌ API: Error enviando WhatsApp:', result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Error desconocido',
          provider: result.provider
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 API: Error crítico enviando WhatsApp:', error);
    
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

// Endpoint para obtener estado de proveedores
export async function GET() {
  try {
    const providers = await freeWhatsAppService.getAvailableProviders();
    
    return NextResponse.json({
      success: true,
      providers,
      timestamp: new Date()
    });
  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo estado de proveedores'
      },
      { status: 500 }
    );
  }
}