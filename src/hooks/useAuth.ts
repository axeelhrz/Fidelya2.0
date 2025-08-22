'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, reload } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { authService, AuthResponse } from '@/services/auth.service';
import { UserData } from '@/types/auth';
import { handleError } from '@/lib/error-handler';
import { toast } from 'react-hot-toast';

interface SignUpData {
  email: string;
  password: string;
  [key: string]: unknown; // Add other fields as needed
}

interface AuthContextType {
  user: UserData | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  signUp: (data: SignUpData & { nombre: string; role: string }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  resendEmailVerification: (email: string, password?: string) => Promise<AuthResponse>;
  updateProfile: (data: Partial<UserData>) => Promise<AuthResponse>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  isEmailVerified: boolean;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  // Function to check email verification status
  const checkEmailVerification = async (): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      // Reload the user to get the latest verification status
      await reload(firebaseUser);
      const verified = firebaseUser.emailVerified;
      setIsEmailVerified(verified);
      return verified;
    } catch (error) {
      console.error('🔐 Error checking email verification:', error);
      return false;
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        setFirebaseUser(firebaseUser);

        if (firebaseUser) {
          console.log('🔐 Firebase user detected:', firebaseUser.email);
          
          // Always reload user to get latest verification status
          await reload(firebaseUser);
          
          // Check email verification
          const emailVerified = firebaseUser.emailVerified;
          setIsEmailVerified(emailVerified);

          if (emailVerified) {
            // Get user data from Firestore
            const userData = await authService.getUserData(firebaseUser.uid);
            
            if (userData) {
              // Complete email verification if user was pending
              if (userData.estado === 'pendiente') {
                console.log('🔐 Completing email verification for user...');
                const verificationResult = await authService.completeEmailVerification(firebaseUser);
                if (verificationResult.success && verificationResult.user) {
                  setUser(verificationResult.user);
                  console.log('🔐 Email verification completed successfully');
                } else {
                  setUser(userData);
                }
              } else {
                setUser(userData);
              }
            } else {
              console.warn('🔐 User data not found in Firestore');
              setUser(null);
            }
          } else {
            console.log('🔐 Email not verified, user data not loaded');
            setUser(null);
          }
        } else {
          console.log('🔐 No Firebase user');
          setUser(null);
          setIsEmailVerified(false);
        }
      } catch (error) {
        console.error('🔐 Error in auth state change:', error);
        handleError(error, 'Auth State Change');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign in function with improved email verification handling
  const signIn = async (email: string, password: string, rememberMe = false): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Login attempt for:', email);

      const response = await authService.signIn({ email, password, rememberMe });
      
      if (!response.success) {
        if (response.requiresEmailVerification) {
          // Check if email was recently verified
          if (firebaseUser) {
            console.log('🔐 Checking if email was recently verified...');
            const isNowVerified = await checkEmailVerification();
            
            if (isNowVerified) {
              console.log('🔐 Email is now verified, retrying login...');
              // Retry login since email is now verified
              const retryResponse = await authService.signIn({ email, password, rememberMe });
              if (retryResponse.success) {
                return retryResponse;
              }
            }
          }
        }
        
        setError(response.error || 'Error al iniciar sesión');
        return response;
      }

      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'Sign In', false).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (data: SignUpData & { nombre: string; role: string }): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Ensure required fields are present
      const { email, password, nombre, role, ...rest } = data;
      const allowedRoles = ['comercio', 'socio', 'asociacion'] as const;
      if (!allowedRoles.includes(role as typeof allowedRoles[number])) {
        throw new Error('Rol inválido');
      }
      const registerData = { email, password, nombre, role: role as typeof allowedRoles[number], ...rest };

      const response = await authService.register(registerData);

      if (!response.success) {
        setError(response.error || 'Error al registrarse');
      } else if (response.requiresEmailVerification) {
        toast.success('¡Registro exitoso! Revisa tu email para verificar tu cuenta.');
      }

      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'Sign Up', false).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
      setIsEmailVerified(false);
      router.push('/auth/login');
    } catch (error) {
      handleError(error, 'Sign Out');
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await authService.resetPassword(email);
      
      if (!response.success) {
        setError(response.error || 'Error al enviar email de recuperación');
      }

      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'Reset Password', false).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Resend email verification with password support
  const resendEmailVerification = async (email: string, password?: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await authService.resendEmailVerification(email, password);
      
      if (!response.success) {
        setError(response.error || 'Error al reenviar email de verificación');
      } else {
        toast.success('Email de verificación reenviado');
      }

      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'Resend Email Verification', false).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<UserData>): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await authService.updateUserProfile(user.uid, data);
      
      if (response.success) {
        // Update local user state
        setUser(prev => prev ? { ...prev, ...data } : null);
        toast.success('Perfil actualizado exitosamente');
      } else {
        setError(response.error || 'Error al actualizar perfil');
      }

      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'Update Profile', false).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      if (firebaseUser && user) {
        // Reload Firebase user first
        await reload(firebaseUser);
        setIsEmailVerified(firebaseUser.emailVerified);
        
        // Then get updated user data
        const userData = await authService.getUserData(firebaseUser.uid);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      handleError(error, 'Refresh User');
    }
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendEmailVerification,
    updateProfile,
    clearError,
    refreshUser,
    isEmailVerified,
    checkEmailVerification,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo = '/auth/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

// Hook for role-based access
export function useRequireRole(allowedRoles: string[], redirectTo = '/') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.role))) {
      router.push(redirectTo);
    }
  }, [user, loading, allowedRoles, router, redirectTo]);

  return { user, loading, hasAccess: user && allowedRoles.includes(user.role) };
}

// Hook for email verification check with password support
export function useEmailVerification() {
  const { firebaseUser, isEmailVerified, resendEmailVerification, checkEmailVerification } = useAuth();
  
  return {
    isEmailVerified,
    email: firebaseUser?.email || '',
    checkVerification: checkEmailVerification,
    resendVerification: (password?: string) => {
      if (firebaseUser?.email) {
        return resendEmailVerification(firebaseUser.email, password);
      }
      return Promise.resolve({ success: false, error: 'No email found' });
    }
  };
}