import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { simpleNotificationService } from './simple-notifications.service';
import { NotificationFormData } from '@/types/notification';
import { SimpleNotificationFormData, SimpleNotificationChannel } from '@/types/simple-notification';

/**
 * Unified notification service that provides a consistent interface
 * for sending notifications across the application
 */
class NotificationService {
  
  /**
   * Create a notification document in Firestore
   */
  async createNotification(notificationData: NotificationFormData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        category: notificationData.category || 'general',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Map notification channels to simple notification channels
   */
  private mapChannels(channels: string[]): SimpleNotificationChannel[] {
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
   * Send notification to a specific user
   * This method bridges the gap between the expected interface and the available services
   */
  async sendNotificationToUser(
    notificationId: string,
    userId: string,
    notificationData: NotificationFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For email-based notifications (like invitations), we'll use the simple notification service
      // but adapt it to work with a single user
      
      // Create a temporary recipient for the user
      const tempRecipient = {
        id: userId,
        name: 'Usuario',
        email: userId, // In invitation context, userId is actually the email
        type: 'socio' as const
      };

      // Prepare notification data for simple service with proper type mapping
      const simpleNotificationData: SimpleNotificationFormData = {
        title: notificationData.title,
        message: notificationData.message,
        type: this.mapNotificationType(notificationData.type || 'info'),
        channels: this.mapChannels(['email']), // Default to email for invitations
        recipientIds: [userId]
      };

      // Override the getRecipients method temporarily to return our single recipient
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => [tempRecipient];

      // Create and send the notification
      const tempNotificationId = await simpleNotificationService.createNotification(
        simpleNotificationData,
        'system'
      );

      const result = await simpleNotificationService.sendNotification(
        tempNotificationId,
        simpleNotificationData
      );

      // Restore the original method
      simpleNotificationService.getRecipients = originalGetRecipients;

      // Update the original notification status
      if (notificationId) {
        await setDoc(doc(db, 'notifications', notificationId), {
          status: result.success ? 'sent' : 'failed',
          sentAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      return {
        success: result.success,
        error: result.errors.length > 0 ? result.errors.join(', ') : undefined
      };

    } catch (error) {
      console.error('Error sending notification to user:', error);
      
      // Update notification status to failed
      if (notificationId) {
        try {
          await setDoc(doc(db, 'notifications', notificationId), {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (updateError) {
          console.error('Error updating notification status:', updateError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    notificationId: string,
    userIds: string[],
    notificationData: NotificationFormData
  ): Promise<{ success: boolean; sentCount: number; failedCount: number; errors: string[] }> {
    const results = {
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: [] as string[]
    };

    try {
      for (const userId of userIds) {
        const result = await this.sendNotificationToUser(notificationId, userId, notificationData);
        
        if (result.success) {
          results.sentCount++;
        } else {
          results.failedCount++;
          if (result.error) {
            results.errors.push(`${userId}: ${result.error}`);
          }
        }
      }

      results.success = results.sentCount > 0;
      return results;

    } catch (error) {
      console.error('Error sending notifications to users:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus() {
    return simpleNotificationService.getServicesStatus();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;