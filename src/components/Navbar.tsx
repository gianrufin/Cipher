import React from 'react';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Users, BarChart3, Compass } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenRules: () => void;
  onOpenOnboarding?: () => void;
  onOpenStats?: () => void;
  onResetGame: () => void;
  gameActive: boolean;
  playerCount: number;
  hasSessionStats?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRules,
  onOpenOnboarding,
  onOpenStats,
  onResetGame,
  gameActive,
  playerCount,
  hasSessionStats
}) => {
  const [sound, setSound] = React.useState(isSoundEnabled());

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0b0b09]/88 backdrop-blur-xl px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {/* Brand Mark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6846] border border-[#ff896f] shadow-lg shadow-black/30">
            <div className="relative flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border border-stone-950/70 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-stone-950" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display font-black text-base tracking-wider text-slate-100 uppercase">
                CIPHER<span className="text-[#ff6846]">.</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-[9px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
                Field game
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {gameActive && (
            <div className="mr-0.5 flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-xs text-slate-300">
              <Users className="h-3 w-3 text-slate-400" />
              <span className="font-mono font-semibold text-[11px]">{playerCount}</span>
            </div>
          )}

          {/* In-App PWA Install Action */}
          <PWAInstallButton variant="nav" />

          {hasSessionStats && onOpenStats && (
            <button
              id="nav-stats-btn"
              type="button"
              onClick={onOpenStats}
              aria-label="View Session Stats"
              title="View Session Statistics"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-amber-400/90 transition-colors hover:bg-white/[0.08] hover:text-amber-300 active:scale-95"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          )}

          {onOpenOnboarding && (
            <button
              id="nav-onboarding-btn"
              type="button"
              onClick={onOpenOnboarding}
              aria-label="Interactive Game Tutorial"
              title="Interactive Game Tutorial"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            id="nav-sound-toggle-btn"
            type="button"
            onClick={toggleSound}
            aria-label={sound ? 'Mute audio' : 'Unmute audio'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-95"
          >
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
          </button>

          <button
            id="nav-rules-btn"
            type="button"
            onClick={onOpenRules}
            aria-label="How to play"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-95"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>

          {gameActive && (
            <button
              id="nav-reset-game-btn"
              type="button"
              onClick={onResetGame}
              aria-label="New game / Reset"
              title="End round and return to setup"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-200 active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
