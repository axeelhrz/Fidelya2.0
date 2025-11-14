import axios from 'axios';
import { validateAndFormatPhone } from '@/utils/phone-validator';

interface CallMeBotConfig {
  apiKey: string;
  phone: string; // Tu número de WhatsApp registrado en CallMeBot
}

interface CallMeBotResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  phoneUsed?: string;
  rawResponse?: unknown;
}

class CallMeBotService {
  private config: CallMeBotConfig | null = null;

  constructor() {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const phone = process.env.CALLMEBOT_PHONE;
    
    if (apiKey && phone) {
      this.config = { apiKey, phone };
      console.log(`✅ CallMeBot configurado`);
    } else {
      console.warn('⚠️ CallMeBot NO configurado. Falta CALLMEBOT_API_KEY o CALLMEBOT_PHONE');
    }
  }

  /**
   * Formatea el número para CallMeBot
   * CallMeBot espera: +549XXXXXXXXXX (con +)
   */
  private formatPhoneForCallMeBot(phone: string): string {
    // Validar y formatear con el validador estándar
    const validation = validateAndFormatPhone(phone);
    
    if (!validation.isValid) {
      console.error(`❌ CallMeBot: Número inválido: ${phone}`);
      console.error(`❌ CallMeBot: Error: ${validation.error}`);
      throw new Error(`Número de teléfono inválido: ${validation.error}`);
    }

    // CallMeBot espera +549XXXXXXXXXX
    console.log(`📱 CallMeBot: Número original: ${phone}`);
    console.log(`📱 CallMeBot: Número para API: ${validation.formatted}`);
    
    return validation.formatted;
  }

  async sendMessage(to: string, message: string, title?: string): Promise<CallMeBotResult> {
    try {
      if (!this.config) {
        console.error('❌ CallMeBot: No está configurado');
        return {
          success: false,
          error: 'CallMeBot no está configurado. Verifica CALLMEBOT_API_KEY y CALLMEBOT_PHONE',
          timestamp: new Date()
        };
      }

      console.log(`\n🚀 CallMeBot: Iniciando envío de mensaje`);
      console.log(`📝 Mensaje: ${message.substring(0, 50)}...`);
      console.log(`👤 Destinatario original: ${to}`);

      // Formatear número para CallMeBot
      let formattedPhone: string;
      try {
        formattedPhone = this.formatPhoneForCallMeBot(to);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ CallMeBot: Error formateando número: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
          timestamp: new Date(),
          phoneUsed: to
        };
      }

      // Formatear mensaje con branding
      const formattedMessage = title 
        ? `🎁 *FIDELYA* 🎁\n\n*${title}*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Beneficios que suman\n🌐 www.fidelya.com.ar`
        : `🎁 *FIDELYA*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Beneficios que suman`;

      // CallMeBot API endpoint
      const url = `https://api.callmebot.com/whatsapp.php`;
      
      console.log(`📤 CallMeBot: Enviando a ${url}`);
      console.log(`📤 CallMeBot: Teléfono destino: ${formattedPhone}`);

      const response = await axios.get(url, {
        params: {
          phone: formattedPhone,
          text: formattedMessage,
          apikey: this.config.apiKey
        },
        timeout: 10000 // 10 segundos de timeout
      });

      console.log(`📥 CallMeBot: Respuesta recibida:`, response.data);

      if (response.status === 200) {
        console.log(`✅ CallMeBot: Mensaje enviado exitosamente`);
        
        return {
          success: true,
          messageId: `callmebot_${Date.now()}`,
          timestamp: new Date(),
          phoneUsed: formattedPhone,
          rawResponse: response.data
        };
      } else {
        console.error(`❌ CallMeBot: Status inesperado: ${response.status}`);
        return {
          success: false,
          error: `CallMeBot API retornó status ${response.status}`,
          timestamp: new Date(),
          phoneUsed: formattedPhone,
          rawResponse: response.data
        };
      }

    } catch (error) {
      console.error('❌ CallMeBot: Error crítico:', error);
      
      // Verificar si es un error de axios
      if (error && typeof error === 'object' && 'response' in error && 'config' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
        console.error(`❌ CallMeBot: Status: ${axiosError.response?.status}`);
        console.error(`❌ CallMeBot: Respuesta: ${JSON.stringify(axiosError.response?.data)}`);
        console.error(`❌ CallMeBot: Mensaje: ${axiosError.message}`);
        
        return {
          success: false,
          error: `CallMeBot HTTP ${axiosError.response?.status}: ${axiosError.message}`,
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

  isConfigured(): boolean {
    const configured = this.config !== null;
    if (!configured) {
      console.warn('⚠️ CallMeBot: No está configurado');
    }
    return configured;
  }
}

export const callMeBotService = new CallMeBotService();