import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook optimizado para debounce que evita actualizaciones innecesarias
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  // Actualizar la referencia del callback sin causar re-renders
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Crear nuevo timeout
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          callbackRef.current(...args);
        }
      }, delay);
    }) as T,
    [delay]
  );

  return debouncedCallback;
}

/**
 * Hook para throttle (limitar frecuencia de ejecución)
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay && mountedRef.current) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );

  return throttledCallback;
}

/**
 * Hook combinado que permite tanto debounce como throttle
 */
export function useDebouncedThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  debounceDelay: number,
  throttleDelay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  const mountedRef = useRef(true);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const combinedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Si ha pasado suficiente tiempo desde la última llamada, ejecutar inmediatamente (throttle)
      if (now - lastCallRef.current >= throttleDelay && mountedRef.current) {
        lastCallRef.current = now;
        callbackRef.current(...args);
        return;
      }

      // Si no, usar debounce
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          lastCallRef.current = Date.now();
          callbackRef.current(...args);
        }
      }, debounceDelay);
    }) as T,
    [debounceDelay, throttleDelay]
  );

  return combinedCallback;
}