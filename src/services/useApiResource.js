import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api';

const EMPTY = [];

export function useApiResource(path, key, fallback = EMPTY) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest(path);
      setData(response?.[key] || fallback);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [fallback, key, path]);

  useEffect(() => {
    let active = true;
    apiRequest(path)
      .then((response) => {
        if (!active) return;
        setData(response?.[key] || fallback);
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fallback, key, path]);
  return { data, setData, loading, error, refresh };
}
