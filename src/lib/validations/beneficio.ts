import { BeneficioFormData } from '@/types/beneficio';

/**
 * Validaciones para la creación y actualización de beneficios
 * Asegura que los beneficios cumplan con las reglas de negocio
 */

export interface BeneficioValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida los datos de un beneficio antes de crearlo
 */
export function validateBeneficioCreate(
  data: BeneficioFormData,
  userRole: 'comercio' | 'asociacion'
): BeneficioValidationResult {
  const errors: string[] = [];

  // Validaciones básicas
  if (!data.titulo || data.titulo.trim().length === 0) {
    errors.push('El título es obligatorio');
  }

  if (!data.descripcion || data.descripcion.trim().length === 0) {
    errors.push('La descripción es obligatoria');
  }

  if (!data.tipo) {
    errors.push('El tipo de beneficio es obligatorio');
  }

  if (data.descuento === undefined || data.descuento === null) {
    errors.push('El descuento es obligatorio');
  }

  // Validar descuento según tipo
  if (data.descuento !== undefined && data.descuento !== null) {
    if (data.tipo === 'porcentaje') {
      if (data.descuento <= 0 || data.descuento > 100) {
        errors.push('El descuento porcentual debe estar entre 1 y 100');
      }
    } else if (data.tipo === 'monto_fijo') {
      if (data.descuento <= 0) {
        errors.push('El monto fijo debe ser mayor a 0');
      }
    }
  }

  // Validar fechas
  if (!data.fechaInicio) {
    errors.push('La fecha de inicio es obligatoria');
  }

  if (!data.fechaFin) {
    errors.push('La fecha de fin es obligatoria');
  }

  if (data.fechaInicio && data.fechaFin) {
    const inicio = data.fechaInicio instanceof Date ? data.fechaInicio : new Date(data.fechaInicio);
    const fin = data.fechaFin instanceof Date ? data.fechaFin : new Date(data.fechaFin);

    if (fin <= inicio) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar que la fecha de inicio no sea muy antigua
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    
    if (inicio < haceUnMes) {
      errors.push('La fecha de inicio no puede ser anterior a un mes atrás');
    }
  }

  // Validar categoría
  if (!data.categoria || data.categoria.trim().length === 0) {
    errors.push('La categoría es obligatoria');
  }

  // Validar límites
  if (data.limitePorSocio !== undefined && data.limitePorSocio !== null && data.limitePorSocio < 0) {
    errors.push('El límite por socio no puede ser negativo');
  }

  if (data.limiteTotal !== undefined && data.limiteTotal !== null && data.limiteTotal < 0) {
    errors.push('El límite total no puede ser negativo');
  }

  if (
    data.limitePorSocio !== undefined && 
    data.limiteTotal !== undefined && 
    data.limitePorSocio > 0 && 
    data.limiteTotal > 0 &&
    data.limitePorSocio > data.limiteTotal
  ) {
    errors.push('El límite por socio no puede ser mayor al límite total');
  }

  // VALIDACIÓN CRÍTICA: Asociaciones para beneficios de tipo 'asociacion'
  const tipoAcceso = data.tipoAcceso || 'asociacion'; // Por defecto es 'asociacion'
  
  if (tipoAcceso === 'asociacion') {
    // Si el beneficio es de tipo asociación, DEBE tener al menos una asociación vinculada
    if (!data.asociacionesDisponibles || data.asociacionesDisponibles.length === 0) {
      errors.push('Los beneficios de tipo "asociación" deben estar vinculados a al menos una asociación');
    }
  }

  // Validar comercioId para asociaciones
  if (userRole === 'asociacion' && !data.comercioId) {
    errors.push('Las asociaciones deben especificar el comercio al crear un beneficio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida los datos de un beneficio antes de actualizarlo
 */
export function validateBeneficioUpdate(
  data: Partial<BeneficioFormData>
): BeneficioValidationResult {
  const errors: string[] = [];

  // Validaciones opcionales (solo si se proporcionan)
  if (data.titulo !== undefined && data.titulo.trim().length === 0) {
    errors.push('El título no puede estar vacío');
  }

  if (data.descripcion !== undefined && data.descripcion.trim().length === 0) {
    errors.push('La descripción no puede estar vacía');
  }

  if (data.descuento !== undefined && data.descuento !== null) {
    if (data.tipo === 'porcentaje') {
      if (data.descuento <= 0 || data.descuento > 100) {
        errors.push('El descuento porcentual debe estar entre 1 y 100');
      }
    } else if (data.tipo === 'monto_fijo') {
      if (data.descuento <= 0) {
        errors.push('El monto fijo debe ser mayor a 0');
      }
    }
  }

  // Validar fechas si ambas están presentes
  if (data.fechaInicio && data.fechaFin) {
    const inicio = data.fechaInicio instanceof Date ? data.fechaInicio : new Date(data.fechaInicio);
    const fin = data.fechaFin instanceof Date ? data.fechaFin : new Date(data.fechaFin);

    if (fin <= inicio) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  if (data.categoria !== undefined && data.categoria.trim().length === 0) {
    errors.push('La categoría no puede estar vacía');
  }

  if (data.limitePorSocio !== undefined && data.limitePorSocio !== null && data.limitePorSocio < 0) {
    errors.push('El límite por socio no puede ser negativo');
  }

  if (data.limiteTotal !== undefined && data.limiteTotal !== null && data.limiteTotal < 0) {
    errors.push('El límite total no puede ser negativo');
  }

  // Validar asociaciones si se actualiza tipoAcceso
  if (data.tipoAcceso === 'asociacion') {
    if (data.asociacionesDisponibles !== undefined && data.asociacionesDisponibles.length === 0) {
      errors.push('Los beneficios de tipo "asociación" deben estar vinculados a al menos una asociación');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida que un socio tenga acceso a un beneficio específico
 */
export function validateSocioAccessToBeneficio(
  beneficioAsociaciones: string[],
  socioAsociacionesActivas: string[],
  beneficioTipoAcceso?: 'asociacion' | 'publico' | 'directo'
): boolean {
  // Si el beneficio es público, todos tienen acceso
  if (beneficioTipoAcceso === 'publico') {
    return true;
  }

  // Si el beneficio es de acceso directo, todos tienen acceso
  if (beneficioTipoAcceso === 'directo') {
    return true;
  }

  // Si el beneficio es de tipo asociación, verificar que el socio pertenezca a alguna de las asociaciones
  if (beneficioTipoAcceso === 'asociacion' || !beneficioTipoAcceso) {
    // Verificar si hay intersección entre las asociaciones del beneficio y las del socio
    return beneficioAsociaciones.some(asocId => socioAsociacionesActivas.includes(asocId));
  }

  return false;
}

/**
 * Valida las fechas de vigencia de un beneficio
 */
export function validateBeneficioVigencia(
  fechaInicio: Date,
  fechaFin: Date
): BeneficioValidationResult {
  const errors: string[] = [];
  const now = new Date();

  if (fechaFin <= fechaInicio) {
    errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
  }

  if (fechaFin <= now) {
    errors.push('El beneficio ya ha expirado');
  }

  if (fechaInicio > now) {
    // Advertencia, no error
    console.warn('El beneficio aún no está disponible');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
