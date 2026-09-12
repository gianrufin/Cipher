import React, { useEffect } from 'react';
import { RefreshCw, Settings2, TriangleAlert, X } from 'lucide-react';

interface RestartMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onEditSetup: () => void;
}

export const RestartMatchModal: React.FC<RestartMatchModalProps> = ({
  isOpen, onClose, onRestart, onEditSetup
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-match-title"
        className="cipher-panel w-full max-w-sm overflow-hidden p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="cipher-kicker">Current match</p>
              <h2 id="restart-match-title" className="mt-1 font-display text-xl font-black text-stone-50">Restart this match?</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cipher-nav-button flex h-8 w-8 items-center justify-center rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-stone-400">
          Current match progress will be lost. Your players, game settings, and all completed-game statistics will stay.
        </p>

        <div className="mt-5 space-y-2">
          <button type="button" onClick={onRestart} className="cipher-button-primary w-full">
            <RefreshCw className="h-4 w-4" /> Restart with new words
          </button>
          <button type="button" onClick={onEditSetup} className="cipher-button-secondary w-full">
            <Settings2 className="h-4 w-4" /> Edit game setup
          </button>
          <button type="button" onClick={onClose} className="cipher-button-ghost w-full">Cancel</button>
        </div>
      </section>
    </div>
  );
};
