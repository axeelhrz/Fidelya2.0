import { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationTemplatesService, NotificationTemplate as ServiceNotificationTemplate } from '../services/notification-templates.service';
import { notificationQueueService, QueueStats as ServiceQueueStats } from '../services/notification-queue.service';
import { useAuth } from './useAuth';

// Mock services for missing imports
const NotificationAnalyticsService = {
  getOverallMetrics: async () => ({
    totalSent: 1250,
    deliveryRate: 94.5,
    openRate: 68.2,
    clickRate: 12.8,
    unsubscribeRate: 0.5,
    recentActivity: [],
    channelPerformance: [],
    topTemplates: []
  }),
  getTemplateMetrics: async (templateId: string) => ({
    templateId,
    templateName: 'Template',
    usageCount: 10,
    deliveryRate: 95.0,
    openRate: 70.0,
    clickRate: 15.0
  }),
  getCampaignMetrics: async () => ({
    totalRecipients: 100,
    sent: 100,
    delivered: 98,
    opened: 70,
    clicked: 15,
    failed: 2,
    unsubscribed: 1
  })
};

const UserSegmentationService = {
  getSegments: async () => [],
  createSegment: async (segment: UserSegment) => ({ ...segment, id: Date.now().toString() })
};

const NotificationABTestingService = {
  getTests: async () => [],
  createTest: async (test: ABTest) => ({ ...test, id: Date.now().toString() })
};

// Use the service interfaces directly
// Use ServiceNotificationTemplate directly as NotificationTemplate type
type NotificationTemplate = ServiceNotificationTemplate;

// Use the service QueueStats interface
type QueueStats = ServiceQueueStats;

interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  segmentId?: string;
  channels: string[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  stats: CampaignStats;
  createdAt: Date;
}

interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  unsubscribed: number;
}

interface NotificationMetrics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  recentActivity: ActivityItem[];
  channelPerformance: ChannelMetrics[];
  topTemplates: TemplateMetrics[];
}

interface ActivityItem {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  timestamp: Date;
  recipient: string;
  template: string;
  channel: string;
}

interface ChannelMetrics {
  channel: string;
  sent: number;
  delivered: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface TemplateMetrics {
  templateId: string;
  templateName: string;
  usageCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface UserSegment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: string[];
  status: 'draft' | 'running' | 'completed';
  createdAt: Date;
  updatedAt?: Date;
}

interface UseEnhancedNotificationsReturn {
  // Templates
  templates: NotificationTemplate[];
  loadingTemplates: boolean;
  createTemplate: (template: Partial<NotificationTemplate>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  
  // Campaigns
  campaigns: NotificationCampaign[];
  loadingCampaigns: boolean;
  createCampaign: (campaign: Partial<NotificationCampaign>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<NotificationCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
  scheduleCampaign: (id: string, scheduledAt: Date) => Promise<void>;
  segments: UserSegment[];
  
  // Analytics
  metrics: NotificationMetrics | null;
  loadingMetrics: boolean;
  refreshMetrics: () => Promise<void>;
  getTemplateAnalytics: (templateId: string) => Promise<TemplateMetrics>;
  getCampaignAnalytics: (campaignId: string) => Promise<CampaignStats>;
  
  // Segments
  loadingSegments: boolean;
  createSegment: (segment: UserSegment) => Promise<void>;
  
  // A/B Testing
  abTests: ABTest[];
  loadingABTests: boolean;
  createABTest: (test: ABTest) => Promise<void>;
  
  // Queue Management
  queueStats: QueueStats | null;
  loadingQueue: boolean;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  
  // Utilities
  sendTestNotification: (templateId: string, recipient: string, channel: string) => Promise<void>;
  previewTemplate: (templateId: string, variables: Record<string, unknown>) => Promise<string>;
  validateTemplate: (template: Partial<NotificationTemplate>) => Promise<{ isValid: boolean; errors: string[] }>;
  
  // State management
  error: string | null;
  success: string | null;
  clearMessages: () => void;
  refresh: () => Promise<void>;
}

export function useEnhancedNotifications(): UseEnhancedNotificationsReturn {
  const { user } = useAuth();
  
  // State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  // Loading states
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingABTests, setLoadingABTests] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cache for performance
  const [cache, setCache] = useState<Map<string, { data: unknown; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Utility functions
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const getCachedData = useCallback((key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [cache, CACHE_DURATION]);

  const setCachedData = useCallback((key: string, data: unknown) => {
    setCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })));
  }, []);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      setError(null);

