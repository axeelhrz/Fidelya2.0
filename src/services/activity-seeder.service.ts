import { ActivityService } from './activity.service';
import { CreateActivityRequest, ActivityType } from '@/types/activity';

export class ActivitySeederService {
  /**
   * Generar actividades de ejemplo para una asociación
   */
  static async seedActivitiesForAsociacion(asociacionId: string): Promise<void> {
    try {
      console.log('🌱 Seeding activities for asociacion:', asociacionId);

      const activities = this.generateSampleActivities(asociacionId);
      
      // Crear actividades en lotes para mejor rendimiento
      const batchSize = 10;
      for (let i = 0; i < activities.length; i += batchSize) {
        const batch = activities.slice(i, i + batchSize);
        await Promise.all(
          batch.map(activity => ActivityService.createActivity(activity))
        );
        
        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Successfully seeded ${activities.length} activities`);
    } catch (error) {
      console.error('❌ Error seeding activities:', error);
      throw error;
    }
  }

  /**
   * Generar actividades de muestra realistas
   */
  private static generateSampleActivities(asociacionId: string): CreateActivityRequest[] {
    const activities: CreateActivityRequest[] = [];
    const now = new Date();

    // Nombres de ejemplo
    const socioNames = [
      'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
      'Carmen Fernández', 'José González', 'Isabel Sánchez', 'Miguel Torres', 'Laura Ruiz'
    ];

    const comercioNames = [
      'Restaurante El Buen Sabor', 'Farmacia Central', 'Librería Cervantes', 
      'Gimnasio FitLife', 'Peluquería Estilo', 'Panadería San José',
      'Ferretería Industrial', 'Óptica Visión', 'Veterinaria Mascota Feliz', 'Café Aroma'
    ];

    const beneficioTitles = [
      '20% descuento en consumo', '15% off en productos', 'Consulta gratuita',
      '2x1 en productos seleccionados', '10% descuento', 'Envío gratis',
      'Descuento especial socios', 'Promoción fin de semana'
    ];

    // Generar actividades de los últimos 30 días
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // 2-8 actividades por día
      const activitiesPerDay = Math.floor(Math.random() * 7) + 2;
      
      for (let i = 0; i < activitiesPerDay; i++) {
        const activityDate = new Date(date);
        activityDate.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );

        const activity = this.generateRandomActivity(
          asociacionId,
          activityDate,
          socioNames,
          comercioNames,
          beneficioTitles
        );

        if (activity) {
          activities.push(activity);
        }
      }
    }

    // Ordenar por fecha (más recientes primero)
    activities.sort((a, b) => {
      const dateA = (a as CreateActivityRequest & { customTimestamp: Date }).customTimestamp || now;
      const dateB = (b as CreateActivityRequest & { customTimestamp: Date }).customTimestamp || now;
      return dateB.getTime() - dateA.getTime();
    });

    return activities;
  }

  /**
   * Generar una actividad aleatoria
   */
  private static generateRandomActivity(
    asociacionId: string,
    date: Date,
    socioNames: string[],
    comercioNames: string[],
    beneficioTitles: string[]
  ): CreateActivityRequest & { customTimestamp: Date } {
    const activityTypes: { type: ActivityType; weight: number }[] = [
      { type: 'validation_completed', weight: 40 },
      { type: 'member_added', weight: 15 },
      { type: 'member_updated', weight: 10 },
      { type: 'commerce_linked', weight: 8 },
      { type: 'benefit_created', weight: 7 },
      { type: 'qr_generated', weight: 5 },
      { type: 'payment_received', weight: 5 },
      { type: 'backup_completed', weight: 3 },
      { type: 'export_completed', weight: 3 },
      { type: 'system_alert', weight: 2 },
      { type: 'notification_sent', weight: 2 }
    ];

    // Seleccionar tipo de actividad basado en pesos
    const totalWeight = activityTypes.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType: ActivityType = 'system_alert';

    for (const item of activityTypes) {
      random -= item.weight;
      if (random <= 0) {
        selectedType = item.type;
        break;
      }
    }

    return this.createActivityByType(
      selectedType,
      asociacionId,
      date,
      socioNames,
      comercioNames,
      beneficioTitles
    );
  }

  /**
   * Crear actividad específica por tipo
   */
  private static createActivityByType(
    type: ActivityType,
    asociacionId: string,
    date: Date,
    socioNames: string[],
    comercioNames: string[],
    beneficioTitles: string[]
  ): CreateActivityRequest & { customTimestamp: Date } {
    const randomSocio = socioNames[Math.floor(Math.random() * socioNames.length)];
    const randomComercio = comercioNames[Math.floor(Math.random() * comercioNames.length)];
    const randomBeneficio = beneficioTitles[Math.floor(Math.random() * beneficioTitles.length)];

    const baseActivity = {
      asociacionId,
      customTimestamp: date,
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      userName: 'Sistema Automático'
    };

    switch (type) {
      case 'validation_completed':
        const descuento = Math.floor(Math.random() * 500) + 100;
        return {
          ...baseActivity,
          type,
          title: 'Validación exitosa',
          description: `${randomSocio} utilizó "${randomBeneficio}" en ${randomComercio}`,
          category: 'validation',
          severity: 'success',
          metadata: {
            socioNombre: randomSocio,
            comercioNombre: randomComercio,
            beneficioTitulo: randomBeneficio,
            montoDescuento: descuento,
            codigoValidacion: `VAL-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          }
        };

      case 'member_added':
        return {
          ...baseActivity,
          type,
          title: 'Nuevo socio registrado',
          description: `Se registró el socio ${randomSocio}`,
          category: 'member',
          severity: 'success',
          metadata: {
            socioNombre: randomSocio,
            socioEmail: `${randomSocio.toLowerCase().replace(' ', '.')}@email.com`,
            numeroSocio: `SOC-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
          }
        };

      case 'member_updated':
        return {
          ...baseActivity,
          type,
          title: 'Socio actualizado',
          description: `Se actualizó la información de ${randomSocio}`,
          category: 'member',
          severity: 'info',
          metadata: {
            socioNombre: randomSocio,
            changes: {
              telefono: { from: '123456789', to: '987654321' }
            }
          }
        };

      case 'commerce_linked':
        return {
          ...baseActivity,
          type,
          title: 'Comercio vinculado',
          description: `Se vinculó el comercio ${randomComercio}`,
          category: 'commerce',
          severity: 'success',
          metadata: {
            comercioNombre: randomComercio,
            comercioCategoria: ['Restaurante', 'Farmacia', 'Retail', 'Servicios'][Math.floor(Math.random() * 4)]
          }
        };

      case 'benefit_created':
        return {
          ...baseActivity,
          type,
          title: 'Nuevo beneficio creado',
          description: `Se creó el beneficio "${randomBeneficio}" para ${randomComercio}`,
          category: 'benefit',
          severity: 'success',
          metadata: {
            beneficioTitulo: randomBeneficio,
            comercioNombre: randomComercio,
            beneficioDescuento: Math.floor(Math.random() * 30) + 5
          }
        };

      case 'qr_generated':
        return {
          ...baseActivity,
          type,
          title: 'Código QR generado',
          description: `Se generó código QR para ${randomComercio}`,
          category: 'system',
          severity: 'info',
          metadata: {
            comercioNombre: randomComercio,
            operationType: 'qr_generation'
          }
        };

      case 'payment_received':
        const monto = Math.floor(Math.random() * 5000) + 1000;
        return {
          ...baseActivity,
          type,
          title: 'Pago recibido',
          description: `Pago de cuota mensual de ${randomSocio} - $${monto}`,
          category: 'system',
          severity: 'success',
          metadata: {
            socioNombre: randomSocio,
            montoDescuento: monto
          }
        };

      case 'backup_completed':
        return {
          ...baseActivity,
          type,
          title: 'Respaldo completado',
          description: 'Respaldo automático de datos completado exitosamente',
          category: 'system',
          severity: 'success',
          metadata: {
            operationType: 'backup',
            recordsAffected: Math.floor(Math.random() * 1000) + 100,
            duration: Math.floor(Math.random() * 300) + 30
          }
        };

      case 'export_completed':
        return {
          ...baseActivity,
          type,
          title: 'Exportación completada',
          description: 'Exportación de datos de socios completada',
          category: 'system',
          severity: 'info',
          metadata: {
            operationType: 'export',
            recordsAffected: Math.floor(Math.random() * 500) + 50,
            fileSize: Math.floor(Math.random() * 1024) + 100
          }
        };

      case 'notification_sent':
        return {
          ...baseActivity,
          type,
          title: 'Notificación enviada',
          description: 'Notificación masiva enviada a todos los socios',
          category: 'notification',
          severity: 'info',
          metadata: {
            notificationType: 'email',
            recipients: Math.floor(Math.random() * 100) + 20
          }
        };

      default:
        return {
          ...baseActivity,
          type: 'system_alert',
          title: 'Alerta del sistema',
          description: 'Actividad del sistema registrada',
          category: 'system',
          severity: 'info',
          metadata: {}
        };
    }
  }

  /**
   * Limpiar todas las actividades de una asociación (para testing)
   */
  static async clearActivitiesForAsociacion(asociacionId: string): Promise<void> {
    try {
      console.log('🧹 Clearing activities for asociacion:', asociacionId);
      
      // Esta función sería útil para testing, pero requiere permisos especiales
      // Por ahora, solo registramos el intento
      console.log('⚠️ Clear function not implemented for production safety');
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
      throw error;
    }
  }
}

export const activitySeederService = ActivitySeederService;
export default ActivitySeederService;
