import React from 'react';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Shield, Users, BarChart3, Compass } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-950/40">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-lg tracking-tight text-white">
                CIPHER
              </span>
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-rose-300 uppercase">
                Pass & Play
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Social Deduction for 1 Phone</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {gameActive && (
            <div className="mr-1 flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono font-medium">{playerCount}</span>
            </div>
          )}

          {hasSessionStats && onOpenStats && (
            <button
              id="nav-stats-btn"
              type="button"
              onClick={onOpenStats}
              aria-label="View Session Stats"
              title="View Session Statistics"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-amber-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          )}

          {onOpenOnboarding && (
            <button
              id="nav-onboarding-btn"
              type="button"
              onClick={onOpenOnboarding}
              aria-label="Interactive Game Tutorial"
              title="Interactive Game Tutorial"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-rose-400 transition-colors hover:bg-slate-800 hover:text-rose-300"
            >
              <Compass className="h-4 w-4" />
            </button>
          )}

          <button
            id="nav-sound-toggle-btn"
            type="button"
            onClick={toggleSound}
            aria-label={sound ? 'Mute audio' : 'Unmute audio'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          <button
            id="nav-rules-btn"
            type="button"
            onClick={onOpenRules}
            aria-label="How to play"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {gameActive && (
            <button
              id="nav-reset-game-btn"
              type="button"
              onClick={onResetGame}
              aria-label="New game / Reset"
              title="End round and return to setup"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-300 transition-colors hover:bg-rose-900/60 hover:text-rose-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