      const cachedTemplates = getCachedData('templates');
      if (Array.isArray(cachedTemplates)) {
        setTemplates(cachedTemplates as NotificationTemplate[]);
        return;
      }

      const templatesData = await notificationTemplatesService.getTemplates();
      setTemplates(templatesData);
      setCachedData('templates', templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Error al cargar las plantillas');
    } finally {
      setLoadingTemplates(false);
    }
  }, [getCachedData, setCachedData]);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      setLoadingCampaigns(true);
      setError(null);

      const cachedCampaigns = getCachedData('campaigns');
      if (Array.isArray(cachedCampaigns)) {
        setCampaigns(cachedCampaigns as NotificationCampaign[]);
        return;
      }

      // Simular carga de campañas
      const mockCampaigns: NotificationCampaign[] = [
        {
          id: '1',
          name: 'Bienvenida Nuevos Socios',
          description: 'Campaña de bienvenida para nuevos miembros',
          templateId: 'welcome-template',
          channels: ['email', 'push'],
          status: 'sent',
          stats: {
            totalRecipients: 150,
            sent: 150,
            delivered: 148,
            opened: 89,
            clicked: 23,
            failed: 2,
            unsubscribed: 1
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'Promoción Beneficios Especiales',
          description: 'Promoción de beneficios exclusivos para socios premium',
          templateId: 'promotion-template',
          segmentId: 'premium-users',
          channels: ['email', 'sms'],
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          stats: {
            totalRecipients: 75,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0,
            unsubscribed: 0
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];

      setCampaigns(mockCampaigns);
      setCachedData('campaigns', mockCampaigns);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Error al cargar las campañas');
    } finally {
      setLoadingCampaigns(false);
    }
  }, [getCachedData, setCachedData]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      setError(null);

      const cachedMetrics = getCachedData('metrics');
      if (cachedMetrics && typeof cachedMetrics === 'object' && cachedMetrics !== null && 'totalSent' in cachedMetrics) {
        setMetrics(cachedMetrics as NotificationMetrics);
        return;
      }

      const metricsData = await NotificationAnalyticsService.getOverallMetrics();
      setMetrics(metricsData);
      setCachedData('metrics', metricsData);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('Error al cargar las métricas');
    } finally {
      setLoadingMetrics(false);
    }
  }, [getCachedData, setCachedData]);

  // Load segments
  const loadSegments = useCallback(async () => {
    try {
      setLoadingSegments(true);
      setError(null);

      const segmentsData = await UserSegmentationService.getSegments();
      setSegments(segmentsData);
    } catch (err) {
      console.error('Error loading segments:', err);
      setError('Error al cargar los segmentos');
    } finally {
      setLoadingSegments(false);
    }
  }, []);

  // Load A/B tests
  const loadABTests = useCallback(async () => {
    try {
      setLoadingABTests(true);
      setError(null);

      const testsData = await NotificationABTestingService.getTests();
      setABTests(testsData);
    } catch (err) {
      console.error('Error loading A/B tests:', err);
      setError('Error al cargar los tests A/B');
    } finally {
      setLoadingABTests(false);
    }
  }, []);

  // Load queue stats
  const loadQueueStats = useCallback(async () => {
    try {
      setLoadingQueue(true);
      setError(null);

      const queueData = await notificationQueueService.getQueueStats();
      setQueueStats(queueData);
    } catch (err) {
      console.error('Error loading queue stats:', err);
      setError('Error al cargar estadísticas de cola');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // Template operations
  const createTemplate = useCallback(async (template: Partial<NotificationTemplate>) => {
    try {
      setError(null);
      
      // Create template with required fields
      const templateData = {
        name: template.name || '',
        description: template.description || '',
        title: template.title || '',
        message: template.message || '',
        type: template.type || 'info' as const,
        priority: template.priority || 'medium' as const,
        category: template.category || 'general' as const,
        tags: template.tags || [],
        channels: template.channels || {
          email: true,
          sms: false,
          push: true,
          app: true,
        },
        variables: template.variables || [],
        isActive: template.isActive ?? true,
        isSystem: false,
        createdBy: user?.uid || 'unknown',
        actionUrl: template.actionUrl,
        actionLabel: template.actionLabel,
      };

      const newTemplate = await notificationTemplatesService.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      setSuccess('Plantilla creada exitosamente');
      
      // Clear cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete('templates');
        return newCache;
      });
    } catch (err) {
      console.error('Error creating template:', err);
      setError('Error al crear la plantilla');
      throw err;
    }
  }, [user]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<NotificationTemplate>) => {
    try {
      setError(null);
      const updatedTemplate = await notificationTemplatesService.updateTemplate(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      setSuccess('Plantilla actualizada exitosamente');
      
      // Clear cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete('templates');
        return newCache;
      });
    } catch (err) {
      console.error('Error updating template:', err);
      setError('Error al actualizar la plantilla');
      throw err;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setError(null);
      await notificationTemplatesService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setSuccess('Plantilla eliminada exitosamente');
      
      // Clear cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete('templates');
        return newCache;
      });
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Error al eliminar la plantilla');
      throw err;
    }
  }, []);

  const duplicateTemplate = useCallback(async (id: string) => {
    try {
      setError(null);
      const originalTemplate = templates.find(t => t.id === id);
      if (!originalTemplate) throw new Error('Template not found');

      const duplicatedTemplate = await notificationTemplatesService.duplicateTemplate(
        id, 
        `${originalTemplate.name} (Copia)`
      );
      
      setTemplates(prev => [...prev, duplicatedTemplate]);
      setSuccess('Plantilla duplicada exitosamente');
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError('Error al duplicar la plantilla');
      throw err;
    }
  }, [templates]);

  // Campaign operations
  const createCampaign = useCallback(async (campaign: Partial<NotificationCampaign>) => {
    try {
      setError(null);
      // Simular creación de campaña
      const newCampaign: NotificationCampaign = {
        id: Date.now().toString(),
        name: campaign.name || '',
        description: campaign.description || '',
        templateId: campaign.templateId || '',
        segmentId: campaign.segmentId,
        channels: campaign.channels || [],
        scheduledAt: campaign.scheduledAt,
        status: 'draft',
        stats: {
          totalRecipients: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
          unsubscribed: 0
        },
        createdAt: new Date()
      };

      setCampaigns(prev => [...prev, newCampaign]);
      setSuccess('Campaña creada exitosamente');
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Error al crear la campaña');
      throw err;
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<NotificationCampaign>) => {
    try {
      setError(null);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      setSuccess('Campaña actualizada exitosamente');
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Error al actualizar la campaña');
      throw err;
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      setError(null);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setSuccess('Campaña eliminada exitosamente');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Error al eliminar la campaña');
      throw err;
    }
  }, []);

  const sendCampaign = useCallback(async (id: string) => {
    try {
      setError(null);
      // Simular envío de campaña
      setCampaigns(prev => prev.map(c =>
        c.id === id
          ? { ...c, status: 'sending' as const }
          : c
      ));

      // Simular progreso de envío
      setTimeout(() => {
        setCampaigns(prev => prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: 'sent' as const,
                stats: {
                  ...c.stats,
                  totalRecipients: 100,
                  sent: 100,
                  delivered: 98
                }
              }
            : c
        ));
      }, 3000);

      setSuccess('Campaña enviada exitosamente');
    } catch (err) {
      console.error('Error sending campaign:', err);
      setError('Error al enviar la campaña');
      throw err;
    }
  }, []);

  const scheduleCampaign = useCallback(async (id: string, scheduledAt: Date) => {
    try {
      setError(null);
      setCampaigns(prev => prev.map(c =>
        c.id === id
          ? { ...c, status: 'scheduled' as const, scheduledAt }
          : c
      ));
      setSuccess('Campaña programada exitosamente');
    } catch (err) {
      console.error('Error scheduling campaign:', err);
      setError('Error al programar la campaña');
      throw err;
    }
  }, []);

  // Analytics operations
  const refreshMetrics = useCallback(async () => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete('metrics');
      return newCache;
    });
    await loadMetrics();
  }, [loadMetrics]);

  const getTemplateAnalytics = useCallback(async (templateId: string) => {
    try {
      return await NotificationAnalyticsService.getTemplateMetrics(templateId);
    } catch (err) {
      console.error('Error getting template analytics:', err);
      throw err;
    }
  }, []);

  const getCampaignAnalytics = useCallback(async () => {
    try {
      return await NotificationAnalyticsService.getCampaignMetrics();
    } catch (err) {
      console.error('Error getting campaign analytics:', err);
      throw err;
    }
  }, []);

  // Utility operations
  const sendTestNotification = useCallback(async (templateId: string, recipient: string, channel: string) => {
    try {
      setError(null);
      // Simular envío de prueba
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`Notificación de prueba enviada a ${recipient} por ${channel.toUpperCase()}`);
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError('Error al enviar la notificación de prueba');
      throw err;
    }
  }, []);

  const previewTemplate = useCallback(async (templateId: string, variables: Record<string, unknown>) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Simular preview con reemplazo de variables
      let content = template.message || '';
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

      return content;
    } catch (err) {
      console.error('Error previewing template:', err);
      throw err;
    }
  }, [templates]);

  const validateTemplate = useCallback(async (template: Partial<NotificationTemplate>) => {
    try {
      const errors: string[] = [];

      if (!template.name) errors.push('El nombre es requerido');
      if (!template.title) errors.push('El título es requerido');
      if (!template.message) errors.push('El mensaje es requerido');
      if (!template.channels || (!template.channels.email && !template.channels.sms && !template.channels.push && !template.channels.app)) {
        errors.push('Al menos un canal es requerido');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (err) {
      console.error('Error validating template:', err);
      throw err;
    }
  }, []);

  // Queue operations
  const pauseQueue = useCallback(async () => {
    try {
      await notificationQueueService.pauseProcessing();
      setSuccess('Cola pausada exitosamente');
      await loadQueueStats();
    } catch (err) {
      console.error('Error pausing queue:', err);
      setError('Error al pausar la cola');
      throw err;
    }
  }, [loadQueueStats]);

  const resumeQueue = useCallback(async () => {
    try {
      await notificationQueueService.resumeProcessing();
      setSuccess('Cola reanudada exitosamente');
      await loadQueueStats();
    } catch (err) {
      console.error('Error resuming queue:', err);
      setError('Error al reanudar la cola');
      throw err;
    }
  }, [loadQueueStats]);

  const clearQueue = useCallback(async () => {
    try {
      await notificationQueueService.clearOldNotifications();
      setSuccess('Cola limpiada exitosamente');
      await loadQueueStats();
    } catch (err) {
      console.error('Error clearing queue:', err);
      setError('Error al limpiar la cola');
      throw err;
    }
  }, [loadQueueStats]);

  // Segment operations
  const createSegment = useCallback(async (segment: UserSegment) => {
    try {
      setError(null);
      const newSegment = await UserSegmentationService.createSegment(segment);
      setSegments(prev => [...prev, newSegment]);
      setSuccess('Segmento creado exitosamente');
    } catch (err) {
      console.error('Error creating segment:', err);
      setError('Error al crear el segmento');
      throw err;
    }
  }, []);

  // A/B Testing operations
  const createABTest = useCallback(async (test: ABTest) => {
    try {
      setError(null);
      const newTest = await NotificationABTestingService.createTest(test);
      setABTests(prev => [...prev, newTest]);
      setSuccess('Test A/B creado exitosamente');
    } catch (err) {
      console.error('Error creating A/B test:', err);
      setError('Error al crear el test A/B');
      throw err;
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setCache(new Map()); // Clear all cache
    await Promise.all([
      loadTemplates(),
      loadCampaigns(),
      loadMetrics(),
      loadSegments(),
      loadABTests(),
      loadQueueStats()
    ]);
  }, [loadTemplates, loadCampaigns, loadMetrics, loadSegments, loadABTests, loadQueueStats]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadTemplates();
      loadCampaigns();
      loadMetrics();
      loadSegments();
      loadABTests();
      loadQueueStats();
    }
  }, [user, loadTemplates, loadCampaigns, loadMetrics, loadSegments, loadABTests, loadQueueStats]);

  // Auto-refresh metrics every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshMetrics();
        loadQueueStats();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, refreshMetrics, loadQueueStats]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Memoized return object
  return useMemo(() => ({
    // Templates
    templates,
    loadingTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Campaigns
    campaigns,
    loadingCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    scheduleCampaign,
    
    // Analytics
    metrics,
    loadingMetrics,
    refreshMetrics,
    getTemplateAnalytics,
    getCampaignAnalytics,
    
    // Segments
    segments,
    loadingSegments,
    createSegment,
    
    // A/B Testing
    abTests,
    loadingABTests,
    createABTest,
    
    // Queue Management
    queueStats,
    loadingQueue,
    pauseQueue,
    resumeQueue,
    clearQueue,
    
    // Utilities
    sendTestNotification,
    previewTemplate,
    validateTemplate,
    
    // State management
    error,
    success,
    clearMessages,
    refresh
  }), [
    templates, loadingTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate,
    campaigns, loadingCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, scheduleCampaign,
    metrics, loadingMetrics, refreshMetrics, getTemplateAnalytics, getCampaignAnalytics,
    segments, loadingSegments, createSegment,
    abTests, loadingABTests, createABTest,
    queueStats, loadingQueue, pauseQueue, resumeQueue, clearQueue,
    sendTestNotification, previewTemplate, validateTemplate,
    error, success, clearMessages, refresh
  ]);
}