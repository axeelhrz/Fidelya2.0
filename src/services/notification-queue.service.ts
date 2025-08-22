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
import { SimpleNotificationFormData, SimpleNotificationChannel } from '@/types/simple-notification';
import { simpleNotificationService } from './simple-notifications.service';

export interface QueuedNotification {
  id: string;
  notificationId: string;
  recipientIds: string[];
  notificationData: NotificationFormData;
  
  // Queue metadata
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: NotificationPriority;
  attempts: number;
  maxAttempts: number;
  
  // Scheduling
  scheduledFor?: Date;
  processAfter: Date;
  
  // Execution tracking
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Error handling
  lastError?: string;
  errorHistory: {
    attempt: number;
    error: string;
    timestamp: Date;
  }[];
  
  // Batch information
  batchId?: string;
  batchSize?: number;
}

export interface QueueOptions {
  priority?: NotificationPriority;
  maxAttempts?: number;
  delay?: number; // Delay in minutes
  batchId?: string;
}

export interface QueueStats {
  totalInQueue: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  paused: boolean;
  averageProcessingTime: number;
  throughputPerHour: number;
  errorRate: number;
}

class NotificationQueueService {
  private readonly QUEUE_COLLECTION = 'notificationQueue';
  private readonly BATCH_SIZE = 10;
  private readonly PROCESSING_INTERVAL = 30000; // 30 seconds
  
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private isPaused = false;

  constructor() {
    // Auto-start processing in browser environment
    if (typeof window !== 'undefined') {
      this.startProcessing();
    }
  }

  // ==================== QUEUE MANAGEMENT ====================

