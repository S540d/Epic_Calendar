import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Like useState but syncs to AsyncStorage. Reads initial value from storage;
 * falls back to `defaultValue` if key is absent or parse fails.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw !== null) {
          setState(JSON.parse(raw) as T);
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [key, state]);

  return [state, setState];
}
