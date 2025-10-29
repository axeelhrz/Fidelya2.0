import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationFormData, NotificationPriority } from '@/types/notification';
import { notificationService } from './notifications.service';
import { notificationQueueService } from './notification-queue.service';

export interface ScheduledNotification {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  notificationData: NotificationFormData;
  
  // Scheduling configuration
  schedule: {
    type: 'once' | 'recurring';
    startDate: Date;
    endDate?: Date;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // Every X days/weeks/months
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    time: string; // HH:mm format
    timezone: string;
  };
  
  // Targeting
  targeting: {
    userTypes: string[];
    associations?: string[];
    customFilters?: Record<string, unknown>;
    excludeUsers?: string[];
  };
  
  // Status and execution
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  isActive: boolean;
  nextExecution?: Date;
  lastExecution?: Date;
  executionCount: number;
  maxExecutions?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Analytics
  analytics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    averageDeliveryRate: number;
    lastExecutionStats?: {
      sent: number;
      delivered: number;
      failed: number;
      executedAt: Date;
    };
  };
}

export interface NotificationTrigger {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger configuration
  trigger: {
    type: 'event' | 'condition' | 'webhook';
    event?: string; // e.g., 'user_registered', 'payment_received'
    conditions?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
      value: unknown;
    }[];
    webhookUrl?: string;
  };
  
  // Action configuration
  action: {
    type: 'send_notification' | 'schedule_notification';
    notificationData: NotificationFormData;
    templateId?: string;
    delay?: number; // Delay in minutes
    targeting?: {
      userTypes: string[];
      customFilters?: Record<string, unknown>;
    };
  };
  
  // Execution settings
  execution: {
    maxExecutionsPerUser?: number;
    cooldownPeriod?: number; // Minutes between executions for same user
    batchSize?: number;
    priority: NotificationPriority;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Analytics
  analytics: {
    totalTriggers: number;
    totalNotificationsSent: number;
    averageDeliveryRate: number;
    lastTriggered?: Date;
  };
}

export interface CampaignSchedule {
  id: string;
  name: string;
  description: string;
  
  // Campaign configuration
  campaign: {
    templateId?: string;
    notificationData: NotificationFormData;
    variants?: {
      id: string;
      name: string;
      percentage: number;
      notificationData: NotificationFormData;
    }[];
  };
  
  // Scheduling
  schedule: {
    startDate: Date;
    endDate?: Date;
    phases: {
      id: string;
      name: string;
      startDate: Date;
      targeting: {
        userTypes: string[];
        percentage?: number;
        customFilters?: Record<string, unknown>;
      };
      channels: {
        email: boolean;
        sms: boolean;
        push: boolean;
        app: boolean;
      };
    }[];
  };
  
  // Status
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  currentPhase?: string;
  
