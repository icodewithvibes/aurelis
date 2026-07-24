/**
 * Tiny async-load hook with a manual refresh signal. Local reads are
 * fast; this keeps screen code simple without a data-fetching library.
 */
import { useCallback, useEffect, useState } from "react";

export function useAsync<T>(loader: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loader()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, error, reload };
}
