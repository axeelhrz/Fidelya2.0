import axios from 'axios';
import { validateAndFormatPhone } from '@/utils/phone-validator';

interface GreenAPIConfig {
  instanceId: string;
  apiToken: string;
}

interface GreenAPIResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  phoneUsed?: string;
  rawResponse?: unknown;
}

class GreenAPIService {
  private config: GreenAPIConfig | null = null;
  private baseUrl: string;

  constructor() {
    const instanceId = process.env.GREEN_API_INSTANCE_ID;
    const apiToken = process.env.GREEN_API_TOKEN;
    
    if (instanceId && apiToken) {
      this.config = { instanceId, apiToken };
      this.baseUrl = `https://api.green-api.com/waInstance${instanceId}`;
      console.log(`✅ Green API configurado: ${this.baseUrl}`);
    } else {
      this.baseUrl = '';
      console.warn('⚠️ Green API NO configurado. Falta GREEN_API_INSTANCE_ID o GREEN_API_TOKEN');
    }
  }

  /**
   * Formatea el número para Green API
   * Green API espera: 549XXXXXXXXXX (sin +, sin @c.us)
   */
  private formatPhoneForGreenAPI(phone: string): string {
    // Limpiar el número primero (remover TODOS los caracteres no-dígitos)
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Ahora validar y formatear con el validador estándar
    const validation = validateAndFormatPhone(digitsOnly);
    
    if (!validation.isValid) {
      console.error(`❌ Green API: Número inválido: ${phone}`);
      console.error(`❌ Green API: Error: ${validation.error}`);
      throw new Error(`Número de teléfono inválido: ${validation.error}`);
    }

    // El validador devuelve +549XXXXXXXXXX
    // Green API espera 549XXXXXXXXXX (sin el +)
    const formatted = validation.formatted.replace(/^\+/, '');
    
    console.log(`📱 Green API: Número original: ${phone}`);
    console.log(`📱 Green API: Dígitos solo: ${digitsOnly}`);
    console.log(`📱 Green API: Número validado: ${validation.formatted}`);
    console.log(`📱 Green API: Número para API: ${formatted}`);
    
    return formatted;
  }

  async sendMessage(to: string, message: string, title?: string): Promise<GreenAPIResult> {
    try {
      if (!this.config) {
        console.error('❌ Green API: No está configurado');
        return {
          success: false,
          error: 'Green API no está configurado. Verifica GREEN_API_INSTANCE_ID y GREEN_API_TOKEN',
          timestamp: new Date()
        };
      }

      console.log(`\n🚀 Green API: Iniciando envío de mensaje`);
      console.log(`📝 Mensaje: ${message.substring(0, 50)}...`);
      console.log(`👤 Destinatario original: ${to}`);

      // Formatear número para Green API
      let formattedPhone: string;
      try {
        formattedPhone = this.formatPhoneForGreenAPI(to);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Green API: Error formateando número: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
          timestamp: new Date(),
          phoneUsed: to
        };
      }

      // Formatear mensaje con branding
      const formattedMessage = title 
        ? `💣 *Fidelya* 🎁\n\n*${title}*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Beneficios que suman \n🌐 www.fidelya.com.ar`
        : `💣 *Fidelya*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Beneficios que suman`;

      interface SendMessageResponse {
        idMessage?: string;
        error?: string;
        [key: string]: unknown;
      }

      console.log(`📤 Green API: Enviando a ${this.baseUrl}/sendMessage/...`);
      console.log(`📤 Green API: ChatId: ${formattedPhone}@c.us`);

      const response = await axios.post<SendMessageResponse>(
        `${this.baseUrl}/sendMessage/${this.config.apiToken}`,
        {
          chatId: `${formattedPhone}@c.us`,
          message: formattedMessage
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );

      console.log(`📥 Green API: Respuesta recibida:`, response.data);

      if (response.data && response.data.idMessage) {
        console.log(`✅ Green API: Mensaje enviado exitosamente`);
        console.log(`✅ Green API: ID del mensaje: ${response.data.idMessage}`);
        
        return {
          success: true,
          messageId: response.data.idMessage,
          timestamp: new Date(),
          phoneUsed: formattedPhone,
          rawResponse: response.data
        };
      } else if (response.data && response.data.error) {
        console.error(`❌ Green API: Error en respuesta: ${response.data.error}`);
        return {
          success: false,
          error: `Green API error: ${response.data.error}`,
          timestamp: new Date(),
          phoneUsed: formattedPhone,
          rawResponse: response.data
        };
      } else {
        console.error(`❌ Green API: Respuesta inválida (sin idMessage ni error)`);
        return {
          success: false,
          error: 'Respuesta inválida de Green API: no contiene idMessage',
          timestamp: new Date(),
          phoneUsed: formattedPhone,
          rawResponse: response.data
        };
      }

    } catch (error) {
      console.error('❌ Green API: Error crítico:', error);
      
      // Verificar si es un error de axios
      if (error && typeof error === 'object' && 'response' in error && 'config' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
        console.error(`❌ Green API: Status: ${axiosError.response?.status}`);
        console.error(`❌ Green API: Respuesta: ${JSON.stringify(axiosError.response?.data)}`);
        console.error(`❌ Green API: Mensaje: ${axiosError.message}`);
        
        return {
          success: false,
          error: `Green API HTTP ${axiosError.response?.status}: ${axiosError.message}`,
          timestamp: new Date(),
          rawResponse: axiosError.response?.data
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  async getInstanceStatus(): Promise<{ status: string; error?: string; details?: unknown }> {
    try {
      if (!this.config) {
        return { status: 'not_configured', error: 'Green API no está configurado' };
      }

      console.log(`🔍 Green API: Verificando estado de instancia...`);
      
      const response = await axios.get(
        `${this.baseUrl}/getStateInstance/${this.config.apiToken}`,
        { timeout: 10000 }
      );

      console.log(`✅ Green API: Estado recibido:`, response.data);

      const data = response.data as { stateInstance?: string; [key: string]: unknown };
      return { 
        status: data.stateInstance || 'unknown',
        details: response.data
      };
    } catch (error) {
      console.error('❌ Green API: Error verificando estado:', error);
      
      // Verificar si es un error de axios
      if (error && typeof error === 'object' && 'response' in error && 'config' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
        return { 
          status: 'error', 
          error: `HTTP ${axiosError.response?.status}: ${axiosError.message}`,
          details: axiosError.response?.data
        };
      }
      
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  isConfigured(): boolean {
    const configured = this.config !== null;
    if (!configured) {
      console.warn('⚠️ Green API: No está configurado');
    }
    return configured;
  }

  getConfig(): { instanceId?: string; baseUrl: string } {
    return {
      instanceId: this.config?.instanceId,
      baseUrl: this.baseUrl
    };
  }
}

export const greenAPIService = new GreenAPIService();