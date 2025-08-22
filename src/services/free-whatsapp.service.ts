import { whatsAppWebService } from './whatsapp-web.service';
import { callMeBotService } from './callmebot.service';
import { greenAPIService } from './green-api.service';

interface WhatsAppProvider {
  name: string;
  service: {
    sendMessage: (to: string, message: string, title?: string) => Promise<SendResult>;
    isConfigured: () => boolean;
    isAvailable?: () => boolean;
    getInstanceStatus?: () => Promise<{ status: string }>;
    getConnectionStatus?: () => boolean;
    initialize?: () => Promise<boolean>;
    disconnect?: () => Promise<void>;
  };
  isConfigured: () => boolean;
  isAvailable: () => boolean;
  priority: number;
  cost: 'free' | 'paid';
  limitations?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
  fallbackUsed?: boolean;
}

class FreeWhatsAppService {
  private providers: WhatsAppProvider[] = [
    {
      name: 'Green API',
      service: greenAPIService,
      isConfigured: () => greenAPIService.isConfigured(),
      isAvailable: () => true, // Siempre disponible si está configurado
      priority: 1, // Prioridad más alta por ser más confiable
      cost: 'free',
      limitations: '3000 mensajes gratis/mes'
    },
    {
      name: 'CallMeBot',
      service: callMeBotService,
      isConfigured: () => callMeBotService.isConfigured(),
      isAvailable: () => true,
      priority: 2,
      cost: 'free',
      limitations: 'Limitado a números registrados'
    },
    {
      name: 'WhatsApp Web (Baileys)',
      service: whatsAppWebService,
      isConfigured: () => true, // Siempre "configurado"
      isAvailable: () => whatsAppWebService.isAvailable(), // Pero puede no estar disponible
      priority: 3, // Menor prioridad por las dependencias
      cost: 'free',
      limitations: 'Requiere escanear QR y dependencias opcionales'
    }
  ];

  async sendMessage(to: string, message: string, title?: string): Promise<SendResult> {
    console.log('🚀 Iniciando envío con proveedores gratuitos...');
    
    // Ordenar proveedores por prioridad y disponibilidad
    const availableProviders = this.providers
      .filter(p => p.isConfigured() && p.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      console.log('⚠️ No hay proveedores disponibles. Verificando configuración...');
      
      // Mostrar estado de cada proveedor para debugging
      for (const provider of this.providers) {
        console.log(`📋 ${provider.name}:`);
        console.log(`   - Configurado: ${provider.isConfigured()}`);
        console.log(`   - Disponible: ${provider.isAvailable()}`);
        console.log(`   - Limitaciones: ${provider.limitations}`);
      }
      
      return {
        success: false,
        error: 'No hay proveedores de WhatsApp configurados o disponibles. Revisa la configuración.',
        timestamp: new Date()
      };
    }

    console.log(`📋 Proveedores disponibles: ${availableProviders.map(p => p.name).join(', ')}`);

    // Intentar con cada proveedor hasta que uno funcione
    for (let i = 0; i < availableProviders.length; i++) {
      const provider = availableProviders[i];
      
      try {
        console.log(`🔄 Intentando con ${provider.name}...`);
        
        const result = await provider.service.sendMessage(to, message, title);
        
        if (result.success) {
          console.log(`✅ Mensaje enviado exitosamente con ${provider.name}`);
          return {
            ...result,
            provider: provider.name,
            fallbackUsed: i > 0
          };
        } else {
          console.log(`❌ Falló ${provider.name}: ${result.error}`);
          
          // Si no es el último proveedor, continuar con el siguiente
          if (i < availableProviders.length - 1) {
            console.log(`🔄 Intentando con siguiente proveedor...`);
            continue;
          }
        }
      } catch (error) {
        console.error(`💥 Error con ${provider.name}:`, error);
        
        // Si no es el último proveedor, continuar con el siguiente
        if (i < availableProviders.length - 1) {
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los proveedores fallaron
    return {
      success: false,
      error: 'Todos los proveedores de WhatsApp fallaron',
      timestamp: new Date()
    };
  }

  async getAvailableProviders(): Promise<Array<{
    name: string;
    configured: boolean;
    available: boolean;
    cost: string;
    limitations?: string;
    status?: string;
  }>> {
    const results = [];
    
    for (const provider of this.providers) {
      const configured = provider.isConfigured();
      const available = provider.isAvailable();
      let status = 'unknown';
      
      // Verificar estado específico para algunos proveedores
      if (configured && available) {
        if (provider.name === 'Green API') {
          try {
            const statusResult = await greenAPIService.getInstanceStatus();
            status = statusResult.status;
          } catch {
            status = 'error';
          }
        } else if (provider.name === 'WhatsApp Web (Baileys)') {
          status = whatsAppWebService.getConnectionStatus() ? 'connected' : 'disconnected';
        } else {
          status = 'ready';
        }
      } else if (!available) {
        status = 'dependencies_missing';
      } else if (!configured) {
        status = 'not_configured';
      }
      
      results.push({
        name: provider.name,
        configured,
        available,
        cost: provider.cost,
        limitations: provider.limitations,
        status
      });
    }
    
    return results;
  }

  async initializeWhatsAppWeb(): Promise<boolean> {
    try {
      return await whatsAppWebService.initialize();
    } catch (error) {
      console.error('Error inicializando WhatsApp Web:', error);
      return false;
    }
  }

  async disconnectWhatsAppWeb(): Promise<void> {
    await whatsAppWebService.disconnect();
  }
}

export const freeWhatsAppService = new FreeWhatsAppService();