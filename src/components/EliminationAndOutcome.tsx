import React, { useEffect, useState } from 'react';
import { ArrowRight, Bomb, ScanSearch, Sparkles } from 'lucide-react';
import { EjectionReveal, MatchSummary, Player } from '../types';
import {
  playBuzzer, playElimination, playGavel, playImposterWin,
  playSoloHeist, playVictory, triggerHaptic
} from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';

interface EliminationAndOutcomeProps {
  eliminatedPlayer: Player;
  players: Player[];
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  roundsPlayed: number;
  eliminationQueue: Player[];
  queueIndex: number;
  ejectionReveal: EjectionReveal;
  onContinueQueue: () => void;
  onNextRound: () => void;
  onGameOver: (summary: MatchSummary) => void;
}

export const EliminationAndOutcome: React.FC<EliminationAndOutcomeProps> = ({
  eliminatedPlayer, players, trueCitizenWord, categoryName, roundsPlayed,
  eliminationQueue, queueIndex, ejectionReveal, onContinueQueue, onNextRound, onGameOver
}) => {
  const [subPhase, setSubPhase] = useState<'reveal' | 'counter_handoff' | 'last_stand' | 'inspector_guess'>('reveal');
  const [wordGuess, setWordGuess] = useState('');
  const [inspectorGuessId, setInspectorGuessId] = useState<string | null>(null);
  const remaining = players.filter(player => !player.isEliminated);
  const remainingImposters = remaining.filter(player => player.role === 'imposter');
  const remainingBadTeam = remaining.filter(player => player.role === 'imposter' || player.role === 'sleeper');
  const remainingCitizenTeam = remaining.filter(player => ['citizen', 'decoy', 'inspector', 'bodyguard', 'anarchist'].includes(player.role));
  const livingInspector = remaining.find(player => player.role === 'inspector');
  const totalImposters = players.filter(player => player.role === 'imposter').length;
  const impostersCaught = players.filter(player => player.role === 'imposter' && player.isEliminated).length;
  const hasNextElimination = Boolean(eliminationQueue[queueIndex + 1]);
  const eliminatedQueuePlayers = eliminationQueue.filter(queued => players.find(player => player.id === queued.id)?.isEliminated);
  const counterImposter = [...eliminatedQueuePlayers].reverse().find(player => player.role === 'imposter');
  const totalPriorEliminations = players.filter(player => player.isEliminated && player.id !== eliminatedPlayer.id).length;
  const isFirstEjectionOfMatch = queueIndex === 0 && totalPriorEliminations === 0;
  const livingAnarchist = remaining.find(player => player.role === 'anarchist' && player.id !== eliminatedPlayer.id);
  const wildcardPivotNotice = Boolean(livingAnarchist && isFirstEjectionOfMatch);

  useEffect(() => {
    playGavel();
    setTimeout(() => playElimination(), 120);
    triggerHaptic([90, 45, 130]);
  }, []);

  const finish = (winner: MatchSummary['winner'], winReason: string, specialWinnerName?: string, bonusPlayerId?: string) => {
    if (winner === 'citizens') {
      playVictory();
    } else if (winner === 'anarchist') {
      playSoloHeist();
    } else {
      playImposterWin();
    }
    onGameOver({ roundsPlayed, impostersCaughtThisMatch: impostersCaught, totalImposters, winner, winReason, specialWinnerName, bonusPlayerId });
  };

  const evaluateBoard = () => {
    if (remainingImposters.length === 0) {
      finish('citizens', 'Every Imposter was identified and the final counter-play failed.');
    } else if (remainingBadTeam.length >= remainingCitizenTeam.length) {
      finish('imposters', 'The Imposter bloc now equals or outnumbers the remaining Citizen team.');
    } else {
      onNextRound();
    }
  };

  const proceedFromReveal = () => {
    if (eliminatedPlayer.role === 'anarchist' && isFirstEjectionOfMatch) {
      finish('anarchist', `${eliminatedPlayer.name} baited the table into the first elimination and wins alone.`, eliminatedPlayer.name);
      return;
    }
    if (remainingImposters.length === 0 && counterImposter) {
      setSubPhase(ejectionReveal === 'classified' ? 'counter_handoff' : livingInspector ? 'inspector_guess' : 'last_stand');
      triggerHaptic(30);
      return;
    }
    if (hasNextElimination) {
      onContinueQueue();
      return;
    }
    evaluateBoard();
  };

  const submitWordGuess = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean(wordGuess) === clean(trueCitizenWord)) {
      finish('imposters', `${counterImposter?.name || 'The final Imposter'} decoded the Citizen word in the Last Stand.`, undefined, counterImposter?.id);
    } else {
      playBuzzer();
      evaluateBoard();
    }
  };

  const submitInspectorGuess = () => {
    if (!inspectorGuessId) return;
    if (inspectorGuessId === livingInspector?.id) {
      setSubPhase('last_stand');
      setInspectorGuessId(null);
      triggerHaptic(30);
    } else {
      playBuzzer();
      finish('citizens', `${counterImposter?.name || 'The final Imposter'} failed to identify the Inspector.`);
    }
  };

  const publicAnarchistWin = eliminatedPlayer.role === 'anarchist' && isFirstEjectionOfMatch;
  const revealAlignment = ejectionReveal === 'confirm' || publicAnarchistWin;
  const isImposter = eliminatedPlayer.role === 'imposter';
  const isAnarchist = eliminatedPlayer.role === 'anarchist';
  const identityLabel = publicAnarchistWin
    ? 'WILD CARD (SOLO HEIST)'
    : !revealAlignment
    ? 'IDENTITY CLASSIFIED'
    : isImposter
    ? 'IMPOSTER'
    : isAnarchist
    ? 'WILD CARD (ROGUE CITIZEN)'
    : 'NOT AN IMPOSTER';
  const tone = !revealAlignment
    ? 'text-stone-300 border-white/15 bg-white/[0.04]'
    : isImposter
    ? 'text-rose-300 border-rose-400/30 bg-rose-400/10'
    : eliminatedPlayer.role === 'anarchist'
    ? 'text-amber-300 border-amber-400/30 bg-amber-400/10'
    : eliminatedPlayer.role === 'sleeper'
    ? 'text-violet-300 border-violet-400/30 bg-violet-400/10'
    : eliminatedPlayer.role === 'decoy'
    ? 'text-amber-300 border-amber-400/30 bg-amber-400/10'
    : 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-7 sm:py-12 animate-fadeIn">
      {subPhase === 'reveal' && (
        <section className="cipher-panel p-6 sm:p-8 text-center">
          <p className="cipher-kicker">Vote locked / Evidence filed</p>
          <PlayerAvatar name={eliminatedPlayer.name} src={eliminatedPlayer.avatarPhoto} className="mx-auto mt-6 h-28 w-28 border-2 border-white/10 text-3xl shadow-xl" />
          <h1 className="font-display text-4xl font-black tracking-tight text-stone-50 mt-5">{eliminatedPlayer.name}</h1>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
            {identityLabel}
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-400">
            {publicAnarchistWin
              ? 'The table walked into the wildcard trap — solo victory!'
              : isAnarchist
              ? `${eliminatedPlayer.name} was the Wild Card. Their first-ejection solo heist had expired, and they were playing as a Rogue Citizen.`
              : !revealAlignment
              ? `${eliminatedPlayer.name} was ejected. Their alignment and the remaining Imposter count stay classified until the debrief.`
              : isImposter
              ? `${eliminatedPlayer.name} was an Imposter. ${remainingImposters.length} Imposter${remainingImposters.length === 1 ? '' : 's'} remaining.`
              : `${eliminatedPlayer.name} was not an Imposter. ${remainingImposters.length} Imposter${remainingImposters.length === 1 ? '' : 's'} remaining.`}
          </p>
          {wildcardPivotNotice && (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                <Bomb className="h-4 w-4" />
                <span>Wild Card Solo Heist Expired</span>
              </div>
              <p className="mt-1.5 text-xs text-stone-300 leading-relaxed">
                With the first ejection locked, the Wild Card can no longer win alone. Any surviving Wild Card is now a <strong>Rogue Citizen</strong> fighting with the Citizen team to expose all Imposters!
              </p>
            </div>
          )}
          <button type="button" onClick={proceedFromReveal} className="cipher-button-primary w-full mt-7">
            {hasNextElimination ? `Reveal next: ${eliminationQueue[queueIndex + 1].name}` : 'Resolve outcome'} <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {subPhase === 'counter_handoff' && counterImposter && (
        <section className="cipher-panel p-6 sm:p-8 text-center">
          <p className="cipher-kicker">Private counter-action</p>
          <PlayerAvatar name={counterImposter.name} src={counterImposter.avatarPhoto} className="mx-auto mt-6 h-24 w-24" />
          <h1 className="font-display text-3xl font-black tracking-tight text-stone-50 mt-5">Pass to {counterImposter.name}</h1>
          <p className="text-sm leading-6 text-stone-400 mt-3">Shield the screen from the table. The final Imposter gets a private counter-play even when ejection identities are classified.</p>
          <button type="button" onClick={() => setSubPhase(livingInspector ? 'inspector_guess' : 'last_stand')} className="cipher-button-primary w-full mt-7">Open private counter-play <ArrowRight className="h-4 w-4" /></button>
        </section>
      )}

      {subPhase === 'inspector_guess' && (
        <section className="cipher-panel p-6 sm:p-8">
          <div className="role-icon role-sky"><ScanSearch className="h-5 w-5" /></div>
          <p className="cipher-kicker mt-5">Counter-phase / Inspector hunt</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-stone-50 mt-2">Name the investigator.</h1>
          <p className="text-sm leading-6 text-stone-400 mt-3">Choose correctly to unlock one final word guess. A wrong read gives Citizens the win.</p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            {remaining.map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => setInspectorGuessId(player.id)}
                className={`rounded-xl border p-3 text-left text-sm font-bold transition-all ${inspectorGuessId === player.id ? 'border-sky-400 bg-sky-400/10 text-sky-100' : 'border-white/10 bg-white/[0.02] text-stone-300'}`}
              >
                <span className="block text-[9px] font-mono text-stone-600 mb-1">SEAT {player.avatarSeed + 1}</span>
                {player.name}
              </button>
            ))}
          </div>
          <button type="button" disabled={!inspectorGuessId} onClick={submitInspectorGuess} className="cipher-button-primary w-full mt-5 disabled:opacity-30">
            Lock Inspector guess
          </button>
        </section>
      )}

      {subPhase === 'last_stand' && (
        <section className="cipher-panel p-6 sm:p-8">
          <div className="role-icon role-amber"><Sparkles className="h-5 w-5" /></div>
          <p className="cipher-kicker mt-5">Counter-phase / Last Stand</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-stone-50 mt-2">Decode the Citizen word.</h1>
          <p className="text-sm leading-6 text-stone-400 mt-3">Category: <strong className="text-stone-200">{categoryName}</strong>. An exact word guess wins the match.</p>
          <form onSubmit={submitWordGuess} className="mt-6 space-y-3">
            <input value={wordGuess} onChange={event => setWordGuess(event.target.value)} autoFocus placeholder="Enter the secret word" className="cipher-input w-full text-center" />
            <button type="submit" disabled={!wordGuess.trim()} className="cipher-button-primary w-full disabled:opacity-30">Submit final guess</button>
          </form>
        </section>
      )}
    </div>
  );
};
