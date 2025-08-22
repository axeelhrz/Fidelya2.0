import axios from 'axios';

interface CallMeBotConfig {
  apiKey: string;
  phone: string; // Tu número de WhatsApp registrado en CallMeBot
}

interface CallMeBotResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

class CallMeBotService {
  private config: CallMeBotConfig | null = null;

  constructor() {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const phone = process.env.CALLMEBOT_PHONE;
    
    if (apiKey && phone) {
      this.config = { apiKey, phone };
    }
  }

  async sendMessage(to: string, message: string, title?: string): Promise<CallMeBotResult> {
    try {
      if (!this.config) {
        return {
          success: false,
          error: 'CallMeBot no está configurado',
          timestamp: new Date()
        };
      }

      // Formatear mensaje con branding
      const formattedMessage = title 
        ? `🚀 FIDELYA 🚀\n\n${title}\n\n${message}\n\n📱 Fidelya - Tu plataforma de fidelización`
        : `🚀 FIDELYA\n\n${message}\n\n📱 Fidelya - Tu plataforma de fidelización`;

      // CallMeBot API endpoint
      const url = `https://api.callmebot.com/whatsapp.php`;
      
      const response = await axios.get(url, {
        params: {
          phone: this.config.phone,
          text: formattedMessage,
          apikey: this.config.apiKey
        }
      });

      if (response.status === 200) {
        console.log('✅ Mensaje enviado via CallMeBot');
        return {
          success: true,
          messageId: `callmebot_${Date.now()}`,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          error: 'Error en CallMeBot API',
          timestamp: new Date()
        };
      }

    } catch (error) {
      console.error('❌ Error CallMeBot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

export const callMeBotService = new CallMeBotService();
