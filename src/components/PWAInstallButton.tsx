import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running in standalone mode, do not show
  if (isInstalled) {
    return null;
  }

  // Only render if installable (Chromium/Android) or on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'nav' ? (
        <button
          id="pwa-nav-install-btn"
          type="button"
          onClick={handleInstallClick}
          aria-label="Install App"
          title="Install Cipher as a standalone app"
          className="flex h-9 items-center gap-1.5 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-white/[0.06] transition-all active:scale-[0.97]"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Download className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">Play Offline & Fullscreen</p>
              <p className="text-[11px] text-slate-400 truncate">Install Cipher directly to your home screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all active:scale-[0.97] shadow-sm"
          >
            Install
          </button>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Download className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">Install Cipher on iOS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.06]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-sky-400">
                  <Share2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-200">Step 1:</span> Tap the <strong className="text-white">Share</strong> button in the Safari bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.06]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-emerald-400">
                  <PlusSquare className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-200">Step 2:</span> Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </div>
              </div>

              <p className="text-[11px] text-slate-400 px-1">
                You can now play fullscreen with no browser bars and full offline support.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-white/[0.04] hover:bg-white/[0.08] py-2.5 text-xs font-semibold text-slate-200 border border-white/[0.08] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