  // Analytics
  analytics: {
    totalTargeted: number;
    totalSent: number;
    totalDelivered: number;
    phaseStats: Record<string, {
      sent: number;
      delivered: number;
      failed: number;
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

class NotificationSchedulerService {
  private readonly SCHEDULED_COLLECTION = 'scheduledNotifications';
  private readonly TRIGGERS_COLLECTION = 'notificationTriggers';
  private readonly CAMPAIGNS_COLLECTION = 'notificationCampaigns';
  private readonly EXECUTIONS_COLLECTION = 'notificationExecutions';

  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    // Auto-start processing in browser environment
    if (typeof window !== 'undefined') {
      this.startProcessing();
    }
  }

  // ==================== SCHEDULED NOTIFICATIONS ====================

  // Create scheduled notification
  async createScheduledNotification(
    data: Omit<ScheduledNotification, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'analytics'>
  ): Promise<string> {
    try {
      const scheduledNotification = {
        ...data,
        executionCount: 0,
        analytics: {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          averageDeliveryRate: 0,
        },
        nextExecution: this.calculateNextExecution(data.schedule),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.SCHEDULED_COLLECTION), scheduledNotification);
      
      console.log(`✅ Created scheduled notification: ${data.name}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating scheduled notification:', error);
      throw error;
    }
  }

  // Get scheduled notifications
  async getScheduledNotifications(includeInactive: boolean = false): Promise<ScheduledNotification[]> {
    try {
      const constraints: import('firebase/firestore').QueryConstraint[] = [];
      
      if (!includeInactive) {
        constraints.push(where('isActive', '==', true));
      }
      constraints.push(orderBy('createdAt', 'desc'));
      
      const q = query(collection(db, this.SCHEDULED_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        schedule: {
          ...doc.data().schedule,
          startDate: doc.data().schedule.startDate?.toDate() || new Date(),
          endDate: doc.data().schedule.endDate?.toDate(),
        },
        nextExecution: doc.data().nextExecution?.toDate(),
        lastExecution: doc.data().lastExecution?.toDate(),
      })) as ScheduledNotification[];
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      throw error;
    }
  }

  // Update scheduled notification
  async updateScheduledNotification(
    id: string,
    updates: Partial<Omit<ScheduledNotification, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.SCHEDULED_COLLECTION, id);
      
      // Recalculate next execution if schedule changed
      if (updates.schedule) {
        updates.nextExecution = this.calculateNextExecution(updates.schedule);
      }
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ Updated scheduled notification: ${id}`);
    } catch (error) {
      console.error('❌ Error updating scheduled notification:', error);
      throw error;
    }
  }

  // Delete scheduled notification
  async deleteScheduledNotification(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.SCHEDULED_COLLECTION, id);
      await deleteDoc(docRef);
      
      console.log(`✅ Deleted scheduled notification: ${id}`);
    } catch (error) {
      console.error('❌ Error deleting scheduled notification:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION TRIGGERS ====================

  // Create notification trigger
  async createNotificationTrigger(
    data: Omit<NotificationTrigger, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>
  ): Promise<string> {
    try {
      const trigger = {
        ...data,
        analytics: {
          totalTriggers: 0,
          totalNotificationsSent: 0,
          averageDeliveryRate: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.TRIGGERS_COLLECTION), trigger);
      
      console.log(`✅ Created notification trigger: ${data.name}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification trigger:', error);
      throw error;
    }
  }

  // Get notification triggers
  async getNotificationTriggers(includeInactive: boolean = false): Promise<NotificationTrigger[]> {
    try {
      const constraints = [];
      
      if (!includeInactive) {
        constraints.push(where('isActive', '==', true));
      }
      constraints.push(orderBy('createdAt', 'desc'));
      
      const q = query(collection(db, this.TRIGGERS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        analytics: {
          ...doc.data().analytics,
          lastTriggered: doc.data().analytics?.lastTriggered?.toDate(),
        },
      })) as NotificationTrigger[];
    } catch (error) {
      console.error('❌ Error getting notification triggers:', error);
      throw error;
    }
  }

  // Trigger notification based on event
  async triggerNotification(
    triggerId: string,
    eventData: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    try {
      const triggers = await this.getNotificationTriggers();
      const trigger = triggers.find(t => t.id === triggerId);
      
      if (!trigger || !trigger.isActive) {
        console.warn(`⚠️ Trigger not found or inactive: ${triggerId}`);
        return;
      }

      // Check conditions if specified
      if (trigger.trigger.conditions) {
        const conditionsMet = trigger.trigger.conditions.every(condition => {
          const fieldValue = eventData[condition.field];
          
          switch (condition.operator) {
            case 'equals':
              return fieldValue === condition.value;
            case 'not_equals':
              return fieldValue !== condition.value;
            case 'greater_than':
              return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value;
            case 'less_than':
              return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value;
            case 'contains':
              return String(fieldValue).includes(String(condition.value));
            default:
              return false;
          }
        });

        if (!conditionsMet) {
          console.log(`⏭️ Conditions not met for trigger: ${triggerId}`);
          return;
        }
      }

      // Execute trigger action
      await this.executeTriggerAction(trigger, eventData, userId);
      
      // Update analytics
      await this.updateTriggerAnalytics(triggerId);
      
      console.log(`✅ Executed trigger: ${trigger.name}`);
    } catch (error) {
      console.error('❌ Error triggering notification:', error);
      throw error;
    }
  }

  // ==================== CAMPAIGN SCHEDULING ====================

  // Create campaign schedule
  async createCampaignSchedule(
    data: Omit<CampaignSchedule, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>
  ): Promise<string> {
    try {
      const campaign = {
        ...data,
        analytics: {
          totalTargeted: 0,
          totalSent: 0,
          totalDelivered: 0,
          phaseStats: {},
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.CAMPAIGNS_COLLECTION), campaign);
      
      console.log(`✅ Created campaign schedule: ${data.name}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating campaign schedule:', error);
      throw error;
    }
  }

  // ==================== PROCESSING ENGINE ====================

  // Start processing scheduled notifications
  startProcessing(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      this.stopProcessing();
    }

    console.log('🔄 Starting notification scheduler processing...');
    this.processingInterval = setInterval(() => {
      this.processScheduledNotifications().catch(error => {
        console.error('❌ Scheduler processing error:', error);
      });
    }, intervalMs);

    // Process immediately
    this.processScheduledNotifications().catch(error => {
      console.error('❌ Initial scheduler processing error:', error);
    });
  }

  // Stop processing
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Stopped notification scheduler processing');
    }
  }

