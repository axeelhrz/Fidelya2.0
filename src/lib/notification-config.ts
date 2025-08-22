interface NotificationConfig {
  whatsapp: {
    providers: {
      baileys: {
        enabled: boolean;
        priority: number;
        sessionPath: string;
      };
      greenApi: {
        enabled: boolean;
        priority: number;
        instanceId?: string;
        token?: string;
        monthlyLimit: number;
      };
      callmebot: {
        enabled: boolean;
        priority: number;
        apiKey?: string;
        phone?: string;
      };
      meta: {
        enabled: boolean;
        priority: number;
        accessToken?: string;
        phoneNumberId?: string;
      };
      twilio: {
        enabled: boolean;
        priority: number;
        accountSid?: string;
        authToken?: string;
        fromNumber?: string;
      };
    };
  };
  email: {
    providers: {
      resend: {
        enabled: boolean;
        priority: number;
        apiKey?: string;
        fromEmail?: string;
        fromName?: string;
      };
      sendgrid: {
        enabled: boolean;
        priority: number;
        apiKey?: string;
        fromEmail?: string;
        fromName?: string;
      };
    };
  };
  fallback: {
    maxRetries: number;
    retryDelay: number;
    enableEmailFallback: boolean;
    enableSMSFallback: boolean;
  };
}

class NotificationConfigService {
  private static instance: NotificationConfigService;
  private config: NotificationConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): NotificationConfigService {
    if (!NotificationConfigService.instance) {
      NotificationConfigService.instance = new NotificationConfigService();
    }
    return NotificationConfigService.instance;
  }

  private loadConfig(): NotificationConfig {
    return {
      whatsapp: {
        providers: {
          baileys: {
            enabled: true, // Siempre habilitado por ser gratis
            priority: 1,
            sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-sessions'
          },
          greenApi: {
            enabled: !!(process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN),
            priority: 2,
            instanceId: process.env.GREEN_API_INSTANCE_ID,
            token: process.env.GREEN_API_TOKEN,
            monthlyLimit: 3000
          },
          callmebot: {
            enabled: !!(process.env.CALLMEBOT_API_KEY && process.env.CALLMEBOT_PHONE),
            priority: 3,
            apiKey: process.env.CALLMEBOT_API_KEY,
            phone: process.env.CALLMEBOT_PHONE
          },
          meta: {
            enabled: !!(process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID),
            priority: 4,
            accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID
          },
          twilio: {
            enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
            priority: 5, // Última opción por ser de pago
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
          }
        }
      },
      email: {
        providers: {
          resend: {
            enabled: !!process.env.RESEND_API_KEY,
            priority: 1,
            apiKey: process.env.RESEND_API_KEY,
            fromEmail: process.env.RESEND_FROM_EMAIL,
            fromName: process.env.RESEND_FROM_NAME || 'Fidelya'
          },
          sendgrid: {
            enabled: !!process.env.SENDGRID_API_KEY,
            priority: 2,
            apiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.SENDGRID_FROM_EMAIL,
            fromName: process.env.SENDGRID_FROM_NAME || 'Fidelya'
          }
        }
      },
      fallback: {
        maxRetries: 3,
        retryDelay: 2000,
        enableEmailFallback: true,
        enableSMSFallback: false
      }
    };
  }

  public getWhatsAppProviders() {
    return Object.entries(this.config.whatsapp.providers)
      .filter(([, config]) => config.enabled)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, ...config }));
  }

  public getEmailProviders() {
    return Object.entries(this.config.email.providers)
      .filter(([, config]) => config.enabled)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, ...config }));
  }

  public getFallbackConfig() {
    return this.config.fallback;
  }

  public getProviderConfig(
    type: 'whatsapp' | 'email',
    providerName: string
  ): NotificationConfig['whatsapp']['providers'][keyof NotificationConfig['whatsapp']['providers']] |
     NotificationConfig['email']['providers'][keyof NotificationConfig['email']['providers']] | undefined {
    if (type === 'whatsapp') {
      return this.config.whatsapp.providers[providerName as keyof NotificationConfig['whatsapp']['providers']];
    } else if (type === 'email') {
      return this.config.email.providers[providerName as keyof NotificationConfig['email']['providers']];
    }
    return undefined;
  }

  public isProviderEnabled(type: 'whatsapp' | 'email', providerName: string): boolean {
    const provider = this.getProviderConfig(type, providerName);
    return provider?.enabled || false;
  }

  public getConfigSummary() {
    const whatsappProviders = this.getWhatsAppProviders();
    const emailProviders = this.getEmailProviders();

    return {
      whatsapp: {
        total: whatsappProviders.length,
        free: whatsappProviders.filter(p => ['baileys', 'greenApi', 'callmebot'].includes(p.name)).length,
        paid: whatsappProviders.filter(p => ['twilio', 'meta'].includes(p.name)).length,
        providers: whatsappProviders.map(p => ({
          name: p.name,
          priority: p.priority,
          cost: ['baileys', 'greenApi', 'callmebot'].includes(p.name) ? 'free' : 'paid'
        }))
      },
      email: {
        total: emailProviders.length,
        providers: emailProviders.map(p => ({
          name: p.name,
          priority: p.priority
        }))
      },
      fallback: this.config.fallback
    };
  }
}

export const notificationConfig = NotificationConfigService.getInstance();
