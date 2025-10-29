import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FieldValue } from 'firebase/firestore';

export interface ApprovalWorkflow {
  id?: string;
  name: string;
  description: string;
  asociacionId: string;
  steps: ApprovalStep[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  order: number;
  approverType: 'user' | 'role' | 'any' | 'all';
  approvers: string[]; // IDs de usuarios o nombres de roles
  requiredApprovals: number;
  autoApprove?: boolean;
  autoApproveConditions?: ApprovalCondition[];
  escalationTime?: number; // en horas
  escalationTo?: string[];
}

export interface WorkflowTrigger {
  type: 'notification_type' | 'recipient_count' | 'content_keywords' | 'priority' | 'channel';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}
export interface ApprovalRequest {
  id?: string;
  workflowId: string;
  notificationId: string;
  requesterId: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  currentStep: number;
  steps: ApprovalRequestStep[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    notificationType: string;
    recipientCount: number;
    channels: string[];
    scheduledFor?: Timestamp | FieldValue;
    templateId?: string;
    segmentId?: string;
  };
  comments: ApprovalComment[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
}

export interface ApprovalRequestStep {
  stepId: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvals: ApprovalAction[];
  requiredApprovals: number;
  escalatedAt?: Timestamp;
}

export interface ApprovalAction {
  approverId: string;
  approverName: string;
  action: 'approve' | 'reject';
  comment?: string;
  timestamp: Timestamp;
}
export interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: Timestamp | FieldValue;
  isInternal: boolean;
}


export interface ApprovalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  avgApprovalTime: number; // en horas
  approvalRate: number;
  escalatedRequests: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export interface NotificationData {
  id?: string;
  asociacionId: string;
  type: string;
  recipientCount?: number;
  channels?: string[];
  scheduledFor?: Timestamp;
  templateId?: string;
  segmentId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class NotificationApprovalService {
  private readonly WORKFLOWS_COLLECTION = 'approval_workflows';
  private readonly REQUESTS_COLLECTION = 'approval_requests';

  // (Duplicate removed. Only one implementation of validateWorkflowSteps should exist.)

  // Crear workflow de aprobación
  async createWorkflow(workflowData: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validar pasos del workflow
      this.validateWorkflowSteps(workflowData.steps);

      const docRef = await addDoc(collection(db, this.WORKFLOWS_COLLECTION), {
        ...workflowData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      throw error;
    }
  }

  // Obtener workflows
  async getWorkflows(asociacionId: string, isActive?: boolean): Promise<ApprovalWorkflow[]> {
    try {
      let q = query(
        collection(db, this.WORKFLOWS_COLLECTION),
        where('asociacionId', '==', asociacionId),
        orderBy('createdAt', 'desc')
      );

      if (isActive !== undefined) {
        q = query(q, where('isActive', '==', isActive));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ApprovalWorkflow));
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw error;
    }
  }

  // Crear solicitud de aprobación
  async createApprovalRequest(
    notificationData: NotificationData,
    requesterId: string,
    requesterName: string
  ): Promise<string | null> {
    try {
      // Encontrar workflow aplicable
      const workflow = await this.findApplicableWorkflow(notificationData);
      
      if (!workflow) {
        // No se requiere aprobación
        return null;
      }

      // Crear pasos de la solicitud
      const requestSteps: ApprovalRequestStep[] = workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        approvals: [],
        requiredApprovals: step.requiredApprovals
      }));

      // Marcar el primer paso como activo
      if (requestSteps.length > 0) {
        requestSteps[0].status = 'pending';
      }

      const requestData: Omit<ApprovalRequest, 'id'> = {
        workflowId: workflow.id!,
        notificationId: notificationData.id || '',
        requesterId,
        requesterName,
        status: 'pending',
        currentStep: 0,
        steps: requestSteps,
        priority: notificationData.priority || 'normal',
        metadata: {
          notificationType: notificationData.type,
          recipientCount: notificationData.recipientCount || 0,
          channels: notificationData.channels || [],
          scheduledFor: notificationData.scheduledFor,
          templateId: notificationData.templateId,
          segmentId: notificationData.segmentId
        },
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.REQUESTS_COLLECTION), requestData);

