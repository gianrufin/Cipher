import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bomb, EyeOff, Fingerprint, Flame, HeartHandshake, ScanSearch, Shield, ShieldCheck } from 'lucide-react';
import { GameMode, Player, RoleType } from '../types';
import { playReveal, playWhoosh, triggerHaptic } from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';

interface PassAndRevealScreenProps {
  players: Player[];
  currentIndex: number;
  mode: GameMode;
  categoryName: string;
  accomplicesAware: boolean;
  onWordRepeated: () => Promise<void>;
  onNextPlayer: () => void;
  onFinishPass: () => void;
}

const ROLE_BRIEF: Record<RoleType, { label: string; team: string; mission: string; accent: string }> = {
  citizen: { label: 'Citizen', team: 'Citizen team', mission: 'Give a useful clue and expose every Imposter.', accent: 'blue' },
  decoy: { label: 'Citizen', team: 'Citizen team', mission: 'Your word is different. Read the table carefully and help the Citizens.', accent: 'blue' },
  imposter: { label: 'Imposter', team: 'Imposter team', mission: 'Blend in, decode the real word, and survive the vote.', accent: 'coral' },
  inspector: { label: 'Inspector', team: 'Citizen team', mission: 'Use your private intel quietly without exposing yourself.', accent: 'cobalt' },
  sleeper: { label: 'Sleeper Agent', team: 'Imposter ally', mission: 'You know the Citizen word, but you win with the Imposters.', accent: 'violet' },
  anarchist: { label: 'Wild Card', team: 'Neutral', mission: 'Convince the table to eject you first.', accent: 'yellow' },
  bodyguard: { label: 'Bodyguard', team: 'Citizen team', mission: 'You may protect another Citizen once.', accent: 'lime' }
};

const roleIcon = (role: RoleType) => {
  const icons = { citizen: Shield, decoy: Shield, imposter: Flame, inspector: ScanSearch, sleeper: HeartHandshake, anarchist: Bomb, bodyguard: ShieldCheck };
  return icons[role];
};

