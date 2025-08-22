import axios from 'axios';

interface GreenAPIConfig {
  instanceId: string;
  apiToken: string;
}

interface GreenAPIResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
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
    } else {
      this.baseUrl = '';
    }
  }

  async sendMessage(to: string, message: string, title?: string): Promise<GreenAPIResult> {
    try {
      if (!this.config) {
        return {
          success: false,
          error: 'Green API no está configurado',
          timestamp: new Date()
        };
      }

      // Limpiar número de teléfono
      const cleanPhone = to.replace(/\D/g, '');
      const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

      // Formatear mensaje con branding
      const formattedMessage = title 
        ? `🚀 *FIDELYA* 🚀\n\n*${title}*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Tu plataforma de fidelización\n🌐 www.fidelya.com`
        : `🚀 *FIDELYA*\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 *Fidelya* - Tu plataforma de fidelización`;

      interface SendMessageResponse {
        idMessage?: string;
        [key: string]: unknown;
      }

      const response = await axios.post<SendMessageResponse>(
        `${this.baseUrl}/sendMessage/${this.config.apiToken}`,
        {
          chatId: formattedPhone,
          message: formattedMessage
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.idMessage) {
        console.log('✅ Mensaje enviado via Green API:', response.data.idMessage);
        return {
          success: true,
          messageId: response.data.idMessage,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          error: 'Respuesta inválida de Green API',
          timestamp: new Date()
        };
      }

    } catch (error) {
      console.error('❌ Error Green API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  async getInstanceStatus(): Promise<{ status: string; error?: string }> {
    try {
      if (!this.config) {
        return { status: 'not_configured' };
      }

      const response = await axios.get(
        `${this.baseUrl}/getStateInstance/${this.config.apiToken}`
      );

      const data = response.data as { stateInstance?: string };
      return { status: data.stateInstance || 'unknown' };
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

export const greenAPIService = new GreenAPIService();
