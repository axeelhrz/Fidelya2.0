import { z } from 'zod';
import { validateAndFormatPhone } from '@/utils/phone-validator';

export const socioFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  telefono: z
    .string()
    .optional()
    .transform((val) => {
      // If empty or undefined, return as-is
      if (!val || val.trim() === '') return val;
      
      // Validate and format for Argentina
      const result = validateAndFormatPhone(val);
      return result.isValid ? result.formatted : val;
    })
    .refine((val) => {
      // If empty, it's valid (optional field)
      if (!val || val.trim() === '') return true;
      
      // Validate the formatted phone
      const result = validateAndFormatPhone(val);
      return result.isValid;
    }, 'Número de teléfono inválido. Debe ser un número argentino válido para WhatsApp (+549...)'),
  dni: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  numeroSocio: z.string().optional(),
  fechaVencimiento: z.date().optional(),
});

export const socioUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']).optional(),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  telefono: z
    .string()
    .optional()
    .transform((val) => {
      // If empty or undefined, return as-is
      if (!val || val.trim() === '') return val;
      
      // Validate and format for Argentina
      const result = validateAndFormatPhone(val);
      return result.isValid ? result.formatted : val;
    })
    .refine((val) => {
      // If empty, it's valid (optional field)
      if (!val || val.trim() === '') return true;
      
      // Validate the formatted phone
      const result = validateAndFormatPhone(val);
      return result.isValid;
    }, 'Número de teléfono inválido. Debe ser un número argentino válido para WhatsApp (+549...)'),
  dni: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  numeroSocio: z.string().optional(),
  fechaVencimiento: z.date().optional(),
});

export const socioFilterSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']).optional(),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  search: z.string().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
});

export type SocioFormData = z.infer<typeof socioFormSchema>;
export type SocioUpdateData = z.infer<typeof socioUpdateSchema>;
export type SocioFilterData = z.infer<typeof socioFilterSchema>;