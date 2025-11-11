import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  SimpleNotification, 
  SimpleNotificationFormData, 
  SimpleNotificationResult,
  RecipientInfo,
  SimpleNotificationSettings
} from '@/types/simple-notification';
import emailjs from '@emailjs/browser';
import { validateAndFormatPhone, formatPhoneForDisplay } from '@/utils/phone-validator';

// Servicio de Email con EmailJS - CONFIGURADO
class SimpleEmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor() {
    this.serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
    this.templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
    this.publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
    
    // Inicializar EmailJS
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  async sendEmail(to: string, subject: string, message: string, asociacionName?: string): Promise<boolean> {
    if (!this.serviceId || !this.templateId || !this.publicKey) {
      console.warn('📧 EmailJS credentials not configured');
      console.warn('Missing:', {
        serviceId: !this.serviceId,
        templateId: !this.templateId,
        publicKey: !this.publicKey
      });
      return false;
    }

    try {
      console.log(`📧 Cliente: Enviando email a: ${to}`);
      console.log(`📧 Cliente: Subject: ${subject}`);
      console.log(`📧 Cliente: Asociación: ${asociacionName || 'No especificada'}`);
      console.log(`📧 Cliente: Message preview: ${message.substring(0, 150)}...`);
      
      // Parámetros para el template de EmailJS
      const templateParams = {
        to_email: to,
        title: subject,
        message: message,
        from_name: asociacionName || 'Fidelya', // USAR NOMBRE DE ASOCIACIÓN COMO REMITENTE
        reply_to: 'noreply@fidelya.com.ar',
        asociacion_name: asociacionName || 'Tu Asociación' // PARÁMETRO ADICIONAL PARA EL TEMPLATE
      };

      console.log(`📧 Cliente: Template params enviados a EmailJS:`, {
        to_email: templateParams.to_email,
        title: templateParams.title,
        from_name: templateParams.from_name,
        asociacion_name: templateParams.asociacion_name,
        reply_to: templateParams.reply_to,
        messageLength: templateParams.message.length
      });

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      if (response.status === 200) {
        console.log(`✅ Cliente: Email enviado exitosamente via EmailJS`);
        console.log(`📊 Cliente: Response:`, response.text);
        return true;
      } else {
        console.error('❌ Cliente: Error enviando email:', response);
        return false;
      }
    } catch (error) {
      console.error('💥 Cliente: Error crítico enviando email:', error);
      return false;
    }
  }

  // Método para verificar la configuración
  isConfigured(): boolean {
    return !!(this.serviceId && this.templateId && this.publicKey);
  }

  // Método para obtener información de configuración
  getConfigInfo() {
    return {
      configured: this.isConfigured(),
      service: 'EmailJS',
      serviceId: this.serviceId ? this.serviceId.substring(0, 8) + '...' : 'No configurado',
      templateId: this.templateId ? this.templateId.substring(0, 8) + '...' : 'No configurado'
    };
  }
}

// Servicio de WhatsApp usando API Route - CON BRANDING FIDELYA
class SimpleWhatsAppService {
  constructor() {
    // No necesitamos credenciales aquí, se manejan en la API route
  }

