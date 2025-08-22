import { z } from 'zod';
import { VALIDATION_RULES, USER_ROLES } from '../constants';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email es requerido')
  .email('Email inválido')
  .max(254, 'Email muy largo');

export const passwordSchema = z
  .string()
  .min(VALIDATION_RULES.password.minLength, `Contraseña debe tener al menos ${VALIDATION_RULES.password.minLength} caracteres`)
  .max(VALIDATION_RULES.password.maxLength, `Contraseña muy larga (máximo ${VALIDATION_RULES.password.maxLength} caracteres)`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Contraseña debe contener al menos una mayúscula, una minúscula y un número');

export const nameSchema = z
  .string()
  .min(VALIDATION_RULES.name.minLength, `Nombre debe tener al menos ${VALIDATION_RULES.name.minLength} caracteres`)
  .max(VALIDATION_RULES.name.maxLength, `Nombre muy largo (máximo ${VALIDATION_RULES.name.maxLength} caracteres)`)
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo puede contener letras y espacios');

export const phoneSchema = z
  .string()
  .optional()
  .refine((val) => !val || VALIDATION_RULES.phone.test(val), 'Teléfono inválido');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Base register schema
const baseRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  nombre: nameSchema,
  telefono: phoneSchema,
  role: z.enum([USER_ROLES.ASOCIACION, USER_ROLES.COMERCIO, USER_ROLES.SOCIO]),
  acceptTerms: z.boolean(),
});

export const asociacionRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(USER_ROLES.ASOCIACION),
  nombreAsociacion: z.string().min(2, 'Nombre de asociación es requerido'),
  descripcion: z.string().max(VALIDATION_RULES.description.maxLength).optional(),
  direccion: z.string().optional(),
  sitioWeb: z.string().url('URL inválida').optional().or(z.literal('')),
  tipoAsociacion: z.enum(['sindical', 'profesional', 'deportiva', 'cultural', 'otra']),
}).superRefine((data, ctx) => {
  if (data.acceptTerms !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes aceptar los términos y condiciones',
      path: ['acceptTerms'],
    });
  }
});
export const comercioRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(USER_ROLES.COMERCIO),
  nombreComercio: z.string().min(2, 'Nombre del comercio es requerido'),
  categoria: z.enum([
    'restaurante', 'retail', 'servicios', 'salud', 'educacion', 
    'entretenimiento', 'tecnologia', 'automotriz', 'hogar', 'otro'
  ]),
  descripcion: z.string().max(VALIDATION_RULES.description.maxLength).optional(),
  direccion: z.string().optional(),
  horario: z.string().optional(),
  sitioWeb: z.string().url('URL inválida').optional().or(z.literal('')),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'CUIT inválido (formato: XX-XXXXXXXX-X)').optional(),
}).superRefine((data, ctx) => {
  if (data.acceptTerms !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes aceptar los términos y condiciones',
      path: ['acceptTerms'],
    });
  }
});

export const socioRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(USER_ROLES.SOCIO),
  dni: z.string().regex(/^\d{7,8}$/, 'DNI inválido'),
  fechaNacimiento: z.date().refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18 && age <= 100;
    },
    'Debes ser mayor de 18 años'
  ),
  direccion: z.string().optional(),
  asociacionId: z.string().min(1, 'Debes seleccionar una asociación'),
  numeroSocio: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.acceptTerms !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes aceptar los términos y condiciones',
      path: ['acceptTerms'],
    });
  }
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNewPassword'],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  nombre: nameSchema,
  telefono: phoneSchema,
  avatar: z.string().url().optional(),
  configuracion: z.object({
    notificaciones: z.boolean(),
    tema: z.enum(['light', 'dark', 'auto']),
    idioma: z.string(),
  }).optional(),
});

// Export types
export type AsociacionRegisterData = z.infer<typeof asociacionRegisterSchema>;
export type ComercioRegisterData = z.infer<typeof comercioRegisterSchema>;
export type SocioRegisterData = z.infer<typeof socioRegisterSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Usa al menos 8 caracteres');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Incluye letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Incluye letras mayúsculas');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Incluye números');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Incluye símbolos especiales');

  return { score, feedback };
};