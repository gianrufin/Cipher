import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Play, Pause, RotateCcw, ChevronRight, 
  MessageSquare, Sparkles, HelpCircle, Vote, AlertCircle, 
  Users, Flame, Clock
} from 'lucide-react';
import { Player, RoundModifier } from '../types';
import { INTERROGATION_QUESTIONS } from '../data/wordPacks';
import { playTick, playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface ClueRoundViewProps {
  players: Player[];
  activeModifier: RoundModifier | null;
  roundNumber: number;
  categoryName: string;
  onProceedToVoting: () => void;
}

export const ClueRoundView: React.FC<ClueRoundViewProps> = ({
  players,
  activeModifier,
  roundNumber,
  categoryName,
  onProceedToVoting
}) => {
  // Surviving players only
  const activePlayers = players.filter(p => !p.isEliminated);
  
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [completedSpeakers, setCompletedSpeakers] = useState<string[]>([]);
  
  // Timer logic
  const defaultSeconds = activeModifier?.id === 'mod_rapid' ? 5 : 20;
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Interrogation prompt modal / card
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  const currentSpeaker = activePlayers[speakerIndex] || activePlayers[0];
  const allSpoken = completedSpeakers.length >= activePlayers.length;

  // Countdown timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 4 && prev > 0) {
            playTick();
            triggerHaptic(20);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      triggerHaptic([80, 40, 80]);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    triggerHaptic(20);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(defaultSeconds);
    triggerHaptic(20);
  };

  const handleNextSpeaker = () => {
    triggerHaptic(30);
    playWhoosh();

    // Mark current as spoken
    if (!completedSpeakers.includes(currentSpeaker.id)) {
      setCompletedSpeakers(prev => [...prev, currentSpeaker.id]);
    }

    // Advance
    if (speakerIndex < activePlayers.length - 1) {
      setSpeakerIndex(prev => prev + 1);
      setTimeLeft(defaultSeconds);
      setIsTimerRunning(false);
    }
  };

  const handleSelectSpeakerDirectly = (index: number) => {
    setSpeakerIndex(index);
    setTimeLeft(defaultSeconds);
    setIsTimerRunning(false);
    triggerHaptic(20);
  };

  const handleDrawQuestion = () => {
    const random = INTERROGATION_QUESTIONS[Math.floor(Math.random() * INTERROGATION_QUESTIONS.length)];
    setCurrentPrompt(random);
    triggerHaptic(30);
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase bg-rose-950/60 border border-rose-800/50 text-rose-300 px-2 py-0.5 rounded-full font-bold">
            Round {roundNumber}
          </span>
          <span className="text-xs text-slate-400">
            Category: <strong className="text-slate-200">{categoryName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Users className="h-3.5 w-3.5" />
          <span>{activePlayers.length} Alive</span>
        </div>
      </div>

      {/* Active Modifier Rule Card (if present) */}
      {activeModifier && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-amber-300 block">
                Rule Twist: {activeModifier.title}
              </span>
              <span className="text-[11px] text-amber-200/80">
                {activeModifier.rule}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Director Card: Current Speaker */}
      <div className="rounded-2xl border-2 border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <span className="text-xs uppercase tracking-widest text-slate-400 font-mono block mb-1">
          Currently Giving A Clue
        </span>

        <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {currentSpeaker.name}
        </h2>

        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
          Say <strong className="text-slate-200">one clue</strong> that describes your word without making it too obvious!
        </p>

        {/* Turn Timer */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 max-w-xs mx-auto mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className={`font-mono text-2xl font-black tracking-wider ${timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isTimerRunning
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-600/50'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-600/40'
              }`}
            >
              {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              title="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Next Speaker Button */}
        <button
          id="next-speaker-btn"
          type="button"
          onClick={handleNextSpeaker}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <span>Done / Next Player's Turn</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Speaking Queue Order */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider">Speaking Order</span>
          <span className="font-mono text-[11px]">
            {completedSpeakers.length} of {activePlayers.length} Clues Given
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activePlayers.map((player, idx) => {
            const isCurrent = idx === speakerIndex;
            const hasSpoken = completedSpeakers.includes(player.id);
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handleSelectSpeakerDirectly(idx)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                  isCurrent
                    ? 'border-rose-500 bg-rose-950/40 text-white ring-1 ring-rose-500 font-bold'
                    : hasSpoken
                    ? 'border-slate-800/60 bg-slate-950/40 text-slate-400 line-through opacity-70'
                    : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                  <span className="truncate">{player.name}</span>
                </div>
                {isCurrent && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Interrogation Cue Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <HelpCircle className="h-4 w-4 text-sky-400" />
            <span>Cross-Examination Prompts</span>
          </div>
          <button
            type="button"
            onClick={handleDrawQuestion}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            {currentPrompt ? 'Draw Another' : 'Draw Prompt'}
          </button>
        </div>

        {currentPrompt ? (
          <div className="rounded-xl border border-sky-900/50 bg-sky-950/30 p-3 text-xs text-sky-100 italic">
            "{currentPrompt}"
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Got suspicious? Tap "Draw Prompt" to generate a pointed question for any player to answer!
          </p>
        )}
      </div>

      {/* Bottom Sticky Action: Proceed to Voting */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-slate-800/40 backdrop-blur-md">
        <div className="max-w-lg mx-auto">
          <button
            id="proceed-to-voting-btn"
            type="button"
            onClick={onProceedToVoting}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-extrabold text-base shadow-lg transition-all ${
              allSpoken
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-rose-950/50 hover:opacity-95 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Vote className="h-5 w-5 text-rose-400" />
            <span>
              {allSpoken ? 'ALL CLUES GIVEN — TIME TO VOTE!' : 'OPEN DISCUSSION & VOTING'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
