import { useEffect, useState } from 'react';
import { createOsRuntimeAdapter } from './createOsRuntimeAdapter';

export function useOsRuntime() {
  const [runtime, setRuntime] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [migration, setMigration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      try {
        const nextRuntime = createOsRuntimeAdapter();
        const result = await nextRuntime.initialize();
        if (!isActive) return;
        setRuntime(nextRuntime);
        setMigration(result?.migration || null);
        setIsReady(true);
      } catch (nextError) {
        if (!isActive) return;
        setError(nextError);
        setIsReady(true);
      }
    };

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    runtime,
    isReady,
    migration,
    error
  };
}
