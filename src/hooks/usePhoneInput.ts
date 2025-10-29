import { useState, useCallback, useEffect } from 'react';
import { 
  validateAndFormatPhone, 
  formatPhoneForDisplay,
  PhoneValidationResult 
} from '@/utils/phone-validator';

export interface UsePhoneInputOptions {
  initialValue?: string;
  required?: boolean;
  autoFormat?: boolean;
  onChange?: (value: string, isValid: boolean) => void;
  onValidationChange?: (result: PhoneValidationResult) => void;
}

export interface UsePhoneInputReturn {
  value: string;
  displayValue: string;
  formattedValue: string;
  isValid: boolean;
  error: string | null;
  touched: boolean;
  validationResult: PhoneValidationResult | null;
  handleChange: (value: string) => void;
  handleBlur: () => void;
  handleFocus: () => void;
  reset: () => void;
  setValue: (value: string) => void;
  validate: () => boolean;
}

/**
 * Custom hook for phone input with automatic Argentina formatting
 * Adds +549 prefix automatically and validates for WhatsApp
 */
export function usePhoneInput(options: UsePhoneInputOptions = {}): UsePhoneInputReturn {
  const {
    initialValue = '',
    required = false,
    autoFormat = true,
    onChange,
    onValidationChange
  } = options;

  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);

  // Validate and format the phone number
  const validatePhone = useCallback((phoneValue: string): PhoneValidationResult => {
    // If empty and not required, it's valid
    if (!phoneValue || phoneValue.trim() === '') {
      if (!required) {
        return {
          isValid: true,
          formatted: '',
          original: phoneValue,
        };
      }
      return {
        isValid: false,
        formatted: '',
        original: phoneValue,
        error: 'El número de teléfono es requerido'
      };
    }

    return validateAndFormatPhone(phoneValue);
  }, [required]);

  // Update validation when value changes
  useEffect(() => {
    const result = validatePhone(value);
    setValidationResult(result);
    
    if (onValidationChange) {
      onValidationChange(result);
    }
  }, [value, validatePhone, onValidationChange]);

  // Handle input change
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    
    if (onChange) {
      const result = validatePhone(newValue);
      onChange(result.formatted, result.isValid);
    }
  }, [onChange, validatePhone]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    setTouched(true);
    
    // Auto-format on blur if enabled
    if (autoFormat && value) {
      const result = validatePhone(value);
      if (result.isValid && result.formatted !== value) {
        setValue(result.formatted);
        if (onChange) {
          onChange(result.formatted, true);
        }
      }
    }
  }, [autoFormat, value, validatePhone, onChange]);

  // Handle focus event
  const handleFocus = useCallback(() => {
    // Optional: could add focus-specific logic here
  }, []);

  // Reset the input
  const reset = useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setValidationResult(null);
  }, [initialValue]);

  // Manually set value (useful for form resets or external updates)
  const setValueManually = useCallback((newValue: string) => {
    setValue(newValue);
    setTouched(false);
  }, []);

  // Manually trigger validation
  const validate = useCallback((): boolean => {
    setTouched(true);
    const result = validatePhone(value);
    setValidationResult(result);
    return result.isValid;
  }, [value, validatePhone]);

  // Compute display value (formatted for human reading)
  const displayValue = validationResult?.isValid && validationResult.formatted
    ? formatPhoneForDisplay(validationResult.formatted)
    : value;

  // Compute formatted value (for storage/API)
  const formattedValue = validationResult?.formatted || value;

  // Compute error message
  const error = touched && validationResult && !validationResult.isValid
    ? validationResult.error || 'Número de teléfono inválido'
    : null;

  // Compute validity
  const isValid = validationResult?.isValid || false;

  return {
    value,
    displayValue,
    formattedValue,
    isValid,
    error,
    touched,
    validationResult,
    handleChange,
    handleBlur,
    handleFocus,
    reset,
    setValue: setValueManually,
    validate,
  };
}

/**
 * Hook for handling phone input in forms with react-hook-form integration
 */
export function usePhoneInputWithForm(
  fieldValue: string,
  onChange: (value: string) => void,
  options: Omit<UsePhoneInputOptions, 'initialValue' | 'onChange'> = {}
) {
  const phoneInput = usePhoneInput({
    ...options,
    initialValue: fieldValue,
    onChange: (formatted, isValid) => {
      if (isValid || !options.required) {
        onChange(formatted);
      }
    }
  });

  // Sync with external field value changes
  useEffect(() => {
    if (fieldValue !== phoneInput.value) {
      phoneInput.setValue(fieldValue);
    }
  }, [fieldValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return phoneInput;
}
