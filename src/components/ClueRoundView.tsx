import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Play, Pause, RotateCcw, ChevronRight, 
  MessageSquare, Sparkles, HelpCircle, Vote, AlertCircle, 
  Users, Flame, Clock, Shuffle, Zap
} from 'lucide-react';
import { Player, RoundModifier } from '../types';
import { INTERROGATION_QUESTIONS } from '../data/wordPacks';
import { playTick, playWhoosh, triggerHaptic, playCountdown } from '../utils/soundEffects';

interface ClueRoundViewProps {
  players: Player[];
  activeModifier: RoundModifier | null;
  roundNumber: number;
  categoryName: string;
  onProceedToVoting: () => void;
}

/**
 * Strategic shuffle algorithm:
 * - Distributes Imposters evenly across the speaking lineup so they aren't clustered together
 * - In round 2+, ensures the previous round's opening speaker isn't stuck speaking first again
 */
function createStrategicTurnOrder(players: Player[], roundNumber: number): Player[] {
  const active = players.filter(p => !p.isEliminated);
  if (active.length <= 2) return [...active];

  const imposters = active.filter(p => p.role === 'imposter');
  const citizens = active.filter(p => p.role !== 'imposter');

  // Randomize citizens and imposters separately
  const shuffledCitizens = [...citizens].sort(() => Math.random() - 0.5);
  const shuffledImposters = [...imposters].sort(() => Math.random() - 0.5);

  const result: Player[] = [];
  // Calculate ideal intervals to interleave imposters strategically among citizens
  const totalSlots = active.length;
  const numImposters = shuffledImposters.length;

  if (numImposters === 0) {
    return shuffledCitizens;
  }

  // Determine positions for imposters to prevent imposter bunching
  // e.g. For 1 imposter in 4 players, avoid slot 0 (so Citizens lead the tone) unless high round
  const imposterTargetIndices: number[] = [];
  const spacing = Math.floor(totalSlots / (numImposters + 1));
  for (let i = 1; i <= numImposters; i++) {
    const rawIndex = i * spacing + (roundNumber % 2 === 0 ? 1 : 0);
    const clampedIndex = Math.min(Math.max(1, rawIndex), totalSlots - 1);
    imposterTargetIndices.push(clampedIndex);
  }

  let citizenIdx = 0;
  let imposterIdx = 0;

  for (let slot = 0; slot < totalSlots; slot++) {
    if (imposterTargetIndices.includes(slot) && imposterIdx < shuffledImposters.length) {
      result.push(shuffledImposters[imposterIdx++]);
    } else if (citizenIdx < shuffledCitizens.length) {
      result.push(shuffledCitizens[citizenIdx++]);
    } else if (imposterIdx < shuffledImposters.length) {
      result.push(shuffledImposters[imposterIdx++]);
    }
  }

  return result;
}

