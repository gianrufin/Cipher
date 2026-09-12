import React, { useEffect, useState } from 'react';
import { ArrowRight, Bomb, Flame, ScanSearch, Shield, Sparkles } from 'lucide-react';
import { MatchSummary, Player, RoleType } from '../types';
import { playElimination, playImposterWin, playVictory, triggerHaptic } from '../utils/soundEffects';

interface EliminationAndOutcomeProps {
  eliminatedPlayer: Player;
  players: Player[];
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  roundsPlayed: number;
  onNextRound: () => void;
  onGameOver: (summary: MatchSummary) => void;
}

const ROLE_LABELS: Record<RoleType, string> = {
  citizen: 'Citizen',
  imposter: 'Imposter',
  anarchist: 'Anarchist',
  inspector: 'Inspector',
  sleeper: 'Sleeper Agent',
  bodyguard: 'Bodyguard'
};

export const EliminationAndOutcome: React.FC<EliminationAndOutcomeProps> = ({
  eliminatedPlayer, players, trueCitizenWord, categoryName, roundsPlayed, onNextRound, onGameOver
}) => {
  const [subPhase, setSubPhase] = useState<'reveal' | 'last_stand' | 'inspector_guess'>('reveal');
  const [wordGuess, setWordGuess] = useState('');
  const [inspectorGuessId, setInspectorGuessId] = useState<string | null>(null);
  const remaining = players.filter(player => !player.isEliminated);
  const remainingImposters = remaining.filter(player => player.role === 'imposter');
  const remainingBadTeam = remaining.filter(player => player.role === 'imposter' || player.role === 'sleeper');
  const remainingCitizenTeam = remaining.filter(player => ['citizen', 'inspector', 'bodyguard'].includes(player.role));
  const livingInspector = remaining.find(player => player.role === 'inspector');
  const totalImposters = players.filter(player => player.role === 'imposter').length;
  const impostersCaught = players.filter(player => player.role === 'imposter' && player.isEliminated).length;

  useEffect(() => {
    playElimination();
    triggerHaptic([90, 45, 130]);
  }, []);

  const finish = (winner: MatchSummary['winner'], winReason: string, specialWinnerName?: string) => {
    if (winner === 'citizens') {
      playVictory();
    } else {
      playImposterWin();
    }
    onGameOver({ roundsPlayed, impostersCaughtThisMatch: impostersCaught, totalImposters, winner, winReason, specialWinnerName });
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
    if (eliminatedPlayer.role === 'anarchist') {
      finish('anarchist', `${eliminatedPlayer.name} baited the table into an elimination and wins alone.`, eliminatedPlayer.name);
      return;
    }
    if (eliminatedPlayer.role === 'imposter') {
      setSubPhase(livingInspector ? 'inspector_guess' : 'last_stand');
      triggerHaptic(30);
      return;
    }
    evaluateBoard();
  };

  const submitWordGuess = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean(wordGuess) === clean(trueCitizenWord)) {
      finish('imposters', `${eliminatedPlayer.name} decoded the Citizen word in the Last Stand.`);
    } else {
      evaluateBoard();
    }
  };

  const submitInspectorGuess = () => {
    if (!inspectorGuessId) return;
    if (inspectorGuessId === livingInspector?.id) {
      finish('imposters', `${eliminatedPlayer.name} correctly identified the Inspector and stole the victory.`);
    } else {
      evaluateBoard();
    }
  };

  const tone = eliminatedPlayer.role === 'imposter'
    ? 'text-rose-300 border-rose-400/30 bg-rose-400/10'
    : eliminatedPlayer.role === 'anarchist'
    ? 'text-amber-300 border-amber-400/30 bg-amber-400/10'
    : eliminatedPlayer.role === 'sleeper'
    ? 'text-violet-300 border-violet-400/30 bg-violet-400/10'
    : 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-7 sm:py-12 animate-fadeIn">
      {subPhase === 'reveal' && (
        <section className="cipher-panel p-6 sm:p-8 text-center">
          <p className="cipher-kicker">Vote locked / Identity exposed</p>
          <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-stone-300">
            {eliminatedPlayer.role === 'anarchist' ? <Bomb className="h-6 w-6" /> : eliminatedPlayer.role === 'imposter' ? <Flame className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-stone-50 mt-5">{eliminatedPlayer.name}</h1>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
            {ROLE_LABELS[eliminatedPlayer.role]}
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-400">
            {eliminatedPlayer.role === 'anarchist'
              ? 'The table walked into the wildcard trap.'
              : eliminatedPlayer.role === 'imposter'
              ? livingInspector
                ? 'A caught Imposter gets one chance to identify the hidden Inspector.'
                : 'A caught Imposter gets one final attempt to decode the Citizen word.'
              : eliminatedPlayer.role === 'sleeper'
              ? 'The table removed an undercover Imposter ally.'
              : 'The table eliminated a member of the Citizen team.'}
          </p>
          <button type="button" onClick={proceedFromReveal} className="cipher-button-primary w-full mt-7">
            Resolve outcome <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {subPhase === 'inspector_guess' && (
        <section className="cipher-panel p-6 sm:p-8">
          <div className="role-icon role-sky"><ScanSearch className="h-5 w-5" /></div>
          <p className="cipher-kicker mt-5">Counter-phase / Inspector hunt</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-stone-50 mt-2">Name the investigator.</h1>
          <p className="text-sm leading-6 text-stone-400 mt-3">Choose correctly to steal the match. A wrong read ends your counter-play.</p>
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
          <p className="text-sm leading-6 text-stone-400 mt-3">Category: <strong className="text-stone-200">{categoryName}</strong>. An exact guess steals the match.</p>
          <form onSubmit={submitWordGuess} className="mt-6 space-y-3">
            <input value={wordGuess} onChange={event => setWordGuess(event.target.value)} autoFocus placeholder="Enter the secret word" className="cipher-input w-full text-center" />
            <button type="submit" disabled={!wordGuess.trim()} className="cipher-button-primary w-full disabled:opacity-30">Submit final guess</button>
          </form>
        </section>
      )}
    </div>
  );
};