  // Process scheduled notifications
  private async processScheduledNotifications(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      
      // Get notifications ready for execution
      const readyQuery = query(
        collection(db, this.SCHEDULED_COLLECTION),
        where('isActive', '==', true),
        where('status', '==', 'active'),
        where('nextExecution', '<=', Timestamp.fromDate(now)),
        limit(10)
      );

      const snapshot = await getDocs(readyQuery);
      
      if (snapshot.empty) {
        return;
      }

      console.log(`📤 Processing ${snapshot.docs.length} scheduled notifications...`);

      for (const docSnapshot of snapshot.docs) {
        const scheduledNotification = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date(),
          schedule: {
            ...docSnapshot.data().schedule,
            startDate: docSnapshot.data().schedule.startDate?.toDate() || new Date(),
            endDate: docSnapshot.data().schedule.endDate?.toDate(),
          },
          nextExecution: docSnapshot.data().nextExecution?.toDate(),
          lastExecution: docSnapshot.data().lastExecution?.toDate(),
        } as ScheduledNotification;

        await this.executeScheduledNotification(scheduledNotification);
      }

    } catch (error) {
      console.error('❌ Error processing scheduled notifications:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Execute scheduled notification
  private async executeScheduledNotification(scheduledNotification: ScheduledNotification): Promise<void> {
    try {
      console.log(`🚀 Executing scheduled notification: ${scheduledNotification.name}`);

      // Get target users based on targeting criteria
      const targetUsers = await this.getTargetUsers(scheduledNotification.targeting);
      
      if (targetUsers.length === 0) {
        console.warn(`⚠️ No target users found for: ${scheduledNotification.name}`);
        return;
      }

      // Create notification
      const notificationId = await notificationService.createNotification(scheduledNotification.notificationData);
      
      // Send to users using queue system for better performance
      await notificationQueueService.enqueueNotification(
        notificationId,
        targetUsers,
        scheduledNotification.notificationData,
        {
          priority: scheduledNotification.notificationData.priority || 'medium',
          maxAttempts: 3,
        }
      );

      // Update execution stats
      const executionCount = scheduledNotification.executionCount + 1;
      const nextExecution = this.calculateNextExecution(scheduledNotification.schedule, new Date());
      
      // Check if should complete
      const shouldComplete = 
        (scheduledNotification.maxExecutions && executionCount >= scheduledNotification.maxExecutions) ||
        (scheduledNotification.schedule.type === 'once') ||
        (scheduledNotification.schedule.endDate && nextExecution && nextExecution > scheduledNotification.schedule.endDate);

      const updates: Partial<ScheduledNotification> = {
        executionCount,
        lastExecution: new Date(),
        nextExecution: shouldComplete ? undefined : nextExecution,
        status: shouldComplete ? 'completed' : 'active',
        updatedAt: new Date(),
      };

      await this.updateScheduledNotification(scheduledNotification.id, updates);
      
      // Record execution
      await this.recordExecution(scheduledNotification.id, targetUsers.length);
      
      console.log(`✅ Executed scheduled notification: ${scheduledNotification.name} (${targetUsers.length} users)`);

    } catch (error) {
      console.error(`❌ Error executing scheduled notification ${scheduledNotification.name}:`, error);
      
      // Mark as failed and schedule retry
      await this.updateScheduledNotification(scheduledNotification.id, {
        status: 'paused',
        nextExecution: new Date(Date.now() + 30 * 60 * 1000), // Retry in 30 minutes
      });
    }
  }

  // Execute trigger action
  private async executeTriggerAction(
    trigger: NotificationTrigger,
    eventData: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    try {
      const targetUsers = userId ? [userId] : await this.getTargetUsers(trigger.action.targeting || { userTypes: ['all'] });
      
      if (targetUsers.length === 0) {
        return;
      }

      // Apply delay if specified
      const delay = trigger.action.delay || 0;
      const scheduledFor = new Date(Date.now() + delay * 60 * 1000);

      if (trigger.action.type === 'send_notification') {
        // Create and send notification immediately or with delay
        const notificationId = await notificationService.createNotification(trigger.action.notificationData);
        
        if (delay > 0) {
          await notificationQueueService.scheduleNotification(
            notificationId,
            targetUsers,
            trigger.action.notificationData,
            scheduledFor,
            {
              priority: trigger.execution.priority,
              maxAttempts: 3,
            }
          );
        } else {
          await notificationQueueService.enqueueNotification(
            notificationId,
            targetUsers,
            trigger.action.notificationData,
            {
              priority: trigger.execution.priority,
              maxAttempts: 3,
            }
          );
        }
      }

    } catch (error) {
      console.error('❌ Error executing trigger action:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  // Calculate next execution time
  private calculateNextExecution(schedule: ScheduledNotification['schedule'], fromDate?: Date): Date | undefined {
    const baseDate = fromDate || new Date();
    
    if (schedule.type === 'once') {
      return schedule.startDate > baseDate ? schedule.startDate : undefined;
    }

    // For recurring schedules
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const nextDate = new Date(baseDate);
    nextDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, start from tomorrow
    if (nextDate <= baseDate) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    switch (schedule.frequency) {
      case 'daily':
        const interval = schedule.interval || 1;
        while (nextDate <= baseDate) {
          nextDate.setDate(nextDate.getDate() + interval);
        }
        break;

      case 'weekly':
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          // Find next occurrence of specified days
          const currentDay = nextDate.getDay();
          const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);
          
          let targetDay = sortedDays.find(day => day > currentDay);
          if (!targetDay) {
            targetDay = sortedDays[0];
            nextDate.setDate(nextDate.getDate() + 7);
          }
          
          const daysToAdd = (targetDay - nextDate.getDay() + 7) % 7;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
        break;

      case 'monthly':
        if (schedule.dayOfMonth) {
          nextDate.setDate(schedule.dayOfMonth);
          if (nextDate <= baseDate) {
            nextDate.setMonth(nextDate.getMonth() + 1);
          }
        }
        break;
    }

    // Check if within end date
    if (schedule.endDate && nextDate > schedule.endDate) {
      return undefined;
    }

    return nextDate;
  }

  // Get target users based on criteria
  private async getTargetUsers(targeting: ScheduledNotification['targeting']): Promise<string[]> {
    try {
      // This is a simplified implementation
      // In a real app, you'd query your users collection based on the targeting criteria
      
      const constraints = [];
      
      if (targeting.userTypes && targeting.userTypes.length > 0 && !targeting.userTypes.includes('all')) {
        constraints.push(where('role', 'in', targeting.userTypes));
      }
      
      if (targeting.associations && targeting.associations.length > 0) {
        constraints.push(where('asociacionId', 'in', targeting.associations));
      }

      const q = query(collection(db, 'users'), ...constraints);
      const snapshot = await getDocs(q);
      
      let userIds = snapshot.docs.map(doc => doc.id);
      
      // Exclude specified users
      if (targeting.excludeUsers && targeting.excludeUsers.length > 0) {
        userIds = userIds.filter(id => !targeting.excludeUsers!.includes(id));
      }
      
      return userIds;
    } catch (error) {
      console.error('❌ Error getting target users:', error);
      return [];
    }
  }

  // Record execution
  private async recordExecution(scheduledNotificationId: string, targetCount: number): Promise<void> {
    try {
      await addDoc(collection(db, this.EXECUTIONS_COLLECTION), {
        scheduledNotificationId,
        targetCount,
        executedAt: serverTimestamp(),
        status: 'completed',
      });
    } catch (error) {
      console.error('❌ Error recording execution:', error);
    }
  }

  // Update trigger analytics
  private async updateTriggerAnalytics(triggerId: string): Promise<void> {
    try {
      const docRef = doc(db, this.TRIGGERS_COLLECTION, triggerId);
      
      // In a real implementation, you'd calculate actual stats
      await updateDoc(docRef, {
        'analytics.totalTriggers': (await this.getNotificationTriggers()).find(t => t.id === triggerId)?.analytics.totalTriggers || 0 + 1,
        'analytics.lastTriggered': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Error updating trigger analytics:', error);
    }
  }

  // Get scheduler statistics
  async getSchedulerStats(): Promise<{
    scheduledNotifications: {
      total: number;
      active: number;
      completed: number;
      paused: number;
    };
    triggers: {
      total: number;
      active: number;
      totalExecutions: number;
    };
    campaigns: {
      total: number;
      running: number;
      completed: number;
    };
    upcomingExecutions: {
      next24Hours: number;
      nextWeek: number;
    };
  }> {
    try {
      const [scheduledNotifications, triggers] = await Promise.all([
        this.getScheduledNotifications(true),
        this.getNotificationTriggers(true),
      ]);

      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        scheduledNotifications: {
          total: scheduledNotifications.length,
          active: scheduledNotifications.filter(s => s.status === 'active').length,
          completed: scheduledNotifications.filter(s => s.status === 'completed').length,
          paused: scheduledNotifications.filter(s => s.status === 'paused').length,
        },
        triggers: {
          total: triggers.length,
          active: triggers.filter(t => t.isActive).length,
          totalExecutions: triggers.reduce((sum, t) => sum + t.analytics.totalTriggers, 0),
        },
        campaigns: {
          total: 0, // TODO: Implement campaign stats
          running: 0,
          completed: 0,
        },
        upcomingExecutions: {
          next24Hours: scheduledNotifications.filter(s => 
            s.nextExecution && s.nextExecution <= next24Hours
          ).length,
          nextWeek: scheduledNotifications.filter(s => 
            s.nextExecution && s.nextExecution <= nextWeek
          ).length,
        },
      };
    } catch (error) {
      console.error('❌ Error getting scheduler stats:', error);
      throw error;
    }
  }

  // Cleanup method
  cleanup(): void {
    this.stopProcessing();
  }
}

// Export singleton instance
export const notificationSchedulerService = new NotificationSchedulerService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    notificationSchedulerService.cleanup();
  });
}