export const ClueRoundView: React.FC<ClueRoundViewProps> = ({
  players,
  activeModifier,
  roundNumber,
  categoryName,
  onProceedToVoting
}) => {
  // Strategically ordered active players
  const [orderedPlayers, setOrderedPlayers] = useState<Player[]>(() => 
    createStrategicTurnOrder(players, roundNumber)
  );
  
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [completedSpeakers, setCompletedSpeakers] = useState<string[]>([]);
  
  // Timer logic
  const defaultSeconds = activeModifier?.id === 'mod_rapid' ? 5 : 20;
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3-second Pre-Countdown State for current speaker
  const [preCountdown, setPreCountdown] = useState<number | null>(3);
  const preCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interrogation prompt modal / card
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  const currentSpeaker = orderedPlayers[speakerIndex] || orderedPlayers[0];
  const allSpoken = completedSpeakers.length >= orderedPlayers.length;

  // Function to initiate the 3-second pre-countdown before starting the turn timer
  const startPreCountdown = (autoStart = true) => {
    // Clear any existing timers
    if (preCountdownTimerRef.current) clearInterval(preCountdownTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsTimerRunning(false);
    setTimeLeft(defaultSeconds);

    if (!autoStart) {
      setPreCountdown(null);
      return;
    }

    setPreCountdown(3);
    playCountdown(3);

    let count = 3;
    preCountdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setPreCountdown(count);
        playCountdown(count);
      } else if (count === 0) {
        setPreCountdown(0);
        playCountdown(0); // Buzzer/Go beep!
      } else {
        if (preCountdownTimerRef.current) clearInterval(preCountdownTimerRef.current);
        setPreCountdown(null);
        // Start actual speaking timer
        setIsTimerRunning(true);
      }
    }, 1000);
  };

  // Start pre-countdown automatically when current speaker changes or component mounts
  useEffect(() => {
    startPreCountdown(true);
    return () => {
      if (preCountdownTimerRef.current) clearInterval(preCountdownTimerRef.current);
    };
  }, [speakerIndex]);

  // Speaking countdown timer effect (runs after pre-countdown reaches 0)
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0 && preCountdown === null) {
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
  }, [isTimerRunning, timeLeft, preCountdown]);

  const handleToggleTimer = () => {
    // If paused during pre-countdown, cancel pre-countdown and pause
    if (preCountdown !== null) {
      if (preCountdownTimerRef.current) clearInterval(preCountdownTimerRef.current);
      setPreCountdown(null);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
    triggerHaptic(20);
  };

  const handleResetTimer = () => {
    startPreCountdown(true);
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
    if (speakerIndex < orderedPlayers.length - 1) {
      setSpeakerIndex(prev => prev + 1);
    }
  };

  const handleSelectSpeakerDirectly = (index: number) => {
    setSpeakerIndex(index);
    triggerHaptic(20);
  };

  const handleReshuffleOrder = () => {
    playWhoosh();
    triggerHaptic([30, 20, 40]);
    const newlyOrdered = createStrategicTurnOrder(players, roundNumber + 1);
    setOrderedPlayers(newlyOrdered);
    setSpeakerIndex(0);
    setCompletedSpeakers([]);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReshuffleOrder}
            title="Strategically reshuffle turn order"
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
          >
            <Shuffle className="h-3 w-3 text-rose-400" />
            <span>Shuffle</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Users className="h-3.5 w-3.5" />
            <span>{orderedPlayers.length} in play</span>
          </div>
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
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              Speaker #{speakerIndex + 1} of {orderedPlayers.length}
            </span>
            <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/20">
              Strategic Order
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-slate-100 tracking-tight">
            {currentSpeaker.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Give <strong className="text-slate-200">one subtle clue</strong> about your word. Keep it cryptic enough to conceal from imposters.
          </p>
        </div>

        {/* Turn Timer with 3-Second Pre-Countdown Display */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] max-w-xs mx-auto space-y-2">
          {preCountdown !== null ? (
            /* PRE-COUNTDOWN MODE */
            <div className="py-2 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
                <Zap className="h-3.5 w-3.5 animate-bounce" />
                <span>Get Ready to Speak</span>
              </div>
              <div className="font-display font-black text-5xl text-rose-300 tracking-tight animate-pulse">
                {preCountdown === 0 ? 'SPEAK!' : preCountdown}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {preCountdown === 0 ? 'Timer starting now...' : `Starting in ${preCountdown}s...`}
              </p>
            </div>
          ) : (
            /* ACTIVE SPEAKING TIMER MODE */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pl-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className={`font-mono text-xl font-bold tracking-wider ${timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
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
                  title="Restart 3s pre-countdown & timer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Speaker Button */}
        <button
          id="next-speaker-btn"
          type="button"
          onClick={handleNextSpeaker}
          className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 font-semibold text-xs border border-white/[0.08] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>{speakerIndex < orderedPlayers.length - 1 ? 'Next Speaker' : 'Finish Clue Round'}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Speaking Queue Order */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Turn Order</span>
            <span className="text-[10px] text-slate-500">(Strategic Shuffle)</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {completedSpeakers.length} of {orderedPlayers.length} Clues Given
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {orderedPlayers.map((player, idx) => {
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