  async sendWhatsApp(to: string, message: string, title?: string): Promise<boolean> {
    try {
      // Validate and format phone number before sending
      const phoneValidation = validateAndFormatPhone(to);
      
      if (!phoneValidation.isValid) {
        console.error(`❌ Cliente: Número de teléfono inválido: ${to}`);
        console.error(`❌ Cliente: Error: ${phoneValidation.error}`);
        return false;
      }

      const formattedPhone = phoneValidation.formatted;
      const displayPhone = formatPhoneForDisplay(formattedPhone);

      console.log(`📱 Cliente: Enviando WhatsApp a: ${displayPhone} (${formattedPhone})`);
      
      // Llamar a nuestra API route que maneja Twilio con branding
      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedPhone,
          message: message,
          title: title
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ Cliente: WhatsApp enviado exitosamente. SID: ${result.sid}`);
        console.log(`📊 Cliente: Estado: ${result.status}, Precio: ${result.price} ${result.priceUnit}`);
        return true;
      } else {
        console.error('❌ Cliente: Error enviando WhatsApp:', result.error);
        if (result.code) {
          console.error(`🔍 Cliente: Código de error Twilio: ${result.code}`);
        }
        return false;
      }
    } catch (error) {
      console.error('💥 Cliente: Error crítico enviando WhatsApp:', error);
      return false;
    }
  }

  // Método para verificar la configuración (ahora siempre retorna true ya que se verifica en la API)
  isConfigured(): boolean {
    return true; // La verificación real se hace en la API route
  }

  // Método para obtener información de configuración
  getConfigInfo() {
    return {
      configured: true,
      fromNumber: 'whatsapp:+14155238886',
      method: 'API Route (Server-side)',
      branding: 'Fidelya ✅'
    };
  }
}

// Servicio principal simplificado
export class SimpleNotificationService {
  private emailService: SimpleEmailService;
  private whatsappService: SimpleWhatsAppService;

  constructor() {
    this.emailService = new SimpleEmailService();
    this.whatsappService = new SimpleWhatsAppService();
    
    // Log de configuración al inicializar
    console.log('🔧 Configuración de servicios de notificación:');
    console.log('📧 Email (EmailJS):', this.emailService.getConfigInfo());
    console.log('📱 WhatsApp (Twilio via API):', this.whatsappService.getConfigInfo());
  }

  // Obtener información de destinatarios - BUSCA EN USERS Y SOCIOS
  async getRecipients(specificIds?: string[]): Promise<RecipientInfo[]> {
    try {
      const recipients: RecipientInfo[] = [];

      // Si se especifican IDs específicos, obtener esos usuarios/socios sin importar estado
      if (specificIds && specificIds.length > 0) {
        console.log(`🔍 Buscando ${specificIds.length} destinatarios específicos: ${specificIds.join(', ')}`);
        
        for (const userId of specificIds) {
          try {
            // Primero intentar en la colección 'users'
            const userDocRef = doc(db, 'users', userId);
            const userDocSnapshot = await getDoc(userDocRef);
            
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              console.log(`✅ Usuario encontrado en 'users': ${userData.nombre} (${userId})`);
              
              // Si es un socio, obtener también su teléfono de la colección 'socios'
              let phone = userData.telefono;
              if (userData.role === 'socio') {
                try {
                  const socioDocRef = doc(db, 'socios', userId);
                  const socioDocSnapshot = await getDoc(socioDocRef);
                  if (socioDocSnapshot.exists()) {
                    const socioData = socioDocSnapshot.data();
                    phone = socioData.telefono || phone;
                    console.log(`📱 Teléfono del socio: ${phone}`);
                  }
                } catch {
                  console.warn(`⚠️ No se encontró documento de socio para ${userId}`);
                }
              }
              
              recipients.push({
                id: userDocSnapshot.id,
                name: userData.nombre || 'Sin nombre',
                email: userData.email,
                phone: phone,
                type: userData.role || 'usuario'
              });
            } else {
              // Si no está en 'users', intentar en 'socios'
              const socioDocRef = doc(db, 'socios', userId);
              const socioDocSnapshot = await getDoc(socioDocRef);
              
              if (socioDocSnapshot.exists()) {
                const socioData = socioDocSnapshot.data();
                console.log(`✅ Socio encontrado en 'socios': ${socioData.nombre} (${userId})`);
                recipients.push({
                  id: socioDocSnapshot.id,
                  name: socioData.nombre || 'Sin nombre',
                  email: socioData.email,
                  phone: socioData.telefono,
                  type: 'socio'
                });
              } else {
                console.warn(`⚠️ No se encontró usuario/socio con ID: ${userId}`);
              }
            }
          } catch (error) {
            console.error(`❌ Error buscando usuario ${userId}:`, error);
          }
        }
        
        console.log(`✅ Se encontraron ${recipients.length} de ${specificIds.length} destinatarios solicitados`);
      } else {
        // Obtener SOLO socios activos si no se especifican IDs
        const sociosQuery = query(
          collection(db, 'socios'),
          where('estado', '==', 'activo')
        );
        const sociosSnapshot = await getDocs(sociosQuery);
        sociosSnapshot.forEach(doc => {
          const data = doc.data();
          const recipient: RecipientInfo = {
            id: doc.id,
            name: data.nombre || 'Sin nombre',
            email: data.email,
            phone: data.telefono || '',
            type: 'socio'
          };
          console.log(`📋 Socio cargado:`, { id: recipient.id, name: recipient.name, phone: recipient.phone });
          recipients.push(recipient);
        });

        console.log(`✅ Obtenidos ${recipients.length} socios activos para notificaciones`);
        console.log(`📋 Socios con teléfono:`, recipients.map(r => ({ name: r.name, phone: r.phone })));
      }

      return recipients;
    } catch (error) {
      console.error('Error getting recipients:', error);
      return [];
    }
  }

  // Obtener destinatarios por teléfono (fallback cuando no se encuentra por ID)
  async getRecipientsByPhone(phoneNumbers: string[]): Promise<RecipientInfo[]> {
    try {
      const recipients: RecipientInfo[] = [];
      
      console.log(`📱 Buscando destinatarios por teléfono: ${phoneNumbers.join(', ')}`);
      
      for (const phone of phoneNumbers) {
        try {
          // Si el valor parece ser un teléfono (contiene dígitos y +), buscar directamente
          if (phone.includes('+') || /\d{10,}/.test(phone)) {
            console.log(`🔍 Buscando por teléfono: ${phone}`);
            
            // Buscar en la colección 'socios' con el teléfono exacto
            const sociosQuery = query(
              collection(db, 'socios'),
              where('telefono', '==', phone)
            );
            const sociosSnapshot = await getDocs(sociosQuery);
            
            if (!sociosSnapshot.empty) {
              sociosSnapshot.forEach(doc => {
                const data = doc.data();
                recipients.push({
                  id: doc.id,
                  name: data.nombre || 'Sin nombre',
                  email: data.email,
                  phone: data.telefono,
                  type: 'socio'
                });
                console.log(`✅ Socio encontrado por teléfono: ${data.nombre} (${phone})`);
              });
            } else {
              // Si no encuentra con el formato exacto, intentar variaciones
              const normalizedPhone = phone.replace(/\D/g, '');
              console.log(`🔍 Intentando con teléfono normalizado: ${normalizedPhone}`);
              
              // Buscar todos los socios y filtrar por teléfono normalizado
              const allSociosQuery = query(collection(db, 'socios'));
              const allSociosSnapshot = await getDocs(allSociosQuery);
              
              allSociosSnapshot.forEach(doc => {
                const data = doc.data();
                const socioPhone = data.telefono?.replace(/\D/g, '') || '';
                if (socioPhone === normalizedPhone) {
                  recipients.push({
                    id: doc.id,
                    name: data.nombre || 'Sin nombre',
                    email: data.email,
                    phone: data.telefono,
                    type: 'socio'
                  });
                  console.log(`✅ Socio encontrado por teléfono normalizado: ${data.nombre} (${phone})`);
                }
              });
              
              if (recipients.length === 0) {
                console.warn(`⚠️ No se encontró socio con teléfono: ${phone}`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error buscando por teléfono ${phone}:`, error);
        }
      }
      
      console.log(`✅ Se encontraron ${recipients.length} destinatarios por teléfono`);
      return recipients;
    } catch (error) {
      console.error('Error getting recipients by phone:', error);
      return [];
    }
  }

  // Crear notificación
  async createNotification(
    data: SimpleNotificationFormData,
    createdBy: string
  ): Promise<string> {
    try {
      // Clean the data to remove undefined values and ensure all required fields exist
      const cleanData = {
        title: data.title || '',
        message: data.message || '',
        type: data.type || 'info',
        channels: data.channels || [],
        recipientIds: data.recipientIds || [],
        createdBy: createdBy || '',
        status: 'draft' as const,
        createdAt: serverTimestamp()
      };

      // Remove any undefined values (extra safety)
      const sanitizedData = Object.fromEntries(
        Object.entries(cleanData).filter(([value]) => value !== undefined)
      );

      console.log('📝 Creating notification with data:', sanitizedData);

      const docRef = await addDoc(collection(db, 'simpleNotifications'), sanitizedData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Enviar notificación
  async sendNotification(
    notificationId: string,
    data: SimpleNotificationFormData
  ): Promise<SimpleNotificationResult> {
    const result: SimpleNotificationResult = {
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      // Actualizar estado a "enviando"
      await updateDoc(doc(db, 'simpleNotifications', notificationId), {
        status: 'sending'
      });

      // Obtener información de destinatarios - pasar IDs específicos para buscar
      console.log(`🔍 Buscando ${data.recipientIds.length} destinatarios específicos`);
      let recipients: RecipientInfo[] = [];
      
      // Primero intentar obtener por ID
      const allRecipients = await this.getRecipients(data.recipientIds);
      recipients = allRecipients.filter(r => data.recipientIds.includes(r.id));
      
      // Si no se encontraron destinatarios, intentar buscar por teléfono
      if (recipients.length === 0 && data.recipientIds.length > 0) {
        console.log(`⚠️ No se encontraron destinatarios por ID, intentando buscar por teléfono...`);
        recipients = await this.getRecipientsByPhone(data.recipientIds);
      }

      console.log(`📤 Enviando notificación "${data.title}" a ${recipients.length} destinatarios`);
      console.log(`📋 Canales seleccionados: ${data.channels.join(', ')}`);
      console.log(`📋 IDs de destinatarios: ${data.recipientIds.join(', ')}`);
      console.log(`📋 Destinatarios encontrados: ${recipients.map(r => r.id).join(', ')}`);

      // Validate and format phone numbers for all recipients
      const recipientsWithValidatedPhones = recipients.map(recipient => {
        if (recipient.phone) {
          const phoneValidation = validateAndFormatPhone(recipient.phone);
          return {
            ...recipient,
            phone: phoneValidation.isValid ? phoneValidation.formatted : recipient.phone,
            phoneValid: phoneValidation.isValid,
            phoneError: phoneValidation.error
          };
        }
        return { ...recipient, phoneValid: false };
      });

      // Enviar por cada canal seleccionado
      for (const recipient of recipientsWithValidatedPhones) {
        console.log(`👤 Procesando destinatario: ${recipient.name} (${recipient.type})`);
        
        for (const channel of data.channels) {
          try {
            let sent = false;

            switch (channel) {
              case 'email':
                if (recipient.email) {
                  sent = await this.emailService.sendEmail(
                    recipient.email,
                    data.title,
                    data.message
                  );
                  if (sent) {
                    console.log(`✅ Email enviado a ${recipient.name} (${recipient.email})`);
                  } else {
                    console.log(`❌ Falló email a ${recipient.name} (${recipient.email})`);
                  }
                } else {
                  result.errors.push(`${recipient.name} no tiene email configurado`);
                  console.log(`⚠️ ${recipient.name} no tiene email`);
                }
                break;

              case 'whatsapp':
                if (recipient.phone && recipient.phoneValid) {
                  // Pasar el título para el branding personalizado
                  sent = await this.whatsappService.sendWhatsApp(
                    recipient.phone,
                    data.message,
                    data.title
                  );
                  if (sent) {
                    const displayPhone = formatPhoneForDisplay(recipient.phone);
                    console.log(`✅ WhatsApp enviado a ${recipient.name} (${displayPhone})`);
                  } else {
                    console.log(`❌ Falló WhatsApp a ${recipient.name} (${recipient.phone})`);
                  }
                } else if (recipient.phone && !recipient.phoneValid) {
                  result.errors.push(`${recipient.name} tiene un número de teléfono inválido: ${recipient.phoneError || 'formato incorrecto'}`);
                  console.log(`⚠️ ${recipient.name} tiene teléfono inválido: ${recipient.phoneError}`);
                  result.failedCount++;
                } else {
                  result.errors.push(`${recipient.name} no tiene teléfono configurado`);
                  console.log(`⚠️ ${recipient.name} no tiene teléfono`);
                  result.failedCount++;
                }
                break;

              case 'app':
                // Para notificaciones en la app, crear registro en Firestore
                await addDoc(collection(db, 'notifications'), {
                  title: data.title,
                  message: data.message,
                  type: data.type,
                  recipientId: recipient.id,
                  status: 'unread',
                  createdAt: serverTimestamp(),
                  read: false
                });
                sent = true;
                console.log(`✅ Notificación en app enviada a ${recipient.name}`);
                break;
            }

            if (sent) {
              result.sentCount++;
            } else {
              result.failedCount++;
              if (!result.errors.some(e => e.includes(recipient.name))) {
                result.errors.push(`Error enviando ${channel} a ${recipient.name}`);
              }
            }

            // Pequeña pausa entre envíos para evitar rate limits
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            result.failedCount++;
            result.errors.push(`Error enviando ${channel} a ${recipient.name}: ${error}`);
            console.error(`💥 Error crítico enviando ${channel} a ${recipient.name}:`, error);
          }
        }
      }

      // Actualizar estado final
      const finalStatus = result.failedCount === 0 ? 'sent' : 
                         result.sentCount === 0 ? 'failed' : 'sent';
      
      await updateDoc(doc(db, 'simpleNotifications', notificationId), {
        status: finalStatus
      });

      result.success = result.sentCount > 0;
      
      console.log(`📊 Resultado final: ${result.sentCount} enviadas, ${result.failedCount} fallidas`);
      if (result.errors.length > 0) {
        console.log(`🚨 Errores encontrados:`, result.errors);
      }

      return result;
    } catch (error) {
      console.error('💥 Error crítico enviando notificación:', error);
      
      // Actualizar estado a fallido
      await updateDoc(doc(db, 'simpleNotifications', notificationId), {
        status: 'failed'
      });

      result.errors.push(`Error general: ${error}`);
      return result;
    }
  }

  // Obtener historial de notificaciones
  async getNotifications(createdBy?: string): Promise<SimpleNotification[]> {
    try {
      let notificationsQuery = query(
        collection(db, 'simpleNotifications'),
        orderBy('createdAt', 'desc')
      );

      if (createdBy) {
        notificationsQuery = query(
          collection(db, 'simpleNotifications'),
          where('createdBy', '==', createdBy),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(notificationsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          channels: data.channels,
          recipientIds: data.recipientIds,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          status: data.status
        };
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Obtener configuración de usuario
  async getUserSettings(userId: string) {
    try {
      const settingsQuery = query(
        collection(db, 'simpleNotificationSettings'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          userId: data.userId,
          emailEnabled: data.emailEnabled ?? true,
          whatsappEnabled: data.whatsappEnabled ?? true,
          appEnabled: data.appEnabled ?? true,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }

      // Configuración por defecto
      return {
        userId,
        emailEnabled: true,
        whatsappEnabled: true,
        appEnabled: true,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Guardar configuración de usuario
  async saveUserSettings(settings: SimpleNotificationSettings) {
    try {
      const settingsQuery = query(
        collection(db, 'simpleNotificationSettings'),
        where('userId', '==', settings.userId)
      );
      
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        // Actualizar existente
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...settings,
          updatedAt: serverTimestamp()
        });
      } else {
        // Crear nuevo
        await addDoc(collection(db, 'simpleNotificationSettings'), {
          ...settings,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  // Método para verificar configuración de servicios
  getServicesStatus() {
    return {
      whatsapp: this.whatsappService.getConfigInfo(),
      email: this.emailService.getConfigInfo()
    };
  }
}

// Exportar instancia singleton
export const simpleNotificationService = new SimpleNotificationService();