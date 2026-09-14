import { useEffect } from 'react';

export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | undefined;
    let cancelled = false;

    const request = async () => {
      if (!active || document.hidden || !('wakeLock' in navigator)) return;
      try {
        const next = await (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Wake lock is optional and may be denied by the browser or battery saver.
      }
    };

    const onVisibility = () => { if (!document.hidden) void request(); };
    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (lock) void lock.release();
    };
  }, [active]);
};
