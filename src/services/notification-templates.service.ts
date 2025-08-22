import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleError } from '@/lib/error-handler';
import { NotificationType, NotificationPriority, NotificationCategory } from '@/types/notification';

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  tags: string[];
  actionUrl?: string;
  actionLabel?: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    app: boolean;
  };
  variables: string[];
  isActive: boolean;
  isSystem: boolean;
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  usageCount: number;
  lastUsed?: Date | Timestamp;
}

export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  variables: string[];
}

class NotificationTemplatesService {
  private readonly COLLECTION_NAME = 'notification_templates';
  
  // System templates that are created automatically
  private readonly SYSTEM_TEMPLATES: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>[] = [
    {
      name: 'Bienvenida Socio',
      description: 'Plantilla de bienvenida para nuevos socios',
      title: 'Bienvenido a {{asociacion_nombre}}, {{socio_nombre}}!',
      message: 'Te damos la bienvenida a nuestra asociación. Tu número de socio es {{numero_socio}}. Disfruta de todos los beneficios disponibles.',
      type: 'info',
      priority: 'medium',
      category: 'membership',
      tags: ['bienvenida', 'socio', 'registro'],
      channels: {
        email: true,
        sms: false,
        push: true,
        app: true,
      },
      variables: ['asociacion_nombre', 'socio_nombre', 'numero_socio'],
      isActive: true,
      isSystem: true,
      createdBy: 'system',
    },
    {
      name: 'Beneficio Usado',
      description: 'Notificación cuando se usa un beneficio',
      title: 'Beneficio utilizado exitosamente',
      message: 'Has utilizado el beneficio "{{beneficio_titulo}}" en {{comercio_nombre}}. Descuento aplicado: {{descuento}}%',
      type: 'success',
      priority: 'medium',
      category: 'general',
      tags: ['beneficio', 'uso', 'descuento'],
      channels: {
        email: false,
        sms: false,
        push: true,
        app: true,
      },
      variables: ['beneficio_titulo', 'comercio_nombre', 'descuento'],
      isActive: true,
      isSystem: true,
      createdBy: 'system',
    },
    {
      name: 'Recordatorio Vencimiento',
      description: 'Recordatorio de vencimiento de membresía',
      title: 'Tu membresía vence pronto',
      message: 'Tu membresía en {{asociacion_nombre}} vence el {{fecha_vencimiento}}. Renueva para seguir disfrutando de los beneficios.',
      type: 'warning',
      priority: 'high',
      category: 'membership',
      tags: ['vencimiento', 'recordatorio', 'renovacion'],
      channels: {
        email: true,
        sms: true,
        push: true,
        app: true,
      },
      variables: ['asociacion_nombre', 'fecha_vencimiento'],
      isActive: true,
      isSystem: true,
      createdBy: 'system',
    },
  ];

  // Available template variables
  private readonly AVAILABLE_VARIABLES: Record<string, TemplateVariable> = {
    socio_nombre: { name: 'socio_nombre', description: 'Nombre del socio', type: 'text', required: false },
    socio_email: { name: 'socio_email', description: 'Email del socio', type: 'text', required: false },
    numero_socio: { name: 'numero_socio', description: 'Número de socio', type: 'text', required: false },
    asociacion_nombre: { name: 'asociacion_nombre', description: 'Nombre de la asociación', type: 'text', required: false },
    comercio_nombre: { name: 'comercio_nombre', description: 'Nombre del comercio', type: 'text', required: false },
    beneficio_titulo: { name: 'beneficio_titulo', description: 'Título del beneficio', type: 'text', required: false },
    descuento: { name: 'descuento', description: 'Porcentaje de descuento', type: 'number', required: false },
    fecha_vencimiento: { name: 'fecha_vencimiento', description: 'Fecha de vencimiento', type: 'date', required: false },
    monto: { name: 'monto', description: 'Monto en pesos', type: 'number', required: false },
    fecha_actual: { name: 'fecha_actual', description: 'Fecha actual', type: 'date', required: false },
    hora_actual: { name: 'hora_actual', description: 'Hora actual', type: 'text', required: false },
  };

  // Initialize system templates
  async initializeSystemTemplates(): Promise<void> {
    try {
      console.log('🔧 Initializing system notification templates...');
      
      for (const template of this.SYSTEM_TEMPLATES) {
        // Check if template already exists
        const existingQuery = query(
          collection(db, this.COLLECTION_NAME),
          where('name', '==', template.name),
          where('isSystem', '==', true)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          await addDoc(collection(db, this.COLLECTION_NAME), {
            ...template,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: 'system',
            usageCount: 0,
          });
          
          console.log(`✅ Created system template: ${template.name}`);
        }
      }
      
      console.log('✅ System templates initialization completed');
    } catch (error) {
      console.error('❌ Error initializing system templates:', error);
      throw error;
    }
  }

