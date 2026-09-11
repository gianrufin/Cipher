import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, Flame, Trophy, RotateCcw, ArrowRight, 
  HelpCircle, AlertTriangle, Sparkles, Check, X, Users, ShieldAlert
} from 'lucide-react';
import { Player, MatchSummary } from '../types';
import { playElimination, playVictory, playImposterWin, triggerHaptic } from '../utils/soundEffects';

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

export const EliminationAndOutcome: React.FC<EliminationAndOutcomeProps> = ({
  eliminatedPlayer,
  players,
  trueCitizenWord,
  decoyWord,
  categoryName,
  roundsPlayed,
  onNextRound,
  onGameOver
}) => {
  // Sub-phases: 'reveal' | 'last_stand'
  const [subPhase, setSubPhase] = useState<'reveal' | 'last_stand'>('reveal');
  const [imposterGuess, setImposterGuess] = useState('');

  const isImposter = eliminatedPlayer.role === 'imposter';

  // Compute remaining alive players
  const remainingPlayers = players.filter(p => !p.isEliminated && p.id !== eliminatedPlayer.id);
  const remainingImposters = remainingPlayers.filter(p => p.role === 'imposter');
  const remainingCitizens = remainingPlayers.filter(p => p.role === 'citizen');
  const totalImposters = players.filter(p => p.role === 'imposter').length;

  // Trigger elimination sound on mount
  React.useEffect(() => {
    playElimination();
    triggerHaptic([100, 50, 150]);
  }, []);

  const handleProceedFromReveal = () => {
    if (isImposter) {
      // Imposter gets the Last Stand guess opportunity!
      setSubPhase('last_stand');
      triggerHaptic(30);
    } else {
      // An innocent citizen was eliminated! Check win conditions:
      if (remainingImposters.length >= remainingCitizens.length) {
        // Imposters outnumber or equal citizens -> Imposter Win!
        playImposterWin();
        const impostersCaught = players.filter(p => p.role === 'imposter' && p.isEliminated).length;
        onGameOver({
          roundsPlayed,
          impostersCaughtThisMatch: impostersCaught,
          totalImposters,
          winner: 'imposters',
          winReason: 'The Imposters have seized control! Innocent citizens were eliminated.'
        });
      } else {
        // Game continues with next round
        onNextRound();
      }
    }
  };

  const handleLastStandGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = imposterGuess.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTarget = trueCitizenWord.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Imposter caught count including this one
    const impostersCaughtSoFar = players.filter(p => p.role === 'imposter' && (p.isEliminated || p.id === eliminatedPlayer.id)).length;

    if (cleanGuess === cleanTarget) {
      // Imposter guessed correctly! Imposter victory!
      playImposterWin();
      triggerHaptic([60, 40, 100]);
      onGameOver({
        roundsPlayed,
        impostersCaughtThisMatch: impostersCaughtSoFar,
        totalImposters,
        winner: 'imposters',
        winReason: `The Imposter correctly deduced the Citizen word ("${trueCitizenWord}") in their Last Stand!`
      });
    } else {
      // Imposter guessed wrong!
      if (remainingImposters.length === 0) {
        // All imposters eliminated! Citizens win!
        playVictory();
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        onGameOver({
          roundsPlayed,
          impostersCaughtThisMatch: totalImposters,
          totalImposters,
          winner: 'citizens',
          winReason: 'All Imposters have been unmasked and eliminated without guessing the secret word!'
        });
      } else if (remainingImposters.length >= remainingCitizens.length) {
        playImposterWin();
        onGameOver({
          roundsPlayed,
          impostersCaughtThisMatch: impostersCaughtSoFar,
          totalImposters,
          winner: 'imposters',
          winReason: 'Imposters equal or outnumber remaining citizens.'
        });
      } else {
        // More rounds needed!
        onNextRound();
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-6 animate-fadeIn">
      {/* 1. IDENTITY REVEAL PHASE */}
      {subPhase === 'reveal' && (
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-6 shadow-xl space-y-4">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              Accusation Outcome
            </span>

            <h2 className="font-display text-3xl font-bold text-slate-100">
              {eliminatedPlayer.name}
            </h2>

            <div className="py-3">
              {isImposter ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 font-display font-bold text-sm tracking-wider uppercase">
                  <Flame className="h-4 w-4 text-rose-400" />
                  <span>Confirmed Imposter</span>
                </div>
              ) : eliminatedPlayer.isDoubleAgentDecoy ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-display font-bold text-sm tracking-wider uppercase">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>Citizen (Double-Agent Decoy)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-display font-bold text-sm tracking-wider uppercase">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Innocent Citizen</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isImposter
                ? `Accusation was correct! However, ${eliminatedPlayer.name} is granted one final guess at the Citizen secret word to steal victory.`
                : eliminatedPlayer.isDoubleAgentDecoy
                ? `${eliminatedPlayer.name} was an innocent Citizen! However, they were playing under Double-Agent Decoy paranoia, doubting their own clues and appearing suspicious to the group.`
                : `An innocent citizen was eliminated. The remaining players must quickly evaluate if the imposters now hold majority.`}
            </p>

            <button
              id="proceed-reveal-btn"
              type="button"
              onClick={handleProceedFromReveal}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
            >
              {isImposter ? "Proceed to Last Stand Guess" : "Evaluate Round Condition"}
            </button>
          </div>
        </div>
      )}

      {/* 2. THE IMPOSTER'S LAST STAND (WORD GUESS) */}
      {subPhase === 'last_stand' && (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-amber-500/30 bg-[#160c10] p-6 shadow-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              <span>THE LAST STAND</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-100">
              {eliminatedPlayer.name}, guess the Citizen Word!
            </h2>

            <p className="text-xs text-amber-200/80 max-w-xs mx-auto leading-relaxed">
              Category: <strong className="text-white">{categoryName}</strong>. If you correctly deduce the Citizens' word, Imposters steal the match victory!
            </p>

            <form onSubmit={handleLastStandGuess} className="space-y-3 pt-2">
              <input
                id="imposter-guess-input"
                type="text"
                placeholder="Enter exact secret word..."
                value={imposterGuess}
                onChange={(e) => setImposterGuess(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-white/[0.1] bg-slate-950/90 px-4 py-3 text-center font-display font-bold text-base text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />

              <button
                id="submit-imposter-guess-btn"
                type="submit"
                disabled={!imposterGuess.trim()}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] disabled:opacity-40"
              >
                Submit Guess & Reveal Outcome
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
