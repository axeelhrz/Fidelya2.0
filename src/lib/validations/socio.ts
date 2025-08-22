import { z } from 'zod';

const socioBaseSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma la contraseña'),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido'], {
    required_error: 'Estado es requerido',
  }),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  numeroSocio: z.string().optional(),
  fechaVencimiento: z.date().optional(),
});

export const socioSchema = socioBaseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const socioUpdateSchema = socioBaseSchema.partial().extend({
  id: z.string().min(1, 'ID es requerido'),
}).omit({ password: true, confirmPassword: true });

export const socioFilterSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']).optional(),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  search: z.string().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
});

export type SocioFormData = z.infer<typeof socioSchema>;
export type SocioUpdateData = z.infer<typeof socioUpdateSchema>;
export type SocioFilterData = z.infer<typeof socioFilterSchema>;