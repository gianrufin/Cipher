import React, { useState } from 'react';
import { 
  Trophy, Flame, RotateCcw, Users, Target, Clock, 
  BarChart3, RefreshCw, Sparkles, Shield, AlertTriangle
} from 'lucide-react';
import { Player, SessionStats, MatchSummary } from '../types';
import { triggerHaptic } from '../utils/soundEffects';

interface GameStatsScreenProps {
  players: Player[];
  matchSummary: MatchSummary;
  sessionStats: SessionStats;
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  onRematch: () => void;
  onNewGame: () => void;
  onResetSessionStats: () => void;
}

export const GameStatsScreen: React.FC<GameStatsScreenProps> = ({
  players,
  matchSummary,
  sessionStats,
  trueCitizenWord,
  decoyWord,
  categoryName,
  onRematch,
  onNewGame,
  onResetSessionStats
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    roundsPlayed,
    impostersCaughtThisMatch,
    totalImposters,
    winner,
    winReason
  } = matchSummary;

  const totalSessionGames = sessionStats.gamesPlayed || 1;
  const citizenWinPercent = Math.round((sessionStats.citizenWins / totalSessionGames) * 100);
  const imposterWinPercent = 100 - citizenWinPercent;

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-5 animate-fadeIn">
      {/* 1. Final Outcome Banner */}
      <div
        className={`rounded-3xl border-2 p-6 shadow-2xl text-center space-y-3 ${
          winner === 'citizens'
            ? 'border-emerald-500/80 bg-gradient-to-b from-emerald-950/80 via-slate-900 to-slate-950 shadow-emerald-950/50'
            : 'border-rose-500/80 bg-gradient-to-b from-rose-950/80 via-slate-900 to-slate-950 shadow-rose-950/50'
        }`}
      >
        <div className="flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              winner === 'citizens' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {winner === 'citizens' ? <Trophy className="h-8 w-8" /> : <Flame className="h-8 w-8" />}
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-slate-400">
            Final Condition Met
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white mt-1">
            {winner === 'citizens' ? 'CITIZENS VICTORY!' : 'IMPOSTERS VICTORY!'}
          </h1>
          <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
            {winReason}
          </p>
        </div>

        {/* Word Reveal Comparison */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-800/40">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block mb-0.5">
              Citizen True Word
            </span>
            <span className="font-display font-black text-base text-white">
              {trueCitizenWord}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-800/40">
            <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-0.5">
              {decoyWord ? 'Imposter Decoy Word' : 'Category'}
            </span>
            <span className="font-display font-black text-base text-white">
              {decoyWord || categoryName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH STATS SUMMARY (Number of rounds played, imposters caught) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">Game Stats Summary</h2>
              <p className="text-[11px] text-slate-400">Match recap and session deduction metrics</p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
            Game #{sessionStats.gamesPlayed}
          </span>
        </div>

        {/* Highlight Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Rounds Played in this Game */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Rounds Played</span>
            </div>
            <span className="font-display text-3xl font-black text-white tracking-tight">
              {roundsPlayed}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {roundsPlayed === 1 ? 'Single round decision' : `${roundsPlayed} clue cycles`}
            </span>
          </div>

          {/* Imposters Caught in this Game */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Target className="h-3.5 w-3.5 text-rose-400" />
              <span>Match Imposters</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-black text-rose-400 tracking-tight">
                {impostersCaughtThisMatch}
              </span>
              <span className="text-sm font-display text-slate-500 font-bold">
                / {totalImposters}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {impostersCaughtThisMatch === totalImposters ? 'All Imposters Caught' : 'Imposter Infiltrated'}
            </span>
          </div>
        </div>

        {/* 3. SESSION STATS CARD (Total Imposters Caught across session) */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Session Totals</span>
            </span>
            <span className="text-[11px] text-slate-400">All games tonight</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Caught</span>
              <span className="font-display text-xl font-black text-rose-300">
                {sessionStats.totalImpostersCaught}
              </span>
              <span className="text-[9px] text-slate-500 block">Imposters</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rounds</span>
              <span className="font-display text-xl font-black text-amber-300">
                {sessionStats.totalRoundsPlayed}
              </span>
              <span className="text-[9px] text-slate-500 block">Total Played</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Matches</span>
              <span className="font-display text-xl font-black text-sky-300">
                {sessionStats.gamesPlayed}
              </span>
              <span className="text-[9px] text-slate-500 block">Completed</span>
            </div>
          </div>

          {/* Citizen vs Imposter Win Ratio Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">Citizens: {sessionStats.citizenWins} ({citizenWinPercent}%)</span>
              <span className="text-rose-400 font-bold">Imposters: {sessionStats.imposterWins} ({imposterWinPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${citizenWinPercent}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${imposterWinPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Player Roles & Elimination Status Recap */}
        <div className="space-y-2 pt-1">
          <span className="text-xs uppercase font-mono font-bold text-slate-400 block">
            Player Roster & Secrets
          </span>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {players.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{p.name}</span>
                  {p.isEliminated ? (
                    <span className="text-[10px] text-rose-400 font-mono font-semibold">
                      [Eliminated]
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      [Survived]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                    "{p.secretWord || 'No Word'}"
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.role === 'imposter'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {p.role.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Session Stats Reset Option */}
      <div className="text-center pt-1">
        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset session statistics</span>
          </button>
        ) : (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-200 space-y-2">
            <p>Clear all session stats (rounds played & imposters caught)?</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetSessionStats();
                  setShowResetConfirm(false);
                  triggerHaptic(20);
                }}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                Yes, Reset Stats
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Sticky Action Buttons: Rematch or New Players */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-slate-800/40 backdrop-blur-md">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            id="stats-rematch-btn"
            type="button"
            onClick={onRematch}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-display font-extrabold text-sm shadow-lg shadow-rose-950/50 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>PLAY REMATCH (SAME PLAYERS)</span>
          </button>

          <button
            id="stats-new-game-btn"
            type="button"
            onClick={onNewGame}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs border border-slate-800 transition-colors"
          >
            Change Setup / Player Roster
          </button>
        </div>
      </div>
    </div>
  );
};
