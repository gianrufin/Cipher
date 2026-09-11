import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-[#0c101a] border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-slate-300 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
      <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode active — 100% playable without internet</span>
    </div>
  );
};
