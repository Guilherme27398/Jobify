import { useEffect, useState } from 'react';

/** Devolve `value` só depois de ficar `delay` ms sem mudar (evita um pedido por cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
