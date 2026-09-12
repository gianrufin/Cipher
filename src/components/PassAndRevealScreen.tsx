import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Bomb, CheckCircle, EyeOff, Fingerprint, Flame,
  HeartHandshake, LockKeyhole, ScanSearch, Shield, ShieldCheck, Smartphone
} from 'lucide-react';
import { GameMode, Player, RoleType } from '../types';
import { playReveal, playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface PassAndRevealScreenProps {
  players: Player[];
  currentIndex: number;
  mode: GameMode;
  categoryName: string;
  accomplicesAware: boolean;
  onNextPlayer: () => void;
  onFinishPass: () => void;
}

const ROLE_BRIEF: Record<RoleType, { label: string; team: string; mission: string; accent: string }> = {
  citizen: { label: 'Citizen', team: 'Citizen team', mission: 'Give a precise clue, compare stories, and expose every Imposter.', accent: 'emerald' },
  imposter: { label: 'Imposter', team: 'Imposter team', mission: 'Blend in, infer the real word, and survive the table vote.', accent: 'rose' },
  inspector: { label: 'Inspector', team: 'Citizen team', mission: 'Use your classified radar quietly. If you look like the investigator, a caught Imposter can identify you and steal the win.', accent: 'sky' },
  sleeper: { label: 'Sleeper Agent', team: 'Imposter ally', mission: 'You know the Citizen word, but win with the Imposters. You do not know who they are, and they do not know you.', accent: 'violet' },
  anarchist: { label: 'Anarchist', team: 'Neutral', mission: 'Your only objective is to get voted out. Look suspicious without making the trap obvious.', accent: 'amber' },
  bodyguard: { label: 'Bodyguard', team: 'Citizen team', mission: 'You may reveal once before an identity reveal to cancel the elimination and force a fresh clue round.', accent: 'lime' }
};

const roleIcon = (role: RoleType) => {
  const icons = { citizen: Shield, imposter: Flame, inspector: ScanSearch, sleeper: HeartHandshake, anarchist: Bomb, bodyguard: ShieldCheck };
  return icons[role];
};

export const PassAndRevealScreen: React.FC<PassAndRevealScreenProps> = ({
  players, currentIndex, mode, categoryName, accomplicesAware, onNextPlayer, onFinishPass
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPlayer = players[currentIndex];
  const isLastPlayer = currentIndex === players.length - 1;
  const briefing = ROLE_BRIEF[currentPlayer.role];
  const RoleIcon = roleIcon(currentPlayer.role);
  const fellowImposters = players.filter(player => player.role === 'imposter' && player.id !== currentPlayer.id);

  useEffect(() => () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
  }, []);

  const startHold = () => {
    if (isRevealed || holdTimer.current) return;
    triggerHaptic(20);
    let progress = 0;
    holdTimer.current = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimer.current) clearInterval(holdTimer.current);
        holdTimer.current = null;
        setIsRevealed(true);
        setHasViewed(true);
        playReveal();
        triggerHaptic([35, 45, 65]);
      }
    }, 24);
  };

  const stopHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    if (!isRevealed) setHoldProgress(0);
  };

  const proceed = () => {
    setIsRevealed(false);
    setHasViewed(false);
    setHoldProgress(0);
    playWhoosh();
    isLastPlayer ? onFinishPass() : onNextPlayer();
  };

  const wordLabel = currentPlayer.role === 'imposter'
    ? mode === 'decoy' ? 'Decoy word' : 'Blind status'
    : 'Citizen word';
  const word = currentPlayer.role === 'imposter' && mode === 'blind'
    ? 'NO WORD'
    : currentPlayer.secretWord;

  return (
    <div className="w-full max-w-lg mx-auto min-h-[calc(100svh-64px)] px-4 py-5 flex flex-col">
      <header>
        <div className="flex items-center justify-between cipher-kicker">
          <span>Identity check {String(currentIndex + 1).padStart(2, '0')}</span>
          <span>{String(players.length).padStart(2, '0')} players</span>
        </div>
        <div className="mt-3 h-px bg-white/10 overflow-hidden">
          <div className="h-full bg-[#ff6846] transition-all" style={{ width: `${((currentIndex + 1) / players.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 flex items-center py-8">
        {!isRevealed ? (
          <section className="w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-stone-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <p className="cipher-kicker mt-6">Eyes only</p>
            <h1 className="font-display text-4xl font-black tracking-tight text-stone-50 mt-2">Pass to {currentPlayer.name}</h1>
            <p className="text-sm text-stone-500 mt-3">Shield the screen, then hold below to decrypt.</p>

            <button
              type="button"
              id="hold-reveal-secret-btn"
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              onTouchCancel={stopHold}
              onContextMenu={event => event.preventDefault()}
              className="relative mt-8 w-full min-h-44 overflow-hidden rounded-[28px] border border-white/10 bg-[#121210] p-6 text-stone-100 shadow-2xl select-none touch-none active:scale-[0.99] transition-transform"
            >
              <div className="absolute inset-y-0 left-0 bg-[#ff6846]/15 transition-all" style={{ width: `${holdProgress}%` }} />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6846] text-stone-950">
                  {holdProgress ? <Fingerprint className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                </div>
                <span className="font-display text-sm font-black uppercase tracking-[0.16em]">
                  {holdProgress ? `Decrypting ${Math.round(holdProgress)}%` : 'Press and hold'}
                </span>
                <span className="text-xs text-stone-500">Quick taps stay locked</span>
              </div>
            </button>
          </section>
        ) : (
          <section className={`w-full cipher-role-card role-${briefing.accent}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="cipher-kicker">{briefing.team}</p>
                <h1 className="font-display text-4xl font-black tracking-tight text-stone-50 mt-2">{briefing.label}</h1>
              </div>
              <div className="role-icon"><RoleIcon className="h-5 w-5" /></div>
            </div>

            <div className="my-6 border-y border-white/10 py-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-stone-500">
                <span>{wordLabel}</span><span>{categoryName}</span>
              </div>
              <div className="font-display text-4xl sm:text-5xl font-black tracking-tight text-stone-50 mt-3 break-words">{word}</div>
            </div>

            {currentPlayer.role === 'inspector' && currentPlayer.intel && (
              <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.07] p-4 mb-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-sky-300 mb-2">Classified radar</p>
                <p className="text-sm font-bold text-sky-100">{currentPlayer.intel}</p>
              </div>
            )}

            {currentPlayer.isDoubleAgentDecoy && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 mb-4 text-xs text-amber-100">
                Paranoid status: your word may be a decoy. You are still a Citizen.
              </div>
            )}

            <p className="text-sm leading-6 text-stone-300">{briefing.mission}</p>
            {currentPlayer.role === 'imposter' && accomplicesAware && fellowImposters.length > 0 && (
              <p className="mt-4 text-xs text-rose-200">Known accomplices: <strong>{fellowImposters.map(player => player.name).join(', ')}</strong></p>
            )}

            <button type="button" onClick={() => setIsRevealed(false)} className="mt-6 inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-200">
              <EyeOff className="h-4 w-4" /> Conceal immediately
            </button>
          </section>
        )}
      </div>

      <footer className="border-t border-white/10 pt-4">
        <button type="button" id="confirm-memorized-pass-btn" disabled={!hasViewed} onClick={proceed} className="cipher-button-primary w-full disabled:opacity-30 disabled:cursor-not-allowed">
          {isLastPlayer ? <CheckCircle className="h-4 w-4" /> : null}
          {isLastPlayer ? 'Begin clue round' : 'Memorized, pass it on'}
          {!isLastPlayer ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </footer>
    </div>
  );
};

