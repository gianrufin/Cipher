import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock, HelpCircle, Pause, Play, RotateCcw, Shuffle, Vote } from 'lucide-react';
import { Player, RoundModifier } from '../types';
import { INTERROGATION_QUESTIONS } from '../data/wordPacks';
import { playTick, playWhoosh, triggerHaptic } from '../utils/soundEffects';
import { secureShuffle } from '../utils/wordHistory';
import { PlayerAvatar } from './PlayerAvatar';

interface ClueRoundViewProps {
  players: Player[];
  activeModifier: RoundModifier | null;
  roundNumber: number;
  categoryName: string;
  onProceedToVoting: () => void;
}

const fairOrder = (players: Player[], round: number) => {
  const active = secureShuffle(players.filter(player => !player.isEliminated));
  if (!active.length) return active;
  const offset = (round - 1) % active.length;
  return [...active.slice(offset), ...active.slice(0, offset)];
};

export const ClueRoundView: React.FC<ClueRoundViewProps> = ({ players, activeModifier, roundNumber, categoryName, onProceedToVoting }) => {
  const [orderedPlayers, setOrderedPlayers] = useState(() => fairOrder(players, roundNumber));
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const totalSeconds = activeModifier?.id === 'mod_rapid' ? 5 : 20;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [prompt, setPrompt] = useState<string>();
  const [promptOpen, setPromptOpen] = useState(false);
  const currentSpeaker = orderedPlayers[speakerIndex];
  const allSpoken = completedIds.length >= orderedPlayers.length;

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setTimeLeft(value => value - 1);
      if (timeLeft <= 4) playTick();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) { setRunning(false); triggerHaptic([70, 30, 70]); }
  }, [timeLeft]);

  const next = () => {
    if (!completedIds.includes(currentSpeaker.id)) setCompletedIds(ids => [...ids, currentSpeaker.id]);
    setRunning(false);
    setTimeLeft(totalSeconds);
    if (speakerIndex < orderedPlayers.length - 1) setSpeakerIndex(index => index + 1);
    playWhoosh();
  };

  const reshuffle = () => {
    setOrderedPlayers(fairOrder(players, roundNumber + 1));
    setSpeakerIndex(0); setCompletedIds([]); setRunning(false); setTimeLeft(totalSeconds);
    triggerHaptic([25, 20, 30]);
  };

  const progress = useMemo(() => orderedPlayers.length ? completedIds.length / orderedPlayers.length : 0, [completedIds.length, orderedPlayers.length]);

  return (
    <div className="clue-stage mx-auto w-full max-w-lg px-5 pb-28 pt-5">
      <header className="flex items-end justify-between border-b-2 border-[var(--ink)] pb-4">
        <div><p className="cipher-eyebrow">Round {String(roundNumber).padStart(2, '0')}</p><h1 className="mt-1 font-display text-3xl font-black">{categoryName}</h1></div>
        <button className="cipher-icon-button" onClick={reshuffle} aria-label="Reshuffle fair turn order"><Shuffle className="h-4 w-4" /></button>
      </header>

      {activeModifier && <div className="modifier-ribbon mt-5"><strong>{activeModifier.title}</strong><span>{activeModifier.rule}</span></div>}

      <section className="speaker-board mt-7">
        <div className="flex items-center justify-between"><span className="cipher-eyebrow">Speaker {speakerIndex + 1} of {orderedPlayers.length}</span><span className="text-xs font-bold">{completedIds.length} clues given</span></div>
        <PlayerAvatar name={currentSpeaker?.name || ''} src={currentSpeaker?.avatarPhoto} className="mt-7 h-24 w-24 border-2 border-[var(--ink)] text-2xl" />
        <h2 className="mt-5 font-display text-6xl font-black tracking-[-.06em]">{currentSpeaker?.name}</h2>
        <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-[var(--muted)]">Give one useful clue. Prove you know the word without giving it away.</p>

        <div className="timer-dial mt-8">
          <Clock className="h-5 w-5" />
          <span>00:{String(timeLeft).padStart(2, '0')}</span>
          <button onClick={() => setRunning(value => !value)} aria-label={running ? 'Pause timer' : 'Start timer'}>{running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
          <button onClick={() => { setRunning(false); setTimeLeft(totalSeconds); }} aria-label="Reset timer"><RotateCcw className="h-4 w-4" /></button>
        </div>

        {!allSpoken && <button className="cipher-button-primary mt-6 w-full" onClick={next}>{speakerIndex < orderedPlayers.length - 1 ? 'Next player' : 'Finish clue round'}<ChevronRight className="h-4 w-4" /></button>}
      </section>

      <div className="turn-rail mt-7" aria-label="Turn order">
        {orderedPlayers.map((player, index) => <button key={player.id} onClick={() => { setSpeakerIndex(index); setRunning(false); setTimeLeft(totalSeconds); }} className={index === speakerIndex ? 'active' : completedIds.includes(player.id) ? 'done' : ''}><span>{index + 1}</span>{player.name}</button>)}
      </div>
      <div className="mt-4 h-2 border-2 border-[var(--ink)] bg-[var(--paper)]"><div className="h-full bg-[var(--coral)]" style={{ width: `${progress * 100}%` }} /></div>

      <button className="prompt-drawer mt-6" onClick={() => setPromptOpen(value => !value)}><HelpCircle className="h-4 w-4" /><span>Need a cross-examination prompt?</span><strong>{promptOpen ? 'Close' : 'Open'}</strong></button>
      {promptOpen && <div className="prompt-sheet"><p>{prompt || 'Draw a pointed question when the table needs a push.'}</p><button className="cipher-text-button" onClick={() => setPrompt(secureShuffle(INTERROGATION_QUESTIONS)[0])}>{prompt ? 'Draw another' : 'Draw prompt'}</button></div>}

      {allSpoken && <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[var(--ink)] bg-[var(--canvas)] p-4"><button className="cipher-button-primary mx-auto flex w-full max-w-lg" onClick={onProceedToVoting}><Vote className="h-4 w-4" />Open voting</button></div>}
    </div>
  );
};
