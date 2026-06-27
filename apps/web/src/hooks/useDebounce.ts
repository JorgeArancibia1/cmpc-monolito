import { useEffect, useState } from 'react';

/** Devuelve el valor tras `delay` ms sin cambios (búsqueda en tiempo real sin saturar la API). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
