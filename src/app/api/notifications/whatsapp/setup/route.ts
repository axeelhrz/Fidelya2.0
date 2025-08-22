import { NextRequest, NextResponse } from 'next/server';
import { freeWhatsAppService } from '@/services/free-whatsapp.service';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'initialize':
        console.log('🔄 Inicializando WhatsApp Web...');
        const initialized = await freeWhatsAppService.initializeWhatsAppWeb();
        
        return NextResponse.json({
          success: initialized,
          message: initialized 
            ? 'WhatsApp Web inicializado. Escanea el QR en la consola del servidor.'
            : 'Error inicializando WhatsApp Web'
        });

      case 'disconnect':
        console.log('🔌 Desconectando WhatsApp Web...');
        await freeWhatsAppService.disconnectWhatsAppWeb();
        
        return NextResponse.json({
          success: true,
          message: 'WhatsApp Web desconectado'
        });

      case 'status':
        const providers = await freeWhatsAppService.getAvailableProviders();
        
        return NextResponse.json({
          success: true,
          providers
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error en setup WhatsApp:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error en configuración de WhatsApp'
      },
      { status: 500 }
    );
  }
}
