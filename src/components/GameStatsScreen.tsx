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
  const imposterWinPercent = Math.round((sessionStats.imposterWins / totalSessionGames) * 100);
  const anarchistWinPercent = Math.round(((sessionStats.anarchistWins || 0) / totalSessionGames) * 100);
  const winnerTitle = winner === 'citizens'
    ? 'CITIZENS VICTORY'
    : winner === 'imposters'
    ? 'IMPOSTERS VICTORY'
    : 'ANARCHIST VICTORY';

  return (
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 space-y-5 animate-fadeIn">
      {/* 1. Final Outcome Banner */}
      <div
        className={`rounded-2xl border p-6 shadow-xl text-center space-y-4 ${
          winner === 'citizens'
            ? 'border-emerald-500/30 bg-[#0a1410]'
            : winner === 'anarchist'
            ? 'border-amber-500/30 bg-[#171207]'
            : 'border-rose-500/30 bg-[#160c10]'
        }`}
      >
        <div className="flex justify-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
              winner === 'citizens'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : winner === 'anarchist'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {winner === 'citizens' ? <Trophy className="h-7 w-7" /> : <Flame className="h-7 w-7" />}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400">
            Mission Debrief
          </span>
          <h1 className="font-display text-3xl font-bold text-slate-100 mt-0.5">
            {winnerTitle}
          </h1>
          <p className="text-xs text-slate-300/90 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {winReason}
          </p>
        </div>

        {/* Word Reveal Comparison */}
        <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-left">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block mb-0.5">
              Citizen Secret Word
            </span>
            <span className="font-display font-bold text-base text-white">
              {trueCitizenWord}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20">
            <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-0.5">
              {decoyWord ? 'Imposter Decoy Word' : 'Category'}
            </span>
            <span className="font-display font-bold text-base text-white">
              {decoyWord || categoryName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH STATS SUMMARY */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-slate-100">Game Stats Summary</h2>
              <p className="text-[11px] text-slate-400">Match recap and session performance</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/[0.08] px-2.5 py-1 rounded-md">
            Match #{sessionStats.gamesPlayed}
          </span>
        </div>

        {/* Highlight Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Rounds Played in this Game */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Rounds Played</span>
            </div>
            <span className="font-display text-3xl font-bold text-slate-100 tracking-tight">
              {roundsPlayed}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {roundsPlayed === 1 ? 'Single round decision' : `${roundsPlayed} rounds to resolution`}
            </span>
          </div>

          {/* Imposters Caught in this Game */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Target className="h-3.5 w-3.5 text-rose-400" />
              <span>Imposters Caught</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-rose-400 tracking-tight">
                {impostersCaughtThisMatch}
              </span>
              <span className="text-xs font-display text-slate-500 font-semibold">
                / {totalImposters}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {impostersCaughtThisMatch === totalImposters ? 'All imposters unmasked' : 'Imposter infiltrated'}
            </span>
          </div>
        </div>

        {/* 3. SESSION STATS CARD (Total Imposters Caught across session) */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Session Aggregate</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">All games played</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Caught</span>
              <span className="font-display text-xl font-bold text-rose-300">
                {sessionStats.totalImpostersCaught}
              </span>
              <span className="text-[9px] text-slate-500 block">Imposters</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rounds</span>
              <span className="font-display text-xl font-bold text-amber-300">
                {sessionStats.totalRoundsPlayed}
              </span>
              <span className="text-[9px] text-slate-500 block">Total Clues</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Matches</span>
              <span className="font-display text-xl font-bold text-slate-200">
                {sessionStats.gamesPlayed}
              </span>
              <span className="text-[9px] text-slate-500 block">Completed</span>
            </div>
          </div>

          {/* Citizen vs Imposter Win Ratio Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-emerald-400">Citizens: {sessionStats.citizenWins} ({citizenWinPercent}%)</span>
              <span className="text-rose-400">Imposters: {sessionStats.imposterWins} ({imposterWinPercent}%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${citizenWinPercent}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${imposterWinPercent}%` }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${anarchistWinPercent}%` }}
              />
            </div>
            {(sessionStats.anarchistWins || 0) > 0 && (
              <p className="text-right text-[10px] font-mono text-amber-400">Anarchist: {sessionStats.anarchistWins} ({anarchistWinPercent}%)</p>
            )}
          </div>
        </div>

        {/* 4. Player Roles & Elimination Status Recap */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
            Player Roster & Assigned Words
          </span>
          <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
            {players.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  {p.isEliminated ? (
                    <span className="text-[9px] text-rose-400 font-mono">
                      [Eliminated]
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-mono">
                      [Survived]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                    "{p.secretWord || 'None'}"
                  </span>
                  <span
                    className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      p.role === 'imposter'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : p.isDoubleAgentDecoy
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {p.isDoubleAgentDecoy ? 'PARANOID CITIZEN' : p.role.replace('_', ' ').toUpperCase()}
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
          <div className="rounded-xl border border-rose-500/30 bg-[#160c10] p-3 text-xs text-rose-200 space-y-2">
            <p>Clear all session statistics (rounds played & imposters caught)?</p>
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
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-lg bg-white/[0.06] text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Sticky Action Buttons: Rematch or New Players */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#090d16]/95 border-t border-white/[0.08] backdrop-blur-md">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            id="stats-rematch-btn"
            type="button"
            onClick={onRematch}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Rematch (Same Players)</span>
          </button>

          <button
            id="stats-new-game-btn"
            type="button"
            onClick={onNewGame}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-semibold text-xs border border-white/[0.08] transition-colors"
          >
            Change Setup & Roster
          </button>
        </div>
      </div>
    </div>
  );
};
