import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, EyeOff, RotateCcw, Vote, Zap } from 'lucide-react';
import { EliminationsPerVote, Player, VotingStyle } from '../types';
import { playCountdown, playVote, playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface DiscussionAndVotingProps {
  players: Player[];
  initialVotingStyle?: VotingStyle;
  eliminationsPerVote: EliminationsPerVote;
  onEliminatePlayers: (playerIds: string[]) => void;
  onReturnToClues: () => void;
}

export const DiscussionAndVoting: React.FC<DiscussionAndVotingProps> = ({
  players,
  initialVotingStyle = 'open',
  eliminationsPerVote,
  onEliminatePlayers,
  onReturnToClues
}) => {
  const activePlayers = players.filter(player => !player.isEliminated);
  const selectionCount = Math.min(eliminationsPerVote, Math.max(1, activePlayers.length - 1));
  const [votingMethod, setVotingMethod] = useState<'open' | 'secret'>(initialVotingStyle === 'blind' ? 'secret' : 'open');
  const [countdownStep, setCountdownStep] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [secretVoterIndex, setSecretVoterIndex] = useState(0);
  const [secretVotes, setSecretVotes] = useState<Record<string, number>>({});
  const [secretStep, setSecretStep] = useState<'pass' | 'vote' | 'results'>('pass');
  const [currentSecretSelection, setCurrentSecretSelection] = useState<string[]>([]);
  const currentVoter = activePlayers[secretVoterIndex];

  useEffect(() => () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const resetSecretBallot = () => {
    setSecretStep('pass');
    setSecretVoterIndex(0);
    setSecretVotes({});
    setCurrentSecretSelection([]);
  };

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
        setTimeout(() => setCountdownStep(null), 1600);
      }
    }, 950);
  };

  const toggleSelection = (playerId: string, current: string[], update: (ids: string[]) => void) => {
    if (current.includes(playerId)) {
      update(current.filter(id => id !== playerId));
    } else if (current.length < selectionCount) {
      update([...current, playerId]);
      playVote();
    }
  };

  const handleSecretVoteSubmit = () => {
    if (currentSecretSelection.length !== selectionCount) return;
    const updated = { ...secretVotes };
    currentSecretSelection.forEach(playerId => {
      updated[playerId] = (updated[playerId] || 0) + 1;
    });
    setSecretVotes(updated);
    setCurrentSecretSelection([]);
    if (secretVoterIndex < activePlayers.length - 1) {
      setSecretVoterIndex(index => index + 1);
      setSecretStep('pass');
      playWhoosh();
    } else {
      setSecretStep('results');
      triggerHaptic([80, 50, 120]);
    }
  };

  const rankedPlayers = [...activePlayers].sort((a, b) =>
    (secretVotes[b.id] || 0) - (secretVotes[a.id] || 0) || a.avatarSeed - b.avatarSeed
  );
  const rankedTargets = rankedPlayers.slice(0, selectionCount);
  const hasCutoffTie = rankedPlayers.length > selectionCount
    && (secretVotes[rankedPlayers[selectionCount - 1]?.id] || 0) === (secretVotes[rankedPlayers[selectionCount]?.id] || 0);

  const confirmOpenVote = () => {
    if (selectedTargetIds.length !== selectionCount) return;
    triggerHaptic([60, 40, 100]);
    onEliminatePlayers(selectedTargetIds);
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 px-4 pb-24 pt-2">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400"><Vote className="h-4 w-4" /></span>
          <div>
            <h2 className="font-display text-lg font-black text-white">Accusation Phase</h2>
            <p className="text-[11px] text-slate-400">Choose {selectionCount === 2 ? 'two suspects' : 'one suspect'} for elimination</p>
          </div>
        </div>
        <button type="button" onClick={onReturnToClues} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <RotateCcw className="h-3 w-3" /> Review clues
        </button>
      </div>

      {selectionCount === 2 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
          Double Elimination is active. Candidates resolve in ranked order, and the match may end before the second reveal.
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
        <button type="button" onClick={() => setVotingMethod('open')} className={`rounded-lg py-2 text-xs font-semibold ${votingMethod === 'open' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Open Accusation</button>
        <button type="button" onClick={() => { setVotingMethod('secret'); resetSecretBallot(); }} className={`rounded-lg py-2 text-xs font-semibold ${votingMethod === 'secret' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Secret Ballot</button>
      </div>

      {votingMethod === 'open' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-4 text-center shadow-lg">
            {countdownStep !== null ? (
              <div className="space-y-2 py-6">
                <div className="font-display text-6xl font-black text-rose-400">{countdownStep > 0 ? countdownStep : 'POINT!'}</div>
                <p className="text-xs text-slate-400">Point at your strongest suspect, then discuss the final ranking.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between gap-3 text-left sm:flex-row">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-100"><Zap className="h-3.5 w-3.5 text-rose-400" /> Simultaneous Finger-Point</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">Point together, discuss the result, then select the elimination order below.</p>
                </div>
                <button type="button" onClick={handleStartCountdown} className="cipher-button-primary w-full sm:w-auto"><Zap className="h-4 w-4" /> 3-2-1 Point</button>
              </div>
            )}
          </div>

          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300">
            Select {selectionCount}. Selection order determines who is revealed first.
          </p>
          <PlayerChoices
            players={activePlayers}
            selectedIds={selectedTargetIds}
            onSelect={id => toggleSelection(id, selectedTargetIds, setSelectedTargetIds)}
          />

          {selectedTargetIds.length > 0 && (
            <div className="rounded-2xl border border-rose-500/40 bg-[#160c10] p-5 text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-300">Elimination queue</p>
              <h3 className="mt-2 font-display text-xl font-bold text-slate-100">
                {selectedTargetIds.map((id, index) => `${index + 1}. ${activePlayers.find(player => player.id === id)?.name}`).join('  ·  ')}
              </h3>
              <button type="button" disabled={selectedTargetIds.length !== selectionCount} onClick={confirmOpenVote} className="cipher-button-primary mt-4 w-full disabled:opacity-30">Confirm {selectionCount === 2 ? 'both eliminations' : 'elimination'}</button>
            </div>
          )}
        </div>
      )}

      {votingMethod === 'secret' && (
        <div className="space-y-4">
          {secretStep === 'pass' && currentVoter && (
            <div className="cipher-panel space-y-4 p-6 text-center">
              <p className="cipher-kicker">Voter {secretVoterIndex + 1} of {activePlayers.length}</p>
              <h3 className="font-display text-2xl font-bold text-slate-100">Pass to {currentVoter.name}</h3>
              <p className="text-xs text-slate-400">Choose {selectionCount} different suspect{selectionCount === 2 ? 's' : ''} in private.</p>
              <button type="button" onClick={() => setSecretStep('vote')} className="cipher-button-secondary w-full"><EyeOff className="h-4 w-4" /> Open private ballot</button>
            </div>
          )}

          {secretStep === 'vote' && currentVoter && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400"><span>{currentVoter.name}'s ballot</span><span className="font-mono text-rose-400">SELECT {selectionCount}</span></div>
              <PlayerChoices
                players={activePlayers}
                selectedIds={currentSecretSelection}
                disabledId={currentVoter.id}
                onSelect={id => toggleSelection(id, currentSecretSelection, setCurrentSecretSelection)}
              />
              <button type="button" disabled={currentSecretSelection.length !== selectionCount} onClick={handleSecretVoteSubmit} className="cipher-button-primary w-full disabled:opacity-30">Submit private vote</button>
            </div>
          )}

          {secretStep === 'results' && (
            <div className="cipher-panel space-y-4 p-5 text-center">
              <p className="cipher-kicker">Ballot results</p>
              <div className="space-y-1.5">
                {rankedPlayers.map(player => {
                  const selected = !hasCutoffTie && rankedTargets.some(target => target.id === player.id);
                  const votes = secretVotes[player.id] || 0;
                  return <div key={player.id} className={`flex justify-between rounded-lg border px-3 py-2 text-xs ${selected ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-white/[0.06] text-slate-300'}`}><span>{player.name}</span><span className="font-mono text-slate-400">{votes} vote{votes === 1 ? '' : 's'}</span></div>;
                })}
              </div>
              {hasCutoffTie ? (
                <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <p><AlertTriangle className="mr-1 inline h-4 w-4" /> Tie at the elimination line. Resolve it openly.</p>
                  <button type="button" onClick={() => { setVotingMethod('open'); setSelectedTargetIds([]); }} className="cipher-button-secondary w-full">Open tie-break</button>
                </div>
              ) : (
                <button type="button" onClick={() => onEliminatePlayers(rankedTargets.map(player => player.id))} className="cipher-button-primary w-full">Reveal elimination queue</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PlayerChoices = ({ players, selectedIds, disabledId, onSelect }: {
  players: Player[];
  selectedIds: string[];
  disabledId?: string;
  onSelect: (id: string) => void;
}) => (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {players.map(player => {
      const selectedIndex = selectedIds.indexOf(player.id);
      const disabled = player.id === disabledId;
      return (
        <button key={player.id} type="button" disabled={disabled} onClick={() => onSelect(player.id)} className={`flex items-center justify-between rounded-xl border p-3.5 text-left disabled:cursor-not-allowed disabled:opacity-25 ${selectedIndex >= 0 ? 'border-rose-500 bg-[#160c10]' : 'border-white/[0.08] bg-[#0c101a]'}`}>
          <span className="text-sm font-bold text-slate-100">{player.name}{disabled ? ' (You)' : ''}</span>
          {selectedIndex >= 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">{selectedIds.length > 1 ? selectedIndex + 1 : <Check className="h-3.5 w-3.5" />}</span>}
        </button>
      );
    })}
  </div>
);