  /**
   * Add notification to queue for immediate processing
   */
  async enqueueNotification(
    notificationId: string,
    recipientIds: string[],
    notificationData: NotificationFormData,
    options: QueueOptions = {}
  ): Promise<string> {
    try {
      const queueItem: Omit<QueuedNotification, 'id'> = {
        notificationId,
        recipientIds,
        notificationData,
        status: 'pending',
        priority: options.priority || 'medium',
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        processAfter: new Date(Date.now() + (options.delay || 0) * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorHistory: [],
        batchId: options.batchId,
        batchSize: recipientIds.length,
      };

      const docRef = await addDoc(collection(db, this.QUEUE_COLLECTION), {
        ...queueItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        processAfter: Timestamp.fromDate(queueItem.processAfter),
      });

      console.log(`📥 Enqueued notification: ${notificationId} for ${recipientIds.length} recipients`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error enqueuing notification:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for future processing
   */
  async scheduleNotification(
    notificationId: string,
    recipientIds: string[],
    notificationData: NotificationFormData,
    scheduledFor: Date,
    options: QueueOptions = {}
  ): Promise<string> {
    try {
      const queueItem: Omit<QueuedNotification, 'id'> = {
        notificationId,
        recipientIds,
        notificationData,
        status: 'pending',
        priority: options.priority || 'medium',
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        scheduledFor,
        processAfter: scheduledFor,
        createdAt: new Date(),
        updatedAt: new Date(),
        errorHistory: [],
        batchId: options.batchId,
        batchSize: recipientIds.length,
      };

      const docRef = await addDoc(collection(db, this.QUEUE_COLLECTION), {
        ...queueItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        scheduledFor: Timestamp.fromDate(scheduledFor),
        processAfter: Timestamp.fromDate(queueItem.processAfter),
      });

      console.log(`⏰ Scheduled notification: ${notificationId} for ${scheduledFor.toISOString()}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const queueQuery = query(collection(db, this.QUEUE_COLLECTION));
      const snapshot = await getDocs(queueQuery);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        processAfter: doc.data().processAfter?.toDate() || new Date(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QueuedNotification[];

      const stats: QueueStats = {
        totalInQueue: items.length,
        pending: items.filter(item => item.status === 'pending').length,
        processing: items.filter(item => item.status === 'processing').length,
        sent: items.filter(item => item.status === 'sent').length,
        failed: items.filter(item => item.status === 'failed').length,
        cancelled: items.filter(item => item.status === 'cancelled').length,
        paused: this.isPaused,
        averageProcessingTime: this.calculateAverageProcessingTime(items),
        throughputPerHour: this.calculateThroughput(items),
        errorRate: this.calculateErrorRate(items),
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Get queued notifications with pagination
   */
  async getQueuedNotifications(
    status?: QueuedNotification['status'],
    limitCount: number = 50
  ): Promise<QueuedNotification[]> {
    try {
      const constraints = [];
      
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(limitCount));

      const q = query(collection(db, this.QUEUE_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        processAfter: doc.data().processAfter?.toDate() || new Date(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        errorHistory: doc.data().errorHistory?.map((error: { attempt: number; error: string; timestamp: Timestamp }) => ({
          ...error,
          timestamp: error.timestamp?.toDate() || new Date(),
        })) || [],
      })) as QueuedNotification[];
    } catch (error) {
      console.error('❌ Error getting queued notifications:', error);
      throw error;
    }
  }

  /**
   * Cancel a queued notification
   */
  async cancelNotification(queueId: string): Promise<void> {
    try {
      const docRef = doc(db, this.QUEUE_COLLECTION, queueId);
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      console.log(`❌ Cancelled queued notification: ${queueId}`);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Retry a failed notification
   */
  async retryNotification(queueId: string): Promise<void> {
    try {
      const docRef = doc(db, this.QUEUE_COLLECTION, queueId);
      await updateDoc(docRef, {
        status: 'pending',
        attempts: 0,
        processAfter: Timestamp.fromDate(new Date()),
        lastError: null,
        updatedAt: serverTimestamp(),
      });

      console.log(`🔄 Retrying notification: ${queueId}`);
    } catch (error) {
      console.error('❌ Error retrying notification:', error);
      throw error;
    }
  }

  // ==================== PROCESSING ENGINE ====================

  /**
   * Start queue processing
   */
  startProcessing(): void {
    if (this.processingInterval) {
      this.stopProcessing();
    }

    console.log('🔄 Starting notification queue processing...');
    this.processingInterval = setInterval(() => {
      if (!this.isPaused) {
        this.processQueue().catch(error => {
          console.error('❌ Queue processing error:', error);
        });
      }
    }, this.PROCESSING_INTERVAL);

    // Process immediately if not paused
    if (!this.isPaused) {
      this.processQueue().catch(error => {
        console.error('❌ Initial queue processing error:', error);
      });
    }
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Stopped notification queue processing');
    }
  }

  /**
   * Pause queue processing
   */
  async pauseProcessing(): Promise<void> {
    this.isPaused = true;
    console.log('⏸️ Paused notification queue processing');
  }

  /**
   * Resume queue processing
   */
  async resumeProcessing(): Promise<void> {
    this.isPaused = false;
    console.log('▶️ Resumed notification queue processing');
  }

  /**
   * Process pending notifications in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      
      // Get pending notifications ready for processing
      const pendingQuery = query(
        collection(db, this.QUEUE_COLLECTION),
        where('status', '==', 'pending'),
        where('processAfter', '<=', Timestamp.fromDate(now)),
        orderBy('processAfter', 'asc'),
        orderBy('priority', 'desc'),
        limit(this.BATCH_SIZE)
      );

      const snapshot = await getDocs(pendingQuery);
      
      if (snapshot.empty) {
        return;
      }

      console.log(`📤 Processing ${snapshot.docs.length} queued notifications...`);

      // Process each notification
      for (const docSnapshot of snapshot.docs) {
        const queueItem = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date(),
          processAfter: docSnapshot.data().processAfter?.toDate() || new Date(),
          scheduledFor: docSnapshot.data().scheduledFor?.toDate(),
          processedAt: docSnapshot.data().processedAt?.toDate(),
          completedAt: docSnapshot.data().completedAt?.toDate(),
          errorHistory: docSnapshot.data().errorHistory || [],
        } as QueuedNotification;

        await this.processQueueItem(queueItem);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(queueItem: QueuedNotification): Promise<void> {
    try {
      console.log(`🚀 Processing queued notification: ${queueItem.notificationId}`);

      // Mark as processing
      await updateDoc(doc(db, this.QUEUE_COLLECTION, queueItem.id), {
        status: 'processing',
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create temporary recipients for the simple notification service
      const tempRecipients = queueItem.recipientIds.map((id, index) => ({
        id,
        name: `Recipient ${index + 1}`,
        email: id.includes('@') ? id : `user${index}@example.com`,
        type: 'socio' as const
      }));

      // Map notification channels to simple notification channels
      const mapChannels = (channels: string[]): SimpleNotificationChannel[] => {
        return channels.map(channel => {
          switch (channel.toLowerCase()) {
            case 'email':
              return 'email' as const;
            case 'whatsapp':
            case 'sms':
              return 'whatsapp' as const;
            case 'app':
            case 'push':
              return 'app' as const;
            default:
              return 'app' as const;
          }
        }).filter((channel, index, array) => array.indexOf(channel) === index); // Remove duplicates
      };

      // Prepare notification data for simple service
      const simpleNotificationData: SimpleNotificationFormData = {
        title: queueItem.notificationData.title,
        message: queueItem.notificationData.message,
        type: this.mapNotificationType(queueItem.notificationData.type || 'info'),
        channels: mapChannels(['email', 'app']), // Default channels
        recipientIds: queueItem.recipientIds
      };

      // Override the getRecipients method temporarily
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => tempRecipients;

      // Create and send the notification
      const tempNotificationId = await simpleNotificationService.createNotification(
        simpleNotificationData,
        'queue-system'
      );

      const result = await simpleNotificationService.sendNotification(
        tempNotificationId,
        simpleNotificationData
      );

      // Restore the original method
      simpleNotificationService.getRecipients = originalGetRecipients;

      // Update queue item based on result
      if (result.success) {
        await updateDoc(doc(db, this.QUEUE_COLLECTION, queueItem.id), {
          status: 'sent',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Successfully processed queued notification: ${queueItem.notificationId}`);
      } else {
        throw new Error(result.errors.join(', ') || 'Unknown error');
      }

    } catch (error) {
      console.error(`❌ Error processing queue item ${queueItem.id}:`, error);
      await this.handleProcessingError(queueItem, error);
    }
  }

  /**
   * Map notification type to simple notification type
   */
  private mapNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' {
    switch (type.toLowerCase()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  }

  /**
   * Handle processing errors with retry logic
   */
  private async handleProcessingError(queueItem: QueuedNotification, error: unknown): Promise<void> {
    try {
      const attempts = queueItem.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const errorEntry = {
        attempt: attempts,
        error: errorMessage,
        timestamp: new Date(),
      };

      const updatedErrorHistory = [...queueItem.errorHistory, errorEntry];

      if (attempts >= queueItem.maxAttempts) {
        // Max attempts reached, mark as failed
        await updateDoc(doc(db, this.QUEUE_COLLECTION, queueItem.id), {
          status: 'failed',
          attempts,
          lastError: errorMessage,
          errorHistory: updatedErrorHistory.map(e => ({
            ...e,
            timestamp: Timestamp.fromDate(e.timestamp),
          })),
          updatedAt: serverTimestamp(),
        });

        console.log(`💀 Failed notification after ${attempts} attempts: ${queueItem.id}`);
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, attempts) * 60 * 1000; // Exponential backoff in milliseconds
        const retryTime = new Date(Date.now() + retryDelay);

        await updateDoc(doc(db, this.QUEUE_COLLECTION, queueItem.id), {
          status: 'pending',
          attempts,
          lastError: errorMessage,
          processAfter: Timestamp.fromDate(retryTime),
          errorHistory: updatedErrorHistory.map(e => ({
            ...e,
            timestamp: Timestamp.fromDate(e.timestamp),
          })),
          updatedAt: serverTimestamp(),
        });

        console.log(`🔄 Scheduled retry for notification: ${queueItem.id} (attempt ${attempts}/${queueItem.maxAttempts})`);
      }
    } catch (updateError) {
      console.error('❌ Error updating failed queue item:', updateError);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clean up old completed/failed notifications
   */
  async clearOldNotifications(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const oldQuery = query(
        collection(db, this.QUEUE_COLLECTION),
        where('status', 'in', ['sent', 'failed', 'cancelled']),
        where('updatedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(oldQuery);
      
      let deletedCount = 0;
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        deletedCount++;
      }

      console.log(`🧹 Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(items: QueuedNotification[]): number {
    const processedItems = items.filter(item => 
      item.processedAt && item.completedAt && item.status === 'sent'
    );

    if (processedItems.length === 0) return 0;

    const totalTime = processedItems.reduce((sum, item) => {
      const processingTime = item.completedAt!.getTime() - item.processedAt!.getTime();
      return sum + processingTime;
    }, 0);

    return totalTime / processedItems.length / 1000; // Return in seconds
  }

  /**
   * Calculate throughput per hour
   */
  private calculateThroughput(items: QueuedNotification[]): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentlySent = items.filter(item => 
      item.status === 'sent' && 
      item.completedAt && 
      item.completedAt > oneHourAgo
    );

    return recentlySent.length;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(items: QueuedNotification[]): number {
    if (items.length === 0) return 0;
    
    const failedItems = items.filter(item => item.status === 'failed');
    return (failedItems.length / items.length) * 100;
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    this.stopProcessing();
  }
}

// Export singleton instance
export const notificationQueueService = new NotificationQueueService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    notificationQueueService.cleanup();
  });
}