 import { APP_CONFIG, isDevelopment, isProduction } from './constants';

interface AppConfig {
  app: {
    name: string;
    version: string;
    url: string;
    environment: 'development' | 'production' | 'test';
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    useEmulators: boolean;
  };
  features: {
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableBackups: boolean;
    enableDarkMode: boolean;
    enablePWA: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUploadFiles: number;
    paginationLimit: number;
  };
  external: {
    n8nWebhookUrl?: string;
    n8nApiKey?: string;
  };
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): AppConfig {
    return {
      app: {
        name: APP_CONFIG.name,
        version: APP_CONFIG.version,
        url: APP_CONFIG.url,
        environment: isDevelopment ? 'development' : isProduction ? 'production' : 'test',
      },
      firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
      },
      features: {
        enableNotifications: true,
        enableAnalytics: true,
        enableBackups: true,
        enableDarkMode: true,
        enablePWA: true,
      },
      limits: {
        maxFileSize: APP_CONFIG.maxFileSize,
        maxUploadFiles: 10,
        paginationLimit: 20,
      },
      external: {
        n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
        n8nApiKey: process.env.N8N_API_KEY,
      },
    };
  }

  private validateConfig(): void {
    const requiredFirebaseKeys = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];

    const missingKeys = requiredFirebaseKeys.filter(
      key => !this.config.firebase[key as keyof typeof this.config.firebase]
    );

    if (missingKeys.length > 0) {
      const error = `Missing Firebase configuration: ${missingKeys.join(', ')}`;
      console.error('❌ Configuration Error:', error);
      
      if (isProduction) {
        throw new Error(error);
      }
    }

    console.log('✅ Configuration validated successfully');
  }

  public get<T extends keyof AppConfig>(section: T): AppConfig[T] {
    return this.config[section];
  }

  public getFirebaseConfig() {
    return this.config.firebase;
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getAppUrl(): string {
    return this.config.app.url;
  }

  public getAuthUrl(): string {
    // Para autenticación, siempre usar el dominio de producción correcto
    if (this.config.app.environment === 'production') {
      // Priorizar la URL configurada en variables de entorno
      if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
      }
      // Si está en Vercel, usar la URL de Vercel
      if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      }
      // Fallback al dominio principal de la plataforma
      return 'https://fidelya.vercel.app';
    }
    
    // En desarrollo, usar localhost solo si no hay URL configurada
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  public getMaxFileSize(): number {
    return this.config.limits.maxFileSize;
  }

  public getN8nConfig() {
    return {
      webhookUrl: this.config.external.n8nWebhookUrl,
      apiKey: this.config.external.n8nApiKey,
    };
  }

  // Method to update configuration at runtime (for admin panel)
  public updateFeature(feature: keyof AppConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
    console.log(`🔧 Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Method to get configuration for client-side
  public getClientConfig() {
    return {
      app: this.config.app,
      features: this.config.features,
      limits: this.config.limits,
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
export default configService;

// Export specific getters for convenience
export const getFirebaseConfig = () => configService.getFirebaseConfig();
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => 
  configService.isFeatureEnabled(feature);
export const getAppUrl = () => configService.getAppUrl();
export const getMaxFileSize = () => configService.getMaxFileSize();