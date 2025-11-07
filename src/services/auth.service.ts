import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  User,
  UserCredential,
  reload,
  ActionCodeSettings,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  FieldValue,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserData } from '@/types/auth';
import { COLLECTIONS, USER_STATES, DASHBOARD_ROUTES } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { configService } from '@/lib/config';
import { membershipSyncService } from './membership-sync.service';
import { getEmailVerificationSettings, getPasswordResetSettings } from '@/lib/firebase-auth-config';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  role: 'comercio' | 'socio' | 'asociacion';
  telefono?: string;
  additionalData?: Record<string, unknown>;
}

export interface AuthResponse {
  success: boolean;
  user?: UserData;
  error?: string;
  requiresEmailVerification?: boolean;
}

class AuthService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  /**
   * Remove undefined values from an object
   */
  private removeUndefinedValues(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Get email verification action code settings
   */
  private getEmailActionCodeSettings(): ActionCodeSettings {
    return getEmailVerificationSettings();
  }

  /**
   * Get password reset action code settings
   */
  private getPasswordResetActionCodeSettings(): ActionCodeSettings {
    return getPasswordResetSettings();
  }

  /**
   * Sign in user with email and password with membership status validation
   * CORREGIDO: Envía automáticamente email de verificación si es necesario
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;
      
      // Check rate limiting
      if (this.isRateLimited(email)) {
        throw new Error('Demasiados intentos de inicio de sesión. Intenta más tarde.');
      }

      // Validate inputs
      this.validateLoginInputs(email, password);

      console.log('🔐 Starting sign in process for:', email);
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth, 
        email.trim().toLowerCase(), 
        password
      );

      // Check email verification
      if (!userCredential.user.emailVerified) {
        console.warn('🔐 Email not verified for user:', email);
        
        // CRÍTICO: Enviar automáticamente email de verificación ANTES de retornar
        console.log('📧 Enviando automáticamente email de verificación...');
        let emailSentSuccessfully = false;
        
        try {
          await this.sendEmailVerificationWithRetry(userCredential.user);
          console.log('✅ Email de verificación enviado automáticamente');
          emailSentSuccessfully = true;
        } catch (verificationError) {
          console.error('❌ Error enviando email de verificación automático:', verificationError);
          // Intentar una última vez con configuración más simple
          try {
            console.log('🔄 Reintentando con configuración simple...');
            await sendEmailVerification(userCredential.user);
            console.log('✅ Email de verificación enviado en reintento simple');
            emailSentSuccessfully = true;
          } catch (finalError) {
            console.error('❌ Fallo final al enviar email de verificación:', finalError);
            // No fallar el login, pero registrar que no se envió
          }
        }
        
        await this.signOut();
        
        // Retornar mensaje apropiado basado en si se envió el email
        const errorMessage = emailSentSuccessfully 
          ? 'Hemos enviado un enlace de verificación a tu correo electrónico. Revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.'
          : 'Tu email no está verificado. Hemos intentado enviar un enlace de verificación pero hubo un problema. Por favor, intenta reenviar el enlace desde la pantalla de verificación.';
        
        return {
          success: false,
          requiresEmailVerification: true,
          error: errorMessage
        };
      }

      const userData = await this.getUserData(userCredential.user.uid);
      
      if (!userData) {
        console.error('🔐 User data not found in Firestore');
        await this.signOut();
        throw new Error('Datos de usuario no encontrados. Contacta al administrador.');
      }

      // Check user status
      if (userData.estado !== USER_STATES.ACTIVO) {
        console.warn('🔐 User account is not active:', userData.estado);
        await this.signOut();
        throw new Error(this.getInactiveAccountMessage(userData.estado));
      }

      // For socios, validate and sync membership status
      if (userData.role === 'socio') {
        console.log('🔍 Validating membership status for socio...');
        try {
          await membershipSyncService.validateAssociationMembership(userCredential.user.uid);
          
          // Get updated user data after potential sync
          const updatedUserData = await this.getUserData(userCredential.user.uid);
          if (updatedUserData) {
            userData.estadoMembresia = updatedUserData.estadoMembresia;
            userData.asociacionId = updatedUserData.asociacionId;
          }
        } catch (syncError) {
          console.warn('⚠️ Error validating membership status:', syncError);
          // Don't fail login for sync errors, just log them
        }
      }

      // Clear login attempts on successful login
      this.clearLoginAttempts(email);

      // Update last login
      await this.updateLastLogin(userCredential.user.uid);

      // Set remember me persistence
      if (credentials.rememberMe) {
        // Firebase handles persistence automatically
        console.log('🔐 Remember me enabled');
      }

      console.log('🔐 Sign in process completed successfully');

      return {
        success: true,
        user: userData
      };
    } catch (error) {
      this.recordFailedLogin(credentials.email);
      return {
        success: false,
        error: handleError(error, 'Sign In', false).message
      };
    }
  }

  /**
   * Register new user with email verification and welcome email - Enhanced with better error handling
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const batch = writeBatch(db);
    let userCredential: UserCredential | null = null;

    try {
      console.log('🔐 Starting registration process for:', data.email);
      
      const { email, password, nombre, role, telefono, additionalData } = data;

      // Validate inputs
      this.validateRegisterInputs(data);

      // Check if email already exists
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new Error('Este email ya está registrado');
      }

      console.log('🔐 Creating Firebase Auth user...');

      // Create Firebase Auth user
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      console.log('🔐 Firebase Auth user created successfully');

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: nombre
      });

      console.log('🔐 Profile updated, preparing Firestore documents...');

      // Prepare user document data
      const userData: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        nombre,
        role,
        estado: USER_STATES.PENDIENTE, // Pending until email verification
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        configuracion: {
          notificaciones: true,
          tema: 'light',
          idioma: 'es',
        },
      };

      // Only add telefono if it has a value
      if (telefono && telefono.trim() !== '') {
        userData.telefono = telefono.trim();
      }

      // Add additional data if provided
      if (additionalData) {
        Object.assign(userData, this.removeUndefinedValues(additionalData));
      }

      // Add user document to batch
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
      batch.set(userDocRef, userData);

      // Prepare role-specific document data
      const roleDocumentData: Record<string, unknown> = {
        nombre,
        email: email.trim().toLowerCase(),
        estado: USER_STATES.PENDIENTE,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      };

      // Only add telefono if it has a value
      if (telefono && telefono.trim() !== '') {
        roleDocumentData.telefono = telefono.trim();
      }

      // Add additional data if provided
      if (additionalData) {
        Object.assign(roleDocumentData, this.removeUndefinedValues(additionalData));
      }

      // Add role-specific defaults and document to batch
      const collection = this.getRoleCollection(role);
      if (collection) {
        this.addRoleSpecificData(roleDocumentData, role);
        const roleDocRef = doc(db, collection, userCredential.user.uid);
        batch.set(roleDocRef, roleDocumentData);
      }

      console.log('🔐 Committing batch write to Firestore...');

      // Commit the batch write
      await batch.commit();

      console.log('🔐 Firestore documents created successfully');

      // Send email verification with retry logic
      console.log('📧 Sending email verification to new user...');
      try {
        await this.sendEmailVerificationWithRetry(userCredential.user);
        console.log('✅ Email verification sent successfully to new user');
      } catch (verificationError) {
        console.error('❌ Error sending email verification to new user:', verificationError);
        // Try one more time with simple method
        try {
          console.log('🔄 Attempting simple email verification send...');
          await sendEmailVerification(userCredential.user);
          console.log('✅ Simple email verification sent successfully');
        } catch (finalError) {
          console.error('❌ Final attempt to send email verification failed:', finalError);
          // Don't fail registration, but log the error
        }
      }

      // Send welcome email for comercios and asociaciones
      if (role === 'comercio' || role === 'asociacion') {
        console.log(`📧 Sending welcome email for ${role}...`);
        try {
          const { welcomeEmailService } = await import('./welcome-email.service');
          
          // CORREGIDO: Usar el userId y un fallback name apropiado
          let fallbackBusinessName: string;
          if (role === 'asociacion') {
            fallbackBusinessName = (additionalData?.nombreAsociacion as string) || nombre;
          } else {
            fallbackBusinessName = (additionalData?.nombreComercio as string) || 
                                 (additionalData?.nombre as string) || 
                                 nombre;
          }
          
          // NUEVO: Pasar el userId para que el servicio pueda leer desde Firebase
          await welcomeEmailService.sendWelcomeEmailWithRetry(
            nombre,
            email.trim().toLowerCase(),
            role,
            userCredential.user.uid, // Pasar el userId
            fallbackBusinessName
          );
          console.log(`✅ Welcome email sent successfully for ${role}`);
        } catch (emailError) {
          console.warn(`⚠️ Failed to send welcome email for ${role}:`, emailError);
          // Don't fail registration if welcome email fails
        }
      }

      // Sign out user until email verification
      await this.signOut();

      console.log('🔐 Registration completed successfully');

      return {
        success: true,
        requiresEmailVerification: true,
      };
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);

      // If user was created but Firestore failed, clean up
      if (userCredential?.user) {
        try {
          console.log('🔐 Cleaning up Firebase Auth user due to error...');
          await userCredential.user.delete();
        } catch (cleanupError) {
          console.error('🔐 Failed to cleanup Firebase Auth user:', cleanupError);
        }
      }

      return {
        success: false,
        error: handleError(error, 'Registration', false).message
      };
    }
  }

  /**
   * Send email verification with retry logic
   * MEJORADO: Reintentos más agresivos y mejor manejo de errores
   */
  private async sendEmailVerificationWithRetry(user: User, maxRetries = 5): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Sending email verification (attempt ${attempt}/${maxRetries})...`);
        console.log(`   User: ${user.email}`);
        console.log(`   Email verified status: ${user.emailVerified}`);
        
        // Recargar usuario para obtener el estado más reciente
        if (attempt > 1) {
          console.log(`   Reloading user before attempt ${attempt}...`);
          await reload(user);
        }
        
        await sendEmailVerification(user, this.getEmailActionCodeSettings());
        
        console.log(`✅ Email verification sent successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Email verification attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff, pero más corto)
          const delay = Math.pow(1.5, attempt) * 500; // 750ms, 1125ms, 1687ms, etc.
          console.log(`   Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, throw the last error
    const errorMessage = `Failed to send email verification after ${maxRetries} attempts: ${lastError?.message}`;
    console.error(`💥 ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Get role collection name
   */
  private getRoleCollection(role: string): string | null {
    switch (role) {
      case 'comercio':
        return COLLECTIONS.COMERCIOS;
      case 'socio':
        return COLLECTIONS.SOCIOS;
      case 'asociacion':
        return COLLECTIONS.ASOCIACIONES;
      default:
        return null;
    }
  }

  /**
   * Add role-specific data with proper membership status for socios
   */
  private addRoleSpecificData(data: Record<string, unknown>, role: string): void {
    if (role === 'comercio') {
      data.asociacionesVinculadas = [];
      data.visible = true;
      data.configuracion = {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false
      };
    } else if (role === 'socio') {
      data.asociacionesVinculadas = [];
      data.estadoMembresia = 'pendiente'; // Start as pending until association link
    } else if (role === 'asociacion') {
      data.configuracion = {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoAprobacionSocios: false,
        requiereAprobacionComercios: true
      };
    }
  }

  /**
   * Resend email verification with enhanced error handling and temporary authentication
   * ACTUALIZADO para manejar usuarios creados desde asociación y mejorar debugging
   */
  async resendEmailVerification(email: string, password?: string): Promise<AuthResponse> {
    let tempUserCredential: UserCredential | null = null;
    
    try {
      console.log('🔐 Attempting to resend email verification for:', email);

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();
      console.log('🔐 Normalized email:', normalizedEmail);

      // Check if user exists in our database with better error handling
      const userQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', normalizedEmail)
      );
      
      console.log('🔐 Searching for user in database...');
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        console.warn('🔐 No user found with email:', normalizedEmail);
        
        // Try to search in role-specific collections as fallback
        const collections = [COLLECTIONS.SOCIOS, COLLECTIONS.COMERCIOS, COLLECTIONS.ASOCIACIONES];
        let foundInRoleCollection = false;
        
        for (const collectionName of collections) {
          try {
            const roleQuery = query(
              collection(db, collectionName),
              where('email', '==', normalizedEmail)
            );
            const roleSnapshot = await getDocs(roleQuery);
            
            if (!roleSnapshot.empty) {
              console.log(`🔐 Found user in ${collectionName} collection`);
              foundInRoleCollection = true;
              break;
            }
          } catch (roleError) {
            console.warn(`🔐 Error searching in ${collectionName}:`, roleError);
          }
        }
        
        if (!foundInRoleCollection) {
          return {
            success: false,
            error: 'No se encontró una cuenta registrada con este email. Verifica que el email sea correcto o regístrate primero.'
          };
        } else {
          return {
            success: false,
            error: 'Se encontró el usuario pero hay un problema con la sincronización de datos. Contacta al soporte.'
          };
        }
      }

      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;
      
      console.log('🔐 User found:', { 
        email: userData.email, 
        role: userData.role, 
        estado: userData.estado 
      });
      
      // NUEVO: Verificar si el usuario ya está activo (para usuarios creados desde asociación)
      if (userData.estado === USER_STATES.ACTIVO) {
        console.log('🔐 User is already active, checking email verification status...');
        
        // Para usuarios activos, verificar si realmente necesitan verificación de email
        try {
          // Intentar autenticar temporalmente para verificar el estado del email
          if (!password) {
            return {
              success: false,
              error: 'Para reenviar la verificación, necesitas proporcionar tu contraseña'
            };
          }

          console.log('🔐 Attempting temporary authentication...');
          tempUserCredential = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );

          const targetUser = tempUserCredential.user;
          console.log('🔐 Temporary auth successful, email verified:', targetUser.emailVerified);

          if (targetUser.emailVerified) {
            // Si ya está verificado, actualizar el estado en Firestore si es necesario
            const userDocRef = doc(db, COLLECTIONS.USERS, userId);
            await updateDoc(userDocRef, {
              estado: USER_STATES.ACTIVO,
              actualizadoEn: serverTimestamp(),
            });

            // También actualizar en la colección de socios si es necesario
            if (userData.role === 'socio') {
              const socioDocRef = doc(db, COLLECTIONS.SOCIOS, userId);
              try {
                await updateDoc(socioDocRef, {
                  requiresEmailVerification: false,
                  actualizadoEn: serverTimestamp(),
                });
              } catch (socioUpdateError) {
                console.warn('⚠️ Error actualizando documento de socio:', socioUpdateError);
              }
            }

            await this.signOut();
            return {
              success: false,
              error: 'El email ya está verificado. Puedes iniciar sesión normalmente.'
            };
          }

          // Si no está verificado, enviar el email de verificación
          console.log('🔐 Email not verified, sending verification email...');
          await this.sendEmailVerificationWithRetry(targetUser);
          await this.signOut();

          return {
            success: true,
          };

        } catch (authError) {
          console.error('🔐 Authentication error:', authError);
          if (tempUserCredential) {
            try {
              await this.signOut();
            } catch (signOutError) {
              console.error('Error signing out after auth error:', signOutError);
            }
          }
          return {
            success: false,
            error: 'Credenciales incorrectas. Verifica tu email y contraseña.'
          };
        }
      }

      // NUEVO: También verificar usuarios con estado PENDIENTE pero que podrían tener requiresEmailVerification
      if (userData.estado === USER_STATES.PENDIENTE) {
        console.log('🔐 User is pending, checking for special cases...');
        
        // Verificar si es un socio que requiere verificación de email
        if (userData.role === 'socio') {
          try {
            const socioDoc = await getDoc(doc(db, COLLECTIONS.SOCIOS, userId));
            if (socioDoc.exists()) {
              const socioData = socioDoc.data();
              console.log('🔐 Socio data:', { 
                requiresEmailVerification: socioData.requiresEmailVerification,
                estado: socioData.estado 
              });
              
              if (socioData.requiresEmailVerification) {
                // Este es un socio creado desde asociación que necesita verificación
                if (!password) {
                  return {
                    success: false,
                    error: 'Para reenviar la verificación, necesitas proporcionar tu contraseña'
                  };
                }

                try {
                  console.log('🔐 Attempting auth for socio with email verification requirement...');
                  tempUserCredential = await signInWithEmailAndPassword(
                    auth,
                    normalizedEmail,
                    password
                  );

                  const targetUser = tempUserCredential.user;

                  if (targetUser.emailVerified) {
                    console.log('🔐 Email already verified, updating states...');
                    // Actualizar estados
                    const batch = writeBatch(db);
                    
                    batch.update(doc(db, COLLECTIONS.USERS, userId), {
                      estado: USER_STATES.ACTIVO,
                      actualizadoEn: serverTimestamp(),
                    });

                    batch.update(doc(db, COLLECTIONS.SOCIOS, userId), {
                      requiresEmailVerification: false,
                      actualizadoEn: serverTimestamp(),
                    });

                    await batch.commit();
                    await this.signOut();

                    return {
                      success: false,
                      error: 'El email ya está verificado. Puedes iniciar sesión normalmente.'
                    };
                  }

                  // Enviar verificación
                  console.log('🔐 Sending verification email for socio...');
                  await this.sendEmailVerificationWithRetry(targetUser);
                  await this.signOut();

                  return {
                    success: true,
                  };

                } catch (socioAuthError) {
                  console.error('🔐 Socio auth error:', socioAuthError);
                  if (tempUserCredential) {
                    try {
                      await this.signOut();
                    } catch (signOutError) {
                      console.error('Error signing out after auth error:', signOutError);
                    }
                  }
                  return {
                    success: false,
                    error: 'Credenciales incorrectas. Verifica tu email y contraseña.'
                  };
                }
              }
            }
          } catch (socioError) {
            console.warn('Error verificando documento de socio:', socioError);
          }
        }
      }

      // Flujo original para usuarios pendientes normales
      if (userData.estado !== USER_STATES.PENDIENTE) {
        return {
          success: false,
          error: 'Tu cuenta no requiere verificación de email'
        };
      }

      console.log('🔐 Processing normal pending user...');

      // Try to get the current user first
      let targetUser: User | null = auth.currentUser;

      // If no current user or different email, try to authenticate temporarily
      if (!targetUser || targetUser.email !== normalizedEmail) {
        if (!password) {
          return {
            success: false,
            error: 'Para reenviar la verificación, necesitas proporcionar tu contraseña'
          };
        }

        try {
          console.log('🔐 Temporarily signing in user to send verification...');
          // Temporarily sign in the user to send verification
          tempUserCredential = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );
          targetUser = tempUserCredential.user;
        } catch (tempAuthError) {
          console.error('🔐 Temporary auth failed:', tempAuthError);
          return {
            success: false,
            error: 'Credenciales incorrectas. Verifica tu email y contraseña.'
          };
        }
      }

      // Check if email is already verified
      if (targetUser.emailVerified) {
        console.log('🔐 Email already verified');
        // If we signed in temporarily, sign out
        if (tempUserCredential) {
          await this.signOut();
        }
        return {
          success: false,
          error: 'El email ya está verificado'
        };
      }

      // Send verification email
      console.log('🔐 Sending verification email...');
      await this.sendEmailVerificationWithRetry(targetUser);

      // If we signed in temporarily, sign out
      if (tempUserCredential) {
        await this.signOut();
      }

      console.log('🔐 Verification email sent successfully');
      return {
        success: true,
      };
    } catch (error) {
      console.error('🔐 Resend email verification error:', error);
      
      // If we signed in temporarily, make sure to sign out
      if (tempUserCredential) {
        try {
          await this.signOut();
        } catch (signOutError) {
          console.error('🔐 Error signing out after failed verification resend:', signOutError);
        }
      }
      
      return {
        success: false,
        error: handleError(error, 'Resend Email Verification', false).message
      };
    }
  }

  /**
   * Complete email verification process with membership status sync
   */
  async completeEmailVerification(user: User): Promise<AuthResponse> {
    try {
      // Reload user to get updated emailVerified status
      await reload(user);

      if (!user.emailVerified) {
        return {
          success: false,
          error: 'Email aún no verificado'
        };
      }

      // Update user status to active using batch write
      const batch = writeBatch(db);
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      
      batch.update(userDocRef, {
        estado: USER_STATES.ACTIVO,
        actualizadoEn: serverTimestamp(),
      });

      // Also update role-specific document if it exists
      const userData = await this.getUserData(user.uid);
      if (userData?.role) {
        const roleCollection = this.getRoleCollection(userData.role);
        if (roleCollection) {
          const roleDocRef = doc(db, roleCollection, user.uid);
          const updateData: { [key: string]: FieldValue | string } = {
            estado: USER_STATES.ACTIVO,
            actualizadoEn: serverTimestamp(),
          };

          // For socios, check if they should have active membership
          if (userData.role === 'socio') {
            // Check if socio has an association
            const socioDoc = await getDoc(roleDocRef);
            if (socioDoc.exists()) {
              const socioData = socioDoc.data();
              if (socioData.asociacionId) {
                updateData.estadoMembresia = 'al_dia';
                console.log('🔧 Setting socio membership to al_dia due to association link');
              }
            }
          }

          batch.update(roleDocRef, updateData);
        }
      }

      await batch.commit();

      // For socios, sync membership status after activation
      if (userData?.role === 'socio') {
        console.log('🔄 Syncing membership status after email verification...');
        try {
          await membershipSyncService.syncMembershipStatus(user.uid);
        } catch (syncError) {
          console.warn('⚠️ Error syncing membership status after verification:', syncError);
        }
      }

      const updatedUserData = await this.getUserData(user.uid);

      return {
        success: true,
        user: updatedUserData || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: handleError(error, 'Email Verification', false).message
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('🔐 Signing out user...');
      await signOut(auth);
      console.log('🔐 Sign out successful');
    } catch (error) {
      handleError(error, 'Sign Out');
      throw error;
    }
  }

  /**
   * Send password reset email with enhanced settings
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Sending password reset email to:', email);
      
      if (!email || !email.includes('@')) {
        throw new Error('Email válido es requerido');
      }

      const actionCodeSettings: ActionCodeSettings = {
        url: `${configService.getAuthUrl()}/auth/login?reset=true`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
      
      console.log('🔐 Password reset email sent successfully');
      
      return {
        success: true
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleError(error, 'Password Reset', false).message
      };
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Updating user password...');
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      await updatePassword(user, newPassword);
      
      console.log('🔐 Password updated successfully');
      
      return {
        success: true
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleError(error, 'Password Update', false).message
      };
    }
  }

  /**
   * Get user data from Firestore with membership status validation
   */
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      console.log('🔐 Fetching user data for UID:', uid);
      
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      
      if (!userDoc.exists()) {
        console.warn('🔐 User document does not exist in Firestore');
        return null;
      }

      const data = userDoc.data();
      
      // For socios, get additional membership information
      let estadoMembresia: UserData['estadoMembresia'];
      let asociacionNombre: string | undefined;
      
      if (data.role === 'socio') {
        try {
          const socioDoc = await getDoc(doc(db, COLLECTIONS.SOCIOS, uid));
          if (socioDoc.exists()) {
            const socioData = socioDoc.data();
            estadoMembresia = socioData.estadoMembresia;
            asociacionNombre = socioData.asociacion;
            
            // Sync association ID if different
            if (socioData.asociacionId && socioData.asociacionId !== data.asociacionId) {
              console.log('🔄 Syncing association ID from socio to user document');
              await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
                asociacionId: socioData.asociacionId,
                actualizadoEn: serverTimestamp(),
              });
              data.asociacionId = socioData.asociacionId;
            }
          }
        } catch (socioError) {
          console.warn('⚠️ Error fetching socio data:', socioError);
        }
      }

      // For asociaciones, get the nombreAsociacion from the asociaciones collection
      let nombreAsociacion: string | undefined;
      
      if (data.role === 'asociacion') {
        try {
          const asociacionDoc = await getDoc(doc(db, COLLECTIONS.ASOCIACIONES, uid));
          if (asociacionDoc.exists()) {
            const asociacionData = asociacionDoc.data();
            nombreAsociacion = asociacionData.nombreAsociacion || asociacionData.nombre;
            
            console.log('🔐 Asociación data retrieved:', { nombreAsociacion });
            
            // Sync nombreAsociacion to user document if different
            if (nombreAsociacion && nombreAsociacion !== data.nombreAsociacion) {
              console.log('🔄 Syncing nombreAsociacion from asociacion to user document');
              await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
                nombreAsociacion: nombreAsociacion,
                actualizadoEn: serverTimestamp(),
              });
            }
          }
        } catch (asociacionError) {
          console.warn('⚠️ Error fetching asociacion data:', asociacionError);
        }
      }

      const userData: UserData = {
        uid: userDoc.id,
        email: data.email,
        nombre: data.nombre,
        role: data.role,
        estado: data.estado,
        creadoEn: data.creadoEn?.toDate() || new Date(),
        actualizadoEn: data.actualizadoEn?.toDate() || new Date(),
        ultimoAcceso: data.ultimoAcceso?.toDate() || new Date(),
        telefono: data.telefono,
        avatar: data.avatar,
        configuracion: data.configuracion || {
          notificaciones: true,
          tema: 'light',
          idioma: 'es',
        },
        metadata: data.metadata,
        asociacionId: data.asociacionId,
        estadoMembresia: estadoMembresia,
        asociacionNombre: asociacionNombre,
        nombreAsociacion: nombreAsociacion || data.nombreAsociacion,
      };

      console.log('🔐 User data retrieved successfully');
      return userData;
    } catch (error) {
      handleError(error, 'Get User Data');
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserData>): Promise<AuthResponse> {
    try {
      console.log('🔐 Updating user profile for UID:', uid);
      
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      // Remove undefined values from updates
      const cleanUpdates = this.removeUndefinedValues(updates as Record<string, unknown>);
      
      await updateDoc(userRef, {
        ...cleanUpdates,
        actualizadoEn: serverTimestamp()
      });

      // Update Firebase Auth profile if name changed
      if (updates.nombre && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.nombre
        });
      }

      console.log('🔐 User profile updated successfully');

      return {
        success: true
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleError(error, 'Update Profile', false).message
      };
    }
  }

  /**
   * Check if email already exists
   */
  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.warn('Error checking email existence:', error);
      return false;
    }
  }

  /**
   * Rate limiting for login attempts
   */
  private isRateLimited(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    const now = Date.now();
    if (now - attempts.lastAttempt > this.lockoutDuration) {
      this.loginAttempts.delete(email);
      return false;
    }

    return attempts.count >= this.maxLoginAttempts;
  }

  private recordFailedLogin(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  private clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Input validation
   */
  private validateLoginInputs(email: string, password: string): void {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (!email.includes('@')) {
      throw new Error('Formato de email inválido');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }

  private validateRegisterInputs(data: RegisterData): void {
    const { email, password, nombre, role } = data;

    if (!email || !password || !nombre || !role) {
      throw new Error('Todos los campos son requeridos');
    }

    if (!email.includes('@')) {
      throw new Error('Formato de email inválido');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    if (nombre.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
  }

  /**
   * Get inactive account message
   */
  private getInactiveAccountMessage(estado: string): string {
    switch (estado) {
      case USER_STATES.INACTIVO:
        return 'Tu cuenta está desactivada. Contacta al administrador.';
      case USER_STATES.PENDIENTE:
        return 'Tu cuenta está pendiente de verificación. Revisa tu email.';
      case USER_STATES.SUSPENDIDO:
        return 'Tu cuenta ha sido suspendida. Contacta al administrador.';
      default:
        return 'Tu cuenta no está activa. Contacta al administrador.';
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        ultimoAcceso: serverTimestamp()
      });
    } catch (error) {
      console.warn('🔐 Failed to update last login:', error);
    }
  }

  /**
   * Get dashboard route for user role
   */
  getDashboardRoute(role: string): string {
    return DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/dashboard';
  }

  /**
   * Check if user has specific role
   */
  async hasRole(uid: string, role: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role === role;
    } catch (error) {
      handleError(error, 'Check Role');
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Validate Firebase configuration
   */
  validateFirebaseConfig(): boolean {
    try {
      const config = configService.getFirebaseConfig();
      
      const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const missingKeys = requiredKeys.filter(key => !config[key as keyof typeof config]);

      if (missingKeys.length > 0) {
        console.error('🔐 Missing Firebase configuration keys:', missingKeys);
        return false;
      }

      console.log('🔐 Firebase configuration is valid');
      return true;
    } catch (error) {
      console.error('🔐 Error validating Firebase configuration:', error);
      return false;
    }
  }

  /**
   * Check email verification status with temporary authentication
   * This method temporarily authenticates the user to check their email verification status
   */
  async checkEmailVerificationWithAuth(email: string, password: string): Promise<{ isVerified: boolean; error?: string }> {
    let tempUserCredential: UserCredential | null = null;
    
    try {
      console.log('🔐 Checking email verification with temporary auth for:', email);

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Temporarily sign in the user to check verification status
      tempUserCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      const targetUser = tempUserCredential.user;
      console.log('🔐 Temporary auth successful, checking verification status...');

      // Reload user to get the latest verification status
      await reload(targetUser);
      const isVerified = targetUser.emailVerified;

      console.log('🔐 Email verification status:', isVerified);

      // If verified, complete the verification process
      if (isVerified) {
        console.log('🔐 Email is verified, completing verification process...');
        const verificationResult = await this.completeEmailVerification(targetUser);
        
        if (verificationResult.success) {
          console.log('🔐 Email verification process completed successfully');
        }
      }

      // Always sign out after checking
      await this.signOut();

      return {
        isVerified
      };

    } catch (error) {
      console.error('🔐 Error in checkEmailVerificationWithAuth:', error);
      
      // Make sure to sign out if we signed in temporarily
      if (tempUserCredential) {
        try {
          await this.signOut();
        } catch (signOutError) {
          console.error('🔐 Error signing out after verification check:', signOutError);
        }
      }

      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        
        switch (firebaseError.code) {
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            return {
              isVerified: false,
              error: 'Credenciales incorrectas. Verifica tu email y contraseña.'
            };
          case 'auth/user-not-found':
            return {
              isVerified: false,
              error: 'No se encontró una cuenta con este email.'
            };
          case 'auth/too-many-requests':
            return {
              isVerified: false,
              error: 'Demasiados intentos. Intenta más tarde.'
            };
          default:
            return {
              isVerified: false,
              error: 'Error al verificar el estado del email.'
            };
        }
      }

      return {
        isVerified: false,
        error: 'Error al verificar el estado del email.'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;