  // Get all templates
  async getTemplates(includeInactive = false): Promise<NotificationTemplate[]> {
    try {
      let templatesQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      if (!includeInactive) {
        templatesQuery = query(
          collection(db, this.COLLECTION_NAME),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(templatesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastUsed: doc.data().lastUsed?.toDate(),
      })) as NotificationTemplate[];
    } catch (error) {
      console.error('Error getting templates:', error);
      handleError(error, 'Get Templates');
      throw error;
    }
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    try {
      if (!id) {
        throw new Error('Template ID is required');
      }
      if (!id) {
        throw new Error('Template ID is required');
      }
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate(),
        } as NotificationTemplate;
      }

      return null;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      handleError(error, 'Get Template By ID');
      throw error;
    }
  }

  // Create new template
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>): Promise<NotificationTemplate> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...templateData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usageCount: 0,
      });

      const newTemplate = await this.getTemplateById(docRef.id);
      if (!newTemplate) {
        throw new Error('Failed to retrieve created template');
      }

      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      handleError(error, 'Create Template');
      throw error;
    }
  }

  // Update template
  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      
      // Remove fields that shouldn't be updated
      const {...updateData } = updates;
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      const updatedTemplate = await this.getTemplateById(id);
      if (!updatedTemplate) {
        throw new Error('Failed to retrieve updated template');
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      handleError(error, 'Update Template');
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    try {
      // Check if it's a system template
      const template = await this.getTemplateById(id);
      if (template?.isSystem) {
        throw new Error('No se pueden eliminar plantillas del sistema');
      }

      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting template:', error);
      handleError(error, 'Delete Template');
      throw error;
    }
  }

  // Duplicate template
  async duplicateTemplate(id: string, newName: string): Promise<NotificationTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(id);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      const duplicatedData = {
        ...originalTemplate,
        name: newName,
        isSystem: false, // Duplicated templates are never system templates
        createdBy: 'user', // TODO: Get actual user ID
      };

      // Remove fields that shouldn't be duplicated
      const { ...templateData } = duplicatedData;

      return await this.createTemplate(templateData);
    } catch (error) {
      console.error('Error duplicating template:', error);
      handleError(error, 'Duplicate Template');
      throw error;
    }
  }

  // Validate template content
  validateTemplate(title: string, message: string): TemplateValidation {
    const errors: string[] = [];
    const variables: string[] = [];

    // Extract variables from title and message
    const titleVariables = this.extractVariables(title);
    const messageVariables = this.extractVariables(message);
    const allVariables = [...new Set([...titleVariables, ...messageVariables])];

    // Validate variables exist in available variables
    for (const variable of allVariables) {
      if (!this.AVAILABLE_VARIABLES[variable]) {
        errors.push(`Variable desconocida: {{${variable}}}`);
      } else {
        variables.push(variable);
      }
    }

    // Basic validation
    if (!title.trim()) {
      errors.push('El título es requerido');
    }

    if (!message.trim()) {
      errors.push('El mensaje es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      variables,
    };
  }

  // Parse template with variables
  parseTemplate(template: string, variables: Record<string, string | number | Date>): string {
    let parsed = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      let stringValue = '';

      if (value instanceof Date) {
        stringValue = value.toLocaleDateString();
      } else {
        stringValue = String(value);
      }

      parsed = parsed.replace(regex, stringValue);
    }

    return parsed;
  }

  // Get available variables
  getAvailableVariables(): Record<string, TemplateVariable> {
    return { ...this.AVAILABLE_VARIABLES };
  }

  // Extract variables from template string
  private extractVariables(template: string): string[] {
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.push(match[1]);
    }

    return variables;
  }

  // Update template usage
  async updateTemplateUsage(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const template = await this.getTemplateById(id);
      
      if (template) {
        await updateDoc(docRef, {
          usageCount: (template.usageCount || 0) + 1,
          lastUsed: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating template usage:', error);
      // Don't throw error for usage tracking failures
    }
  }

  // Get templates by category
  async getTemplatesByCategory(category: NotificationCategory): Promise<NotificationTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(templatesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastUsed: doc.data().lastUsed?.toDate(),
      })) as NotificationTemplate[];
    } catch (error) {
      console.error('Error getting templates by category:', error);
      handleError(error, 'Get Templates By Category');
      throw error;
    }
  }

  // Search templates
  async searchTemplates(searchTerm: string): Promise<NotificationTemplate[]> {
    try {
      // Note: This is a simple implementation. For better search,
      // consider using Algolia or similar search service
      const templates = await this.getTemplates(true);
      
      const searchLower = searchTerm.toLowerCase();
      
      return templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.title.toLowerCase().includes(searchLower) ||
        template.message.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching templates:', error);
      handleError(error, 'Search Templates');
      throw error;
    }
  }
}

// Export singleton instance
export const notificationTemplatesService = new NotificationTemplatesService();
export default notificationTemplatesService;