      // Verificar auto-aprobación
      await this.checkAutoApproval(docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  // Procesar acción de aprobación
  async processApprovalAction(
    requestId: string,
    approverId: string,
    approverName: string,
    action: 'approve' | 'reject',
    comment?: string
  ): Promise<void> {
    try {
      // Obtener solicitud actual
      const requestDoc = await getDocs(query(
        collection(db, this.REQUESTS_COLLECTION),
        where('__name__', '==', requestId)
      ));

      if (requestDoc.empty) {
        throw new Error('Solicitud de aprobación no encontrada');
      }

      const requestData = requestDoc.docs[0].data() as ApprovalRequest;

      if (requestData.status !== 'pending') {
        throw new Error('La solicitud ya no está pendiente');
      }

      // Verificar si el usuario puede aprobar el paso actual
      const currentStep = requestData.steps[requestData.currentStep];
      const workflow = await this.getWorkflowById(requestData.workflowId);
      
      if (!workflow) {
        throw new Error('Workflow no encontrado');
      }

      const workflowStep = workflow.steps.find(s => s.id === currentStep.stepId);
      if (!workflowStep) {
        throw new Error('Paso del workflow no encontrado');
      }

      if (!this.canUserApprove(approverId, workflowStep)) {
        throw new Error('Usuario no autorizado para aprobar este paso');
      }

      // Verificar si ya aprobó
      const existingApproval = currentStep.approvals.find(a => a.approverId === approverId);
      if (existingApproval) {
        throw new Error('El usuario ya procesó esta solicitud');
      }

      // Agregar aprobación
      const approvalAction: ApprovalAction = {
        approverId,
        approverName,
        action,
        comment,
        timestamp: serverTimestamp() as Timestamp
      };

      currentStep.approvals.push(approvalAction);

      // Verificar si el paso está completo
      if (action === 'reject') {
        // Rechazar toda la solicitud
        await this.updateApprovalRequest(requestId, {
          status: 'rejected',
          steps: requestData.steps,
          completedAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        });
      } else {
        // Verificar si se alcanzó el número requerido de aprobaciones
        const approvals = currentStep.approvals.filter(a => a.action === 'approve').length;
        
        if (approvals >= currentStep.requiredApprovals) {
          currentStep.status = 'approved';
          
          // Avanzar al siguiente paso o completar
          if (requestData.currentStep + 1 < requestData.steps.length) {
            // Siguiente paso
            const nextStep = requestData.currentStep + 1;
            requestData.steps[nextStep].status = 'pending';
            
            await this.updateApprovalRequest(requestId, {
              currentStep: nextStep,
              steps: requestData.steps,
              updatedAt: serverTimestamp() as Timestamp
            });

            // Verificar auto-aprobación del siguiente paso
            await this.checkAutoApproval(requestId);
          } else {
            // Completar aprobación
            await this.updateApprovalRequest(requestId, {
              status: 'approved',
              steps: requestData.steps,
              completedAt: serverTimestamp() as Timestamp,
              updatedAt: serverTimestamp() as Timestamp
            });
          }
        } else {
          // Actualizar paso actual
          await this.updateApprovalRequest(requestId, {
            steps: requestData.steps,
            updatedAt: serverTimestamp() as Timestamp
          });
        }
      }
    } catch (error) {
      console.error('Error processing approval action:', error);
      throw error;
    }
  }

  // Obtener solicitudes de aprobación
  async getApprovalRequests(
    asociacionId: string,
    status?: ApprovalRequest['status'],
    approverId?: string,
    limitCount: number = 50
  ): Promise<ApprovalRequest[]> {
    try {
      let q = query(
        collection(db, this.REQUESTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      let requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ApprovalRequest));

      // Filtrar por asociación y aprobador si es necesario
      if (asociacionId || approverId) {
        const workflows = await this.getWorkflows(asociacionId);
        const workflowIds = workflows.map(w => w.id);

        requests = requests.filter(request => {
          if (asociacionId && !workflowIds.includes(request.workflowId)) {
            return false;
          }

          if (approverId) {
            const workflow = workflows.find(w => w.id === request.workflowId);
            if (!workflow) return false;

            const currentStep = workflow.steps[request.currentStep];
            if (!currentStep || !this.canUserApprove(approverId, currentStep)) {
              return false;
            }
          }

          return true;
        });
      }

      return requests;
    } catch (error) {
      console.error('Error getting approval requests:', error);
      throw error;
    }
  }

  // Agregar comentario
  async addComment(
    requestId: string,
    userId: string,
    userName: string,
    comment: string,
    isInternal: boolean = false
  ): Promise<void> {
    try {
      const requestDoc = await getDocs(query(
        collection(db, this.REQUESTS_COLLECTION),
        where('__name__', '==', requestId)
      ));

      if (requestDoc.empty) {
        throw new Error('Solicitud no encontrada');
      }

      const requestData = requestDoc.docs[0].data() as ApprovalRequest;

      const newComment: ApprovalComment = {
        id: Date.now().toString(),
        userId,
        userName,
        comment,
        timestamp: serverTimestamp() as Timestamp,
        isInternal
      };

      requestData.comments.push(newComment);

      await this.updateApprovalRequest(requestId, {
        comments: requestData.comments,
        updatedAt: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Obtener estadísticas de aprobación
  async getApprovalStats(asociacionId: string, days: number = 30): Promise<ApprovalStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const workflows = await this.getWorkflows(asociacionId);
      const workflowIds = workflows.map(w => w.id);

      const q = query(
        collection(db, this.REQUESTS_COLLECTION),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs
        .map(doc => doc.data() as ApprovalRequest)
        .filter(request => workflowIds.includes(request.workflowId));
      const stats: ApprovalStats = {
        totalRequests: requests.length,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        cancelledRequests: 0,
        avgApprovalTime: 0,
        approvalRate: 0,
        escalatedRequests: 0,
        byPriority: {},
        byType: {}
      };

      let totalApprovalTime = 0;
      let completedRequests = 0;

      requests.forEach(request => {
        stats[`${request.status}Requests`]++;
        
        // Por prioridad
        stats.byPriority[request.priority] = (stats.byPriority[request.priority] || 0) + 1;
        
        // Por tipo
        const type = request.metadata.notificationType;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Tiempo de aprobación
        if (request.completedAt && (request.status === 'approved' || request.status === 'rejected')) {
          let completedAtMillis = 0;
          let createdAtMillis = 0;
          if ('toMillis' in request.completedAt && typeof request.completedAt.toMillis === 'function') {
            completedAtMillis = request.completedAt.toMillis();
          }
          if ('toMillis' in request.createdAt && typeof request.createdAt.toMillis === 'function') {
            createdAtMillis = request.createdAt.toMillis();
          }
          const approvalTime = completedAtMillis - createdAtMillis;
          totalApprovalTime += approvalTime;
          completedRequests++;
        }

        // Escalaciones
        if (request.status === 'escalated') {
          stats.escalatedRequests++;
        }
      });

      if (completedRequests > 0) {
        stats.avgApprovalTime = totalApprovalTime / completedRequests / (1000 * 60 * 60); // en horas
      }
      return stats;
    } catch (error) {
      console.error('Error getting approval stats:', error);
      throw error;
    }
  }

  // Métodos privados
  private async findApplicableWorkflow(notificationData: NotificationData): Promise<ApprovalWorkflow | null> {
    try {
      const workflows = await this.getWorkflows(notificationData.asociacionId, true);

      for (const workflow of workflows) {
        if (this.matchesTriggers(notificationData, workflow.triggers)) {
          return workflow;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding applicable workflow:', error);
      return null;
    }
  }

  private matchesTriggers(notificationData: NotificationData, triggers: WorkflowTrigger[]): boolean {
    return triggers.every(trigger => {
      // Map trigger.type to NotificationData property
      let value: string | number | string[] | undefined;
      switch (trigger.type) {
        case 'notification_type':
          value = notificationData.type;
          break;
        case 'recipient_count':
          value = notificationData.recipientCount;
          break;
        case 'content_keywords':
          // Assuming you want to check keywords in templateId or other content field
          value = notificationData.templateId || '';
          break;
        case 'priority':
          value = notificationData.priority;
          break;
        case 'channel':
          value = notificationData.channels;
          break;
        default:
          value = undefined;
      }

      switch (trigger.operator) {
        case 'equals':
          return value === trigger.value;
        case 'contains':
          return typeof value === 'string' && String(value).includes(String(trigger.value));
        case 'greater_than':
          return Number(value) > Number(trigger.value);
        case 'less_than':
          return Number(value) < Number(trigger.value);
        case 'in':
          return Array.isArray(trigger.value) && typeof value === 'string' && trigger.value.includes(value);
        default:
          return false;
      }
    });
  }

  private canUserApprove(userId: string, step: ApprovalStep): boolean {
    switch (step.approverType) {
      case 'user':
        return step.approvers.includes(userId);
      case 'role':
        // Aquí deberías verificar los roles del usuario
        // Por simplicidad, asumimos que el userId contiene el rol
        return step.approvers.some(role => userId.includes(role));
      case 'any':
        return step.approvers.includes(userId);
      case 'all':
        return step.approvers.includes(userId);
      default:
        return false;
    }
  }

  private async checkAutoApproval(requestId: string): Promise<void> {
    try {
      const requestDoc = await getDocs(query(
        collection(db, this.REQUESTS_COLLECTION),
        where('__name__', '==', requestId)
      ));

      if (requestDoc.empty) return;

      const requestData = requestDoc.docs[0].data() as ApprovalRequest;
      const workflow = await this.getWorkflowById(requestData.workflowId);
      
      if (!workflow) return;

      const currentStep = workflow.steps[requestData.currentStep];
      
      if (currentStep.autoApprove && currentStep.autoApproveConditions) {
        const shouldAutoApprove = currentStep.autoApproveConditions.every(condition => {
          const value = requestData.metadata[condition.field as keyof typeof requestData.metadata];
          
          switch (condition.operator) {
            case 'equals':
              return value === condition.value;
            case 'less_than':
              return Number(value) < Number(condition.value);
            case 'greater_than':
              return Number(value) > Number(condition.value);
            case 'contains':
              return String(value).includes(String(condition.value));
            default:
              return false;
          }
        });

        if (shouldAutoApprove) {
          await this.processApprovalAction(
            requestId,
            'system',
            'Sistema (Auto-aprobación)',
            'approve',
            'Aprobado automáticamente por el sistema'
          );
        }
      }
    } catch (error) {
      console.error('Error checking auto approval:', error);
    }
  }

  private async getWorkflowById(workflowId: string): Promise<ApprovalWorkflow | null> {
    try {
      const workflowDoc = await getDocs(query(
        collection(db, this.WORKFLOWS_COLLECTION),
        where('__name__', '==', workflowId)
      ));

      if (workflowDoc.empty) return null;

      return {
        id: workflowDoc.docs[0].id,
        ...workflowDoc.docs[0].data()
      } as ApprovalWorkflow;
    } catch (error) {
      console.error('Error getting workflow by ID:', error);
      return null;
    }
  }

  private async updateApprovalRequest(requestId: string, updates: Partial<ApprovalRequest>): Promise<void> {
    const requestRef = doc(db, this.REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, updates);
  }

  private validateWorkflowSteps(steps: ApprovalStep[]): void {
    if (steps.length === 0) {
      throw new Error('El workflow debe tener al menos un paso');
    }

    // Verificar orden secuencial
    const orders = steps.map(s => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i) {
        throw new Error('Los pasos del workflow deben tener orden secuencial comenzando desde 0');
      }
    }

    // Verificar que cada paso tenga aprobadores
    steps.forEach(step => {
      if (step.approvers.length === 0) {
        throw new Error(`El paso "${step.name}" debe tener al menos un aprobador`);
      }
      
      if (step.requiredApprovals <= 0) {
        throw new Error(`El paso "${step.name}" debe requerir al menos una aprobación`);
      }
    });
  }

  // Obtener plantillas de workflow
  getWorkflowTemplates(): Partial<ApprovalWorkflow>[] {
    return [
      {
        name: 'Aprobación Simple',
        description: 'Un solo nivel de aprobación para notificaciones estándar',
        steps: [
          {
            id: 'step1',
            name: 'Aprobación Manager',
            description: 'Aprobación por manager de marketing',
            order: 0,
            approverType: 'role',
            approvers: ['marketing_manager'],
            requiredApprovals: 1
          }
        ],
        triggers: [
          {
            type: 'recipient_count',
            operator: 'greater_than',
            value: 100
          }
        ]
      },
      {
        name: 'Aprobación Dual',
        description: 'Dos niveles de aprobación para notificaciones importantes',
        steps: [
          {
            id: 'step1',
            name: 'Revisión Técnica',
            description: 'Revisión por equipo técnico',
            order: 0,
            approverType: 'role',
            approvers: ['tech_lead'],
            requiredApprovals: 1
          },
          {
            id: 'step2',
            name: 'Aprobación Ejecutiva',
            description: 'Aprobación final por ejecutivo',
            order: 1,
            approverType: 'role',
            approvers: ['executive'],
            requiredApprovals: 1
          }
        ],
        triggers: [
          {
            type: 'priority',
            operator: 'equals',
            value: 'high'
          }
        ]
      }
    ];
  }
}

export const notificationApprovalService = new NotificationApprovalService();