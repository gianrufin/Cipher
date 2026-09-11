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
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 space-y-5">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-bold tracking-wider">
            Round {roundNumber}
          </span>
          <span className="text-xs text-slate-400">
            Topic: <strong className="text-slate-200">{categoryName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Users className="h-3.5 w-3.5" />
          <span>{activePlayers.length} in play</span>
        </div>
      </div>

      {/* Active Modifier Rule Card (if present) */}
      {activeModifier && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-amber-200 block">
                Rule Modifier: {activeModifier.title}
              </span>
              <span className="text-[11px] text-amber-300/80">
                {activeModifier.rule}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Director Card: Current Speaker */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-6 shadow-xl text-center space-y-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono block mb-1">
            Current Speaker
          </span>
          <h2 className="font-display text-3xl font-bold text-slate-100 tracking-tight">
            {currentSpeaker.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Give <strong className="text-slate-200">one subtle clue</strong> about your word. Keep it cryptic enough to conceal from imposters.
          </p>
        </div>

        {/* Turn Timer */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] max-w-xs mx-auto">
          <div className="flex items-center gap-2 pl-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className={`font-mono text-xl font-bold tracking-wider ${timeLeft <= 4 ? 'text-rose-400' : 'text-slate-100'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isTimerRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] border border-white/[0.08]'
              }`}
            >
              {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.05]"
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
          className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 font-semibold text-xs border border-white/[0.08] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Next Speaker</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Speaking Queue Order */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Turn Order</span>
          <span className="font-mono text-[11px] text-slate-400">
            {completedSpeakers.length} of {activePlayers.length} Clues Given
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {activePlayers.map((player, idx) => {
            const isCurrent = idx === speakerIndex;
            const hasSpoken = completedSpeakers.includes(player.id);
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handleSelectSpeakerDirectly(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                  isCurrent
                    ? 'border-rose-500 bg-rose-500/10 text-white font-semibold'
                    : hasSpoken
                    ? 'border-white/[0.04] bg-white/[0.01] text-slate-400 line-through opacity-70'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] text-slate-500">{idx + 1}</span>
                  <span className="truncate">{player.name}</span>
                </div>
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-Examination Cue Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <HelpCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Cross-Examination Prompt</span>
          </div>
          <button
            type="button"
            onClick={handleDrawQuestion}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
          >
            {currentPrompt ? 'Draw Another' : 'Draw Prompt'}
          </button>
        </div>

        {currentPrompt ? (
          <div className="rounded-lg border border-white/[0.08] bg-slate-950/80 p-3 text-xs text-slate-200 italic">
            "{currentPrompt}"
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Need to probe a player? Draw a pointed cross-examination question to challenge suspected imposters.
          </p>
        )}
      </div>

      {/* Bottom Sticky Action: Proceed to Voting */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#090d16]/95 border-t border-white/[0.08] backdrop-blur-md">
        <div className="max-w-lg mx-auto">
          <button
            id="proceed-to-voting-btn"
            type="button"
            onClick={onProceedToVoting}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-sm tracking-wider uppercase transition-all shadow-md ${
              allSpoken
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 active:scale-[0.98]'
                : 'bg-white/[0.06] text-slate-200 border border-white/[0.08] hover:bg-white/[0.1]'
            }`}
          >
            <Vote className="h-4 w-4" />
            <span>
              {allSpoken ? 'All Clues Given — Proceed to Vote' : 'Open Voting & Accusation'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
