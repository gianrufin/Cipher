import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Volume2, VolumeX, X, Hammer, Heart, Music,
  AlertOctagon, Eye, Trophy, Sparkles, Wind, Skull
} from 'lucide-react';
import {
  playBuzzer, playCountdown, playDrumroll, playElimination,
  playGavel, playHeartbeat, playImposterWin, playReveal,
  playSneak, playSoloHeist, playSuspenseSting, playVictory,
  playVote, playWhoosh, isSoundEnabled, setSoundEnabled, triggerHaptic
} from '../utils/soundEffects';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SoundEffectItem {
  id: string;
  name: string;
  category: 'drama' | 'tension' | 'game' | 'reveal';
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  borderTone: string;
  description: string;
  action: () => void;
}

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ isOpen, onClose }) => {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(isSoundEnabled());

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trigger = (id: string, soundFn: () => void) => {
    soundFn();
    setActiveSound(id);
    setTimeout(() => setActiveSound(prev => prev === id ? null : prev), 350);
  };

  const toggleSound = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    triggerHaptic(next ? 50 : [30, 30]);
  };

  const soundList: SoundEffectItem[] = [
    {
      id: 'gavel',
      name: 'Verdict Gavel',
      category: 'drama',
      icon: Hammer,
      tone: 'bg-amber-500/20 text-amber-300',
      borderTone: 'border-amber-500/40',
      description: 'Heavy judicial strike for ejections & locked votes',
      action: playGavel
    },
    {
      id: 'heartbeat',
      name: 'Heartbeat',
      category: 'tension',
      icon: Heart,
      tone: 'bg-rose-500/20 text-rose-300',
      borderTone: 'border-rose-500/40',
      description: 'Deep double-thump tension for countdowns & ties',
      action: playHeartbeat
    },
    {
      id: 'sting',
      name: 'Dramatic Sting',
      category: 'drama',
      icon: Music,
      tone: 'bg-violet-500/20 text-violet-300',
      borderTone: 'border-violet-500/40',
      description: 'Cinematic dissonant shocker for unexpected reveals',
      action: playSuspenseSting
    },
    {
      id: 'drumroll',
      name: 'Suspense Roll',
      category: 'tension',
      icon: Sparkles,
      tone: 'bg-sky-500/20 text-sky-300',
      borderTone: 'border-sky-500/40',
      description: 'Accelerating rhythmic roll before the truth drops',
      action: playDrumroll
    },
    {
      id: 'buzzer',
      name: 'Game Buzzer',
      category: 'game',
      icon: AlertOctagon,
      tone: 'bg-red-500/20 text-red-400',
      borderTone: 'border-red-500/40',
      description: 'Classic harsh buzz for wrong guesses or taboo slips',
      action: playBuzzer
    },
    {
      id: 'sneak',
      name: 'Imposter Sneak',
      category: 'drama',
      icon: Eye,
      tone: 'bg-stone-500/20 text-stone-300',
      borderTone: 'border-stone-500/40',
      description: 'Chromatic tip-toe steps for stealth moves',
      action: playSneak
    },
    {
      id: 'solo_heist',
      name: 'Solo Heist',
      category: 'game',
      icon: Sparkles,
      tone: 'bg-amber-400/25 text-amber-300',
      borderTone: 'border-amber-400/50',
      description: 'Chaotic triumph blast for Wild Card solo wins',
      action: playSoloHeist
    },
    {
      id: 'victory',
      name: 'Triumph Horns',
      category: 'game',
      icon: Trophy,
      tone: 'bg-emerald-500/20 text-emerald-300',
      borderTone: 'border-emerald-500/40',
      description: 'Bright victory fanfare for Citizen triumph',
      action: playVictory
    },
    {
      id: 'elimination',
      name: 'Evidence Filed',
      category: 'drama',
      icon: Skull,
      tone: 'bg-stone-800 text-stone-300',
      borderTone: 'border-white/20',
      description: 'Descending tone for an ejected player',
      action: playElimination
    },
    {
      id: 'whoosh',
      name: 'Whoosh',
      category: 'tension',
      icon: Wind,
      tone: 'bg-teal-500/20 text-teal-300',
      borderTone: 'border-teal-500/40',
      description: 'Rapid pass swipe sound for fast handoffs',
      action: playWhoosh
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-[28px] border-2 border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Party Soundboard"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-[var(--ink)] px-5 py-4 bg-[var(--canvas)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--coral)] text-white shadow-sm">
              <Hammer className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-black tracking-tight leading-none">Party Soundboard</h2>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
                Dramatic Stings & Reveals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center gap-1 rounded-full border border-[var(--ink)] px-2.5 py-1 text-[11px] font-bold transition-colors ${
                enabled ? 'bg-emerald-400/15 text-emerald-800' : 'bg-stone-300/60 text-stone-600 line-through'
              }`}
              title={enabled ? 'Mute sound' : 'Unmute sound'}
            >
              {enabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-700" /> : <VolumeX className="h-3.5 w-3.5 text-stone-500" />}
              <span>{enabled ? 'Sound on' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cipher-icon-button"
              aria-label="Close soundboard"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Subheader Instructions */}
        <div className="bg-amber-500/10 border-b border-[var(--ink)]/10 px-5 py-2 text-[11px] text-amber-900 flex items-center justify-between">
          <span>Tap any button to drop a live sound cue during debate, accusations, or reveals.</span>
        </div>

        {/* Sound List */}
        <main className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            {soundList.map(item => {
              const Icon = item.icon;
              const isPlaying = activeSound === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => trigger(item.id, item.action)}
                  className={`group relative flex flex-col items-start p-3 rounded-2xl border-2 transition-all duration-150 text-left ${
                    isPlaying
                      ? 'scale-[0.97] bg-[var(--coral)] text-white border-[var(--ink)] shadow-inner'
                      : 'border-[var(--ink)] bg-[var(--canvas)] hover:bg-stone-100 hover:border-[var(--coral)] shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        isPlaying ? 'bg-white/20 text-white' : item.tone
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {isPlaying && (
                      <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                    )}
                  </div>
                  <strong className="mt-2.5 block font-display text-sm font-black leading-tight">
                    {item.name}
                  </strong>
                  <p
                    className={`mt-1 text-[10px] leading-4 line-clamp-2 ${
                      isPlaying ? 'text-white/80' : 'text-[var(--muted)]'
                    }`}
                  >
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-[var(--ink)] p-3 bg-[var(--canvas)] flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span>Synthesized 100% offline via Web Audio</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[var(--coral)] hover:underline"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