export const PassAndRevealScreen: React.FC<PassAndRevealScreenProps> = ({
  players, currentIndex, mode, categoryName, accomplicesAware, onWordRepeated, onNextPlayer, onFinishPass
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [repeatOfferConsumed, setRepeatOfferConsumed] = useState(false);
  const [replacementCount, setReplacementCount] = useState(0);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [repeatError, setRepeatError] = useState('');
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPlayer = players[currentIndex];
  const isLastPlayer = currentIndex === players.length - 1;
  const briefing = ROLE_BRIEF[currentPlayer.role];
  const RoleIcon = roleIcon(currentPlayer.role);
  const fellowImposters = players.filter(player => player.role === 'imposter' && player.id !== currentPlayer.id);
  const word = currentPlayer.role === 'imposter' && mode === 'blind' ? 'NO WORD' : currentPlayer.secretWord;
  const canFlagRepeat = !repeatOfferConsumed && word !== 'NO WORD' && hasViewed && !isRevealed && replacementCount < 3;

  const conceal = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    setIsRevealed(false);
    setHoldProgress(0);
  };

  useEffect(() => {
    setIsRevealed(false); setHasViewed(false); setHoldProgress(0); setConfirmReplace(false); setRepeatError('');
  }, [currentIndex]);

  useEffect(() => {
    const hide = () => conceal();
    const visibility = () => { if (document.hidden) conceal(); };
    window.addEventListener('blur', hide);
    window.addEventListener('pointerup', hide);
    window.addEventListener('pointercancel', hide);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', hide);
      window.removeEventListener('pointerup', hide);
      window.removeEventListener('pointercancel', hide);
      document.removeEventListener('visibilitychange', visibility);
      if (holdTimer.current) clearInterval(holdTimer.current);
    };
  }, []);

  const startHold = () => {
    if (isRevealed || holdTimer.current || isReplacing) return;
    triggerHaptic(18);
    let progress = 0;
    holdTimer.current = setInterval(() => {
      progress += 8;
      setHoldProgress(Math.min(progress, 100));
      if (progress >= 100) {
        if (holdTimer.current) clearInterval(holdTimer.current);
        holdTimer.current = null;
        setIsRevealed(true);
        setHasViewed(true);
        playReveal();
        triggerHaptic([25, 35, 45]);
      }
    }, 32);
  };

  const proceed = () => {
    conceal();
    if (word !== 'NO WORD') setRepeatOfferConsumed(true);
    setHasViewed(false);
    setConfirmReplace(false);
    playWhoosh();
    isLastPlayer ? onFinishPass() : onNextPlayer();
  };

  const replaceWord = async () => {
    setIsReplacing(true);
    setConfirmReplace(false);
    conceal();
    try {
      await onWordRepeated();
      setReplacementCount(count => count + 1);
      setHasViewed(false);
      setRepeatError('');
    } catch (error) {
      setRepeatError(error instanceof Error ? error.message : 'No fresh word is available in this deck.');
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className={`reveal-stage ${isRevealed ? 'reveal-neutral' : ''}`}>
      <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-lg flex-col px-5 pb-7 pt-5">
        <header className="flex items-center justify-between text-xs font-bold">
          <span>{String(currentIndex + 1).padStart(2, '0')} / {String(players.length).padStart(2, '0')}</span>
          <span>{categoryName}</span>
        </header>

        {!isRevealed ? (
          <section className="flex flex-1 flex-col justify-center text-center">
            <PlayerAvatar name={currentPlayer.name} src={currentPlayer.avatarPhoto} className="mx-auto h-24 w-24 border-2 border-current/20 text-2xl" />
            <p className="cipher-eyebrow mt-6">Private turn</p>
            <h1 className="mt-2 font-display text-5xl font-black tracking-[-.05em]">Pass to {currentPlayer.name}</h1>
            <p className="mx-auto mt-3 max-w-xs text-sm opacity-70">Shield the screen. Your secret stays visible only while you keep holding.</p>

            {confirmReplace ? (
              <div className="reveal-confirm mt-8">
                <strong>Replace it for the whole group?</strong>
                <p>Nobody else has seen this round’s word.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => void replaceWord()} className="cipher-button-primary">Replace word</button>
                  <button onClick={() => setConfirmReplace(false)} className="cipher-button-secondary">Keep it</button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); startHold(); }}
                  onPointerUp={conceal}
                  onPointerCancel={conceal}
                  onContextMenu={event => event.preventDefault()}
                  className="reveal-hold mt-9 touch-none"
                >
                  <span className="reveal-hold-fill" style={{ transform: `scaleX(${holdProgress / 100})` }} />
                  <Fingerprint className="relative h-6 w-6" />
                  <span className="relative">{isReplacing ? 'Finding a fresh word…' : holdProgress ? 'Keep holding…' : hasViewed ? 'Hold to peek again' : 'Press and hold to view'}</span>
                </button>
                {canFlagRepeat && <button className="cipher-text-button mx-auto mt-4" onClick={() => setConfirmReplace(true)}>Seen this word before?</button>}
                {repeatError && <p className="mt-4 text-sm font-bold text-[var(--coral)]">{repeatError}</p>}
                {hasViewed && <button type="button" onClick={proceed} className="cipher-button-primary mt-6 w-full">Done, pass the phone <ArrowRight className="h-4 w-4" /></button>}
              </>
            )}
          </section>
        ) : (
          <section className="flex flex-1 select-none flex-col justify-center" aria-live="assertive">
            <div className="flex items-center justify-between">
              <div><p className="cipher-eyebrow">{briefing.team}</p><h1 className="mt-2 font-display text-5xl font-black">{briefing.label}</h1></div>
              <RoleIcon className="h-10 w-10" />
            </div>
            <div className="my-10">
              <p className="text-xs font-black uppercase tracking-[.16em] opacity-60">{word === 'NO WORD' ? 'Blind status' : currentPlayer.role === 'imposter' ? 'Decoy word' : 'Your word'}</p>
              <p className="mt-3 break-words font-display text-6xl font-black leading-none tracking-[-.06em]">{word}</p>
            </div>
            {currentPlayer.intel && <p className="private-note">{currentPlayer.intel}</p>}
            {currentPlayer.role === 'imposter' && accomplicesAware && fellowImposters.length > 0 && <p className="private-note">Known accomplices: <strong>{fellowImposters.map(player => player.name).join(', ')}</strong></p>}
            <p className="max-w-md text-base font-semibold leading-7">{briefing.mission}</p>
            <div className="mt-10 flex items-center justify-center gap-2 text-sm font-black"><EyeOff className="h-5 w-5" /> Release to hide</div>
          </section>
        )}
      </div>
    </div>
  );
};
