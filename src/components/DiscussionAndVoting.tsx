import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, EyeOff, FastForward, RotateCcw, Vote, Zap } from 'lucide-react';
import { EliminationsPerVote, Player, VotingStyle } from '../types';
import { playCountdown, playVote, playWhoosh, triggerHaptic } from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';

interface DiscussionAndVotingProps {
  players: Player[];
  initialVotingStyle?: VotingStyle;
  eliminationsPerVote: EliminationsPerVote;
  allowSkip: boolean;
  onEliminatePlayers: (playerIds: string[]) => void;
  onReturnToClues: () => void;
  onSkipVote: () => void;
}

type BallotOutcome = 'pending' | 'eject' | 'skipped' | 'no_majority' | 'deadlock';

export const DiscussionAndVoting: React.FC<DiscussionAndVotingProps> = ({ players, initialVotingStyle = 'open', eliminationsPerVote, allowSkip, onEliminatePlayers, onReturnToClues, onSkipVote }) => {
  const activePlayers = players.filter(player => !player.isEliminated);
  const selectionCount = Math.min(eliminationsPerVote, Math.max(1, activePlayers.length - 1));
  const [votingMethod, setVotingMethod] = useState<'open' | 'secret'>(initialVotingStyle === 'blind' ? 'secret' : 'open');
  const [countdownStep, setCountdownStep] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [secretVoterIndex, setSecretVoterIndex] = useState(0);
  const [secretVotes, setSecretVotes] = useState<Record<string, number>>({});
  const [skipVotes, setSkipVotes] = useState(0);
  const [secretStep, setSecretStep] = useState<'pass' | 'vote' | 'confirm' | 'results'>('pass');
  const [pendingSkip, setPendingSkip] = useState(false);
  const [confirmOpenSkip,setConfirmOpenSkip]=useState(false);
  const [currentSecretSelection, setCurrentSecretSelection] = useState<string[]>([]);
  const [runoffCandidateIds, setRunoffCandidateIds] = useState<string[] | null>(null);
  const [lockedTargetIds, setLockedTargetIds] = useState<string[]>([]);
  const [ballotOutcome, setBallotOutcome] = useState<BallotOutcome>('pending');
  const currentVoter = activePlayers[secretVoterIndex];
  const isRunoff = runoffCandidateIds !== null;
  const availableCandidates = isRunoff ? activePlayers.filter(player => runoffCandidateIds.includes(player.id)) : activePlayers;
  const requiredSelections = isRunoff ? 1 : selectionCount;

  useEffect(() => () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); }, []);

  const resetSecretBallot = () => {
    setSecretStep('pass'); setSecretVoterIndex(0); setSecretVotes({}); setSkipVotes(0);
    setCurrentSecretSelection([]); setRunoffCandidateIds(null); setLockedTargetIds([]); setBallotOutcome('pending'); setPendingSkip(false);
  };

  const handleStartCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdownStep(3); playCountdown(3); let current = 3;
    countdownTimerRef.current = setInterval(() => {
      current -= 1;
      if (current >= 0) { setCountdownStep(current); playCountdown(current); }
      else { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); setTimeout(() => setCountdownStep(null), 1600); }
    }, 950);
  };

  const toggleSelection = (playerId: string, current: string[], update: (ids: string[]) => void, limit = selectionCount) => {
    if (current.includes(playerId)) update(current.filter(id => id !== playerId));
    else if (current.length < limit) { update([...current, playerId]); playVote(); }
  };

  const finishBallot = (votes: Record<string, number>, skips: number) => {
    if (skips * 2 >= activePlayers.length) { setBallotOutcome('skipped'); setSecretStep('results'); return; }
    const ranked = [...activePlayers].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0) || a.avatarSeed - b.avatarSeed);
    if (isRunoff && runoffCandidateIds) {
      const runoffRanked = ranked.filter(player => runoffCandidateIds.includes(player.id));
      const topVotes = votes[runoffRanked[0]?.id] || 0;
      const leaders = runoffRanked.filter(player => (votes[player.id] || 0) === topVotes);
      if (topVotes < 2 || leaders.length !== 1) setBallotOutcome(lockedTargetIds.length ? 'eject' : 'deadlock');
      else { setLockedTargetIds(ids => [...ids, leaders[0].id].slice(0, selectionCount)); setBallotOutcome('eject'); }
      setSecretStep('results'); return;
    }
    const cutoff = votes[ranked[selectionCount - 1]?.id] || 0;
    const locked = ranked.filter(player => (votes[player.id] || 0) > cutoff).slice(0, selectionCount).map(player => player.id);
    const tied = ranked.filter(player => (votes[player.id] || 0) === cutoff && cutoff >= 2).map(player => player.id);
    const validTop = ranked.slice(0, selectionCount).filter(player => (votes[player.id] || 0) >= 2);
    if (validTop.length === 0) setBallotOutcome('no_majority');
    else if (tied.length > selectionCount - locked.length) { setLockedTargetIds(locked); setRunoffCandidateIds(tied); setBallotOutcome('pending'); }
    else { setLockedTargetIds(validTop.map(player => player.id)); setBallotOutcome('eject'); }
    setSecretStep('results');
  };

  const handleSecretVoteSubmit = (skip = false) => {
    if (!skip && currentSecretSelection.length !== requiredSelections) return;
    const updated = isRunoff ? { ...secretVotes } : { ...secretVotes };
    currentSecretSelection.forEach(playerId => { updated[playerId] = (updated[playerId] || 0) + 1; });
    const updatedSkips = skipVotes + (skip ? 1 : 0);
    setSecretVotes(updated); setSkipVotes(updatedSkips); setCurrentSecretSelection([]);
    if (secretVoterIndex < activePlayers.length - 1) { setSecretVoterIndex(index => index + 1); setSecretStep('pass'); playWhoosh(); }
    else { finishBallot(updated, updatedSkips); triggerHaptic([80, 50, 120]); }
  };

  const beginRunoff = () => { setSecretVotes({}); setSkipVotes(0); setSecretVoterIndex(0); setCurrentSecretSelection([]); setSecretStep('pass'); playWhoosh(); };
  const rankedPlayers = useMemo(() => [...activePlayers].sort((a, b) => (secretVotes[b.id] || 0) - (secretVotes[a.id] || 0) || a.avatarSeed - b.avatarSeed), [activePlayers, secretVotes]);
  const confirmOpenVote = () => { if (selectedTargetIds.length === selectionCount) { triggerHaptic([60, 40, 100]); onEliminatePlayers(selectedTargetIds); } };

  return <div className="mx-auto w-full max-w-lg space-y-5 px-4 pb-24 pt-2">
    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400"><Vote className="h-4 w-4" /></span><div><h2 className="font-display text-lg font-black text-white">Accusation Phase</h2><p className="text-[11px] text-slate-400">Choose {selectionCount === 2 ? 'up to two suspects' : 'one suspect'} for ejection</p></div></div><button type="button" onClick={onReturnToClues} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"><RotateCcw className="h-3 w-3" /> Review clues</button></div>
    {selectionCount === 2 && <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">Double Ejection is active. Ranked candidates resolve one at a time. A tied slot can remain empty.</div>}
    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1"><button type="button" onClick={() => setVotingMethod('open')} className={`rounded-lg py-2 text-xs font-semibold ${votingMethod === 'open' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Open Accusation</button><button type="button" onClick={() => { setVotingMethod('secret'); resetSecretBallot(); }} className={`rounded-lg py-2 text-xs font-semibold ${votingMethod === 'secret' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Silent Ballot</button></div>

    {votingMethod === 'open' && <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-4 text-center shadow-lg">{countdownStep !== null ? <div className="space-y-2 py-6"><div className="font-display text-6xl font-black text-rose-400">{countdownStep > 0 ? countdownStep : 'POINT!'}</div><p className="text-xs text-slate-400">Point together, then discuss the final ranking.</p></div> : <div className="flex flex-col items-center justify-between gap-3 text-left sm:flex-row"><div><p className="flex items-center gap-1.5 text-xs font-bold text-slate-100"><Zap className="h-3.5 w-3.5 text-rose-400" /> Simultaneous Finger-Point</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Point together, discuss the result, then select below.</p></div><button type="button" onClick={handleStartCountdown} className="cipher-button-primary w-full sm:w-auto"><Zap className="h-4 w-4" /> 3-2-1 Point</button></div>}</div>
      <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-300">Select {selectionCount}. Selection order determines who is revealed first.</p>
      <PlayerChoices players={activePlayers} selectedIds={selectedTargetIds} onSelect={id => toggleSelection(id, selectedTargetIds, setSelectedTargetIds)} />
      {selectedTargetIds.length > 0 && <div className="rounded-2xl border border-rose-500/40 bg-[#160c10] p-5 text-center"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-300">Ejection queue</p><h3 className="mt-2 font-display text-xl font-bold text-slate-100">{selectedTargetIds.map((id, index) => `${index + 1}. ${activePlayers.find(player => player.id === id)?.name}`).join('  ·  ')}</h3><button type="button" disabled={selectedTargetIds.length !== selectionCount} onClick={confirmOpenVote} className="cipher-button-primary mt-4 w-full disabled:opacity-30">Confirm {selectionCount === 2 ? 'both ejections' : 'ejection'}</button></div>}
      {allowSkip && !confirmOpenSkip && <button type="button" onClick={()=>setConfirmOpenSkip(true)} className="cipher-button-ghost w-full"><FastForward className="h-4 w-4" /> Skip this vote</button>}
      {confirmOpenSkip&&<div className="vote-confirmation"><p className="cipher-eyebrow">Confirm skip</p><h3 className="mt-2 font-display text-2xl font-black">Move on without an ejection?</h3><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>setConfirmOpenSkip(false)} className="cipher-button-secondary">Cancel</button><button onClick={onSkipVote} className="cipher-button-primary">Confirm skip</button></div></div>}
    </div>}

    {votingMethod === 'secret' && <div className="space-y-4">
      {secretStep === 'pass' && currentVoter && <div className="cipher-panel space-y-4 p-6 text-center"><p className="cipher-kicker">{isRunoff ? `Private runoff · voter ${secretVoterIndex + 1}` : `Voter ${secretVoterIndex + 1} of ${activePlayers.length}`}</p><PlayerAvatar name={currentVoter.name} src={currentVoter.avatarPhoto} className="mx-auto h-20 w-20" /><h3 className="font-display text-2xl font-bold text-slate-100">Pass to {currentVoter.name}</h3><p className="text-xs text-slate-400">{isRunoff ? 'Choose one tied suspect. The runoff stays silent.' : `Choose ${selectionCount} suspect${selectionCount === 2 ? 's' : ''}, or skip, in private.`}</p><button type="button" onClick={() => setSecretStep('vote')} className="cipher-button-secondary w-full"><EyeOff className="h-4 w-4" /> Open private ballot</button></div>}
      {secretStep === 'vote' && currentVoter && <div className="space-y-3"><div className="flex justify-between text-xs text-slate-400"><span>{currentVoter.name}'s ballot</span><span className="font-mono text-rose-400">SELECT {requiredSelections}</span></div><PlayerChoices players={availableCandidates} selectedIds={currentSecretSelection} disabledId={currentVoter.id} onSelect={id => toggleSelection(id, currentSecretSelection, setCurrentSecretSelection, requiredSelections)} /><button type="button" disabled={currentSecretSelection.length !== requiredSelections} onClick={() => { setPendingSkip(false); setSecretStep('confirm'); }} className="cipher-button-primary w-full disabled:opacity-30">Review private vote</button>{allowSkip && !isRunoff && <button type="button" onClick={() => { setPendingSkip(true); setSecretStep('confirm'); }} className="cipher-button-ghost w-full"><FastForward className="h-4 w-4" /> Skip ballot</button>}</div>}
      {secretStep === 'confirm' && currentVoter && <section className="vote-confirmation"><p className="cipher-eyebrow">Check your ballot</p><h3 className="mt-3 font-display text-3xl font-black">{pendingSkip ? 'Submit a blank ballot?' : 'Confirm your vote?'}</h3><p className="mt-3 text-sm text-[var(--muted)]">{pendingSkip ? 'You are choosing not to accuse anyone.' : currentSecretSelection.map((id, index) => `${requiredSelections > 1 ? `${index + 1}. ` : ''}${activePlayers.find(player => player.id === id)?.name}`).join('  ·  ')}</p><div className="mt-6 grid grid-cols-2 gap-2"><button className="cipher-button-secondary" onClick={() => setSecretStep('vote')}>Change</button><button className="cipher-button-primary" onClick={() => handleSecretVoteSubmit(pendingSkip)}>{pendingSkip ? 'Confirm skip' : 'Confirm vote'}</button></div></section>}
      {secretStep === 'results' && <div className="cipher-panel space-y-4 p-5 text-center"><p className="cipher-kicker">{isRunoff ? 'Runoff result' : `Ballot results · ${skipVotes} skipped`}</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{rankedPlayers.map(player => { const selected = lockedTargetIds.includes(player.id); const votes = secretVotes[player.id] || 0; return <div key={player.id} className={`rounded-2xl border p-2 text-center ${selected ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-white/[0.06] text-slate-300'}`}><PlayerAvatar name={player.name} src={player.avatarPhoto} className="mx-auto aspect-square w-full border border-white/10 text-lg" /><span className="mt-2 block truncate text-[11px] font-bold">{player.name}</span><span className="mt-0.5 block font-mono text-[9px] text-slate-400">{votes} vote{votes === 1 ? '' : 's'}</span></div>; })}</div>
        {runoffCandidateIds && ballotOutcome === 'pending' ? <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200"><p><AlertTriangle className="mr-1 inline h-4 w-4" /> The cutoff is tied. Run one private ballot among the tied suspects.</p><button type="button" onClick={beginRunoff} className="cipher-button-secondary w-full">Begin silent runoff</button></div> : ballotOutcome === 'eject' ? <button type="button" onClick={() => onEliminatePlayers(lockedTargetIds)} className="cipher-button-primary w-full">Reveal ejection queue</button> : <div className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-200"><p>{ballotOutcome === 'skipped' ? 'At least half the table skipped. Nobody is ejected.' : ballotOutcome === 'deadlock' ? 'The runoff is still tied. The tied slot stays empty.' : 'No suspect received the minimum two votes. Nobody is ejected.'}</p><button type="button" onClick={lockedTargetIds.length ? () => onEliminatePlayers(lockedTargetIds) : onSkipVote} className="cipher-button-secondary w-full">{lockedTargetIds.length ? 'Reveal confirmed ejection' : 'Continue to next clue round'}</button></div>}
      </div>}
    </div>}
  </div>;
};

const PlayerChoices = ({ players, selectedIds, disabledId, onSelect }: { players: Player[]; selectedIds: string[]; disabledId?: string; onSelect: (id: string) => void; }) => <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{players.map(player => { const selectedIndex = selectedIds.indexOf(player.id); const disabled = player.id === disabledId; return <button key={player.id} type="button" disabled={disabled} onClick={() => onSelect(player.id)} className={`relative rounded-2xl border p-2 text-center disabled:cursor-not-allowed disabled:opacity-25 ${selectedIndex >= 0 ? 'border-rose-500 bg-[#160c10] shadow-[0_0_20px_rgba(244,63,94,0.12)]' : 'border-white/[0.08] bg-[#0c101a]'}`}><PlayerAvatar name={player.name} src={player.avatarPhoto} className="aspect-square w-full border border-white/10 text-xl" />{selectedIndex >= 0 && <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#160c10] bg-rose-500 text-[11px] font-black text-white">{selectedIds.length > 1 ? selectedIndex + 1 : <Check className="h-3.5 w-3.5" />}</span>}<span className="mt-2 block truncate text-[11px] font-bold text-slate-100">{player.name}</span>{disabled && <span className="mt-0.5 block text-[8px] font-mono uppercase text-slate-500">Your ballot</span>}</button>; })}</div>;
