import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, Flame, Trophy, RotateCcw, ArrowRight, 
  HelpCircle, AlertTriangle, Sparkles, Check, X, Users
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
          <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-4">
            <span className="text-xs uppercase font-mono text-slate-400 tracking-wider">
              Accusation Result
            </span>

            <h2 className="font-display text-3xl sm:text-4xl font-black text-white">
              {eliminatedPlayer.name}
            </h2>

            <div className="py-4">
              {isImposter ? (
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-rose-500/20 text-rose-300 border-2 border-rose-500/60 font-display font-black text-xl tracking-wider uppercase animate-bounce">
                  <Flame className="h-6 w-6 text-rose-500" />
                  <span>WAS AN IMPOSTER!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/60 font-display font-black text-xl tracking-wider uppercase">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  <span>WAS AN INNOCENT CITIZEN!</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isImposter
                ? `Great deduction! However, ${eliminatedPlayer.name} now has ONE chance to steal the win by guessing the Citizen word!`
                : `Oh no! An innocent player was voted out. Check if imposters have seized majority or if the game continues.`}
            </p>

            <button
              id="proceed-reveal-btn"
              type="button"
              onClick={handleProceedFromReveal}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-display font-bold text-sm tracking-wide shadow-lg shadow-rose-950/40 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              {isImposter ? "Proceed to Imposter's Last Stand" : "Check Game Condition"}
            </button>
          </div>
        </div>
      )}

      {/* 2. THE IMPOSTER'S LAST STAND (WORD GUESS) */}
      {subPhase === 'last_stand' && (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/80 to-slate-900 p-6 shadow-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>THE IMPOSTER'S LAST STAND</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              {eliminatedPlayer.name}, guess the Citizen Word!
            </h2>

            <p className="text-xs text-amber-200/90 max-w-xs mx-auto">
              Category: <strong className="text-white">{categoryName}</strong>. If you guess the Citizens' secret word correctly, the Imposters steal the win right now!
            </p>

            <form onSubmit={handleLastStandGuess} className="space-y-3 pt-2">
              <input
                id="imposter-guess-input"
                type="text"
                placeholder="Type your guess here..."
                value={imposterGuess}
                onChange={(e) => setImposterGuess(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-amber-500/50 bg-slate-950 px-4 py-3 text-center font-display font-bold text-lg text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />

              <button
                id="submit-imposter-guess-btn"
                type="submit"
                disabled={!imposterGuess.trim()}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-display font-black text-sm tracking-wider uppercase transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                Submit Final Guess & View Stats
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
