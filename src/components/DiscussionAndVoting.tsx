import React, { useState, useEffect, useRef } from 'react';
import { 
  Vote, Users, ShieldAlert, ArrowRight, EyeOff, 
  Check, AlertTriangle, Flame, RotateCcw, Zap, Compass
} from 'lucide-react';
import { Player, VotingStyle } from '../types';
import { playVote, triggerHaptic, playWhoosh, playCountdown } from '../utils/soundEffects';

interface DiscussionAndVotingProps {
  players: Player[];
  initialVotingStyle?: VotingStyle;
  onEliminatePlayer: (playerId: string) => void;
  onReturnToClues: () => void;
}

export const DiscussionAndVoting: React.FC<DiscussionAndVotingProps> = ({
  players,
  initialVotingStyle = 'open',
  onEliminatePlayer,
  onReturnToClues
}) => {
  const activePlayers = players.filter(p => !p.isEliminated);

  // Voting mode: 'open' (group points finger & taps accused) or 'secret_ballot' (pass phone to vote secretly)
  const [votingMethod, setVotingMethod] = useState<'open' | 'secret'>(
    initialVotingStyle === 'blind' ? 'secret' : 'open'
  );

  // 3-2-1 Simultaneous Pointing Countdown State
  const [countdownStep, setCountdownStep] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // For open vote: currently selected target for confirmation
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // For secret ballot:
  const [secretVoterIndex, setSecretVoterIndex] = useState(0);
  const [secretVotes, setSecretVotes] = useState<Record<string, number>>({});
  const [secretStep, setSecretStep] = useState<'pass' | 'vote' | 'results'>('pass');
  const [currentSecretSelection, setCurrentSecretSelection] = useState<string | null>(null);

  const currentVoter = activePlayers[secretVoterIndex];

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const handleStartCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdownStep(3);
    playCountdown(3);

    let current = 3;
    countdownTimerRef.current = setInterval(() => {
      current -= 1;
      if (current >= 0) {
        setCountdownStep(current);
        playCountdown(current);
      } else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setTimeout(() => {
          setCountdownStep(null);
        }, 2200);
      }
    }, 950);
  };

  // Open voting selection
  const handleSelectOpenTarget = (id: string) => {
    setSelectedTargetId(id);
    playVote();
  };

  const handleConfirmOpenElimination = () => {
    if (!selectedTargetId) return;
    triggerHaptic([60, 40, 100]);
    onEliminatePlayer(selectedTargetId);
  };

  // Secret ballot handlers
  const handleSecretVoteSubmit = () => {
    if (!currentSecretSelection) return;
    playVote();

    const updated = {
      ...secretVotes,
      [currentSecretSelection]: (secretVotes[currentSecretSelection] || 0) + 1
    };
    setSecretVotes(updated);
    setCurrentSecretSelection(null);

    if (secretVoterIndex < activePlayers.length - 1) {
      setSecretVoterIndex(prev => prev + 1);
      setSecretStep('pass');
      playWhoosh();
    } else {
      setSecretStep('results');
      triggerHaptic([80, 50, 120]);
    }
  };

  // Find most voted in secret ballot
  const getMostVotedPlayer = () => {
    let maxVotes = -1;
    let topPlayerId = activePlayers[0]?.id;
    let isTie = false;

    activePlayers.forEach(p => {
      const count = secretVotes[p.id] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        topPlayerId = p.id;
        isTie = false;
      } else if (count === maxVotes && count > 0) {
        isTie = true;
      }
    });

    return { topPlayerId, maxVotes, isTie };
  };

  const { topPlayerId, maxVotes, isTie } = getMostVotedPlayer();

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
            <Vote className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-white">Accusation Phase</h2>
            <p className="text-[11px] text-slate-400">Debate face-to-face and eliminate an imposter</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToClues}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Review Clues</span>
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setVotingMethod('open')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            votingMethod === 'open'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Open Accusation
        </button>
        <button
          type="button"
          onClick={() => {
            setVotingMethod('secret');
            setSecretStep('pass');
            setSecretVoterIndex(0);
            setSecretVotes({});
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            votingMethod === 'secret'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Secret Ballot
        </button>
      </div>

      {/* METHOD 1: OPEN ACCUSATION */}
      {votingMethod === 'open' && (
        <div className="space-y-4">
          {/* Simultaneous Pointing Widget */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-4 text-center space-y-3 shadow-lg">
            {countdownStep !== null ? (
              <div className="py-6 space-y-2 animate-pulse">
                {countdownStep > 0 ? (
                  <>
                    <div className="font-display font-black text-6xl text-rose-400 tracking-tight">
                      {countdownStep}
                    </div>
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-300">
                      Lock in your suspect... get ready!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-display font-black text-4xl sm:text-5xl text-rose-300 tracking-wider">
                      👉 POINT NOW! 👈
                    </div>
                    <p className="text-xs text-rose-200/90 font-medium">
                      Everyone points at their prime suspect!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                    <Zap className="h-3.5 w-3.5 text-rose-400" />
                    <span>Simultaneous Finger-Point</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                    Trigger a 3-second audio countdown so everyone points at once—zero copycat voting!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs whitespace-nowrap shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>3-2-1 Point!</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300 leading-relaxed">
            Deliberate with the table or use the 3-2-1 point. Select the player who received the most accusations below:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activePlayers.map((player) => {
              const isSelected = selectedTargetId === player.id;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelectOpenTarget(player.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-[#160c10] text-white shadow-md'
                      : 'border-white/[0.08] bg-[#0c101a] text-slate-200 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                      isSelected ? 'bg-rose-500 text-white' : 'bg-white/[0.06] text-slate-300'
                    }`}>
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-display font-semibold text-sm block text-slate-100">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">SUSPECT</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm Elimination Card */}
          {selectedTargetId && (
            <div className="rounded-2xl border border-rose-500/40 bg-[#160c10] p-5 text-center space-y-3 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-rose-300 uppercase tracking-widest font-mono font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Accusation Locked</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-100">
                Eliminate {activePlayers.find(p => p.id === selectedTargetId)?.name}?
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Their true identity will be revealed. If an Imposter is caught, they get one chance at the Last Stand redemption!
              </p>
              <button
                id="confirm-open-eliminate-btn"
                type="button"
                onClick={handleConfirmOpenElimination}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
              >
                Confirm & Reveal Identity
              </button>
            </div>
          )}
        </div>
      )}

      {/* METHOD 2: SECRET BALLOT */}
      {votingMethod === 'secret' && (
        <div className="space-y-4">
          {secretStep === 'pass' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-6 text-center space-y-4 shadow-xl">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                VOTER {secretVoterIndex + 1} OF {activePlayers.length}
              </span>
              <h3 className="font-display text-2xl font-bold text-slate-100">
                Pass device to {currentVoter.name}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Cast your secret ballot in private. Votes are tallied anonymously.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSecretStep('vote');
                  triggerHaptic(20);
                }}
                className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 font-semibold text-xs border border-white/[0.08] transition-all flex items-center justify-center gap-2"
              >
                <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                <span>I am {currentVoter.name} — Open Ballot</span>
              </button>
            </div>
          )}

          {secretStep === 'vote' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{currentVoter.name}'s Confidential Ballot</span>
                <span className="text-rose-400 text-[11px] font-mono">SELECT 1</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePlayers.map((player) => {
                  const isSelf = player.id === currentVoter.id;
                  const isSelected = currentSecretSelection === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      disabled={isSelf}
                      onClick={() => {
                        setCurrentSecretSelection(player.id);
                        triggerHaptic(20);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelf
                          ? 'border-white/[0.04] bg-white/[0.01] text-slate-600 cursor-not-allowed'
                          : isSelected
                          ? 'border-rose-500 bg-[#160c10] text-white font-semibold'
                          : 'border-white/[0.08] bg-[#0c101a] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <span className="text-xs">{player.name} {isSelf && '(You)'}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!currentSecretSelection}
                onClick={handleSecretVoteSubmit}
                className={`w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md ${
                  currentSecretSelection
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-white/[0.04] text-slate-600 border border-white/[0.06] cursor-not-allowed'
                }`}
              >
                Submit Secret Vote
              </button>
            </div>
          )}

          {secretStep === 'results' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-4 shadow-xl text-center animate-fadeIn">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                Ballot Tally Results
              </span>

              <div className="space-y-1.5">
                {activePlayers.map((p) => {
                  const count = secretVotes[p.id] || 0;
                  const isTop = p.id === topPlayerId && !isTie && count > 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                        isTop
                          ? 'border-rose-500 bg-rose-500/10 text-white font-semibold'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-300'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-slate-400">{count} vote{count !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>

              {isTie ? (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-200 text-xs">
                  Tie vote! Discuss and cast an open accusation to break the tie.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onEliminatePlayer(topPlayerId)}
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-md"
                >
                  Eliminate {activePlayers.find(p => p.id === topPlayerId)?.name}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
