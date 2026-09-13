import React, { useMemo, useState } from 'react';
import {
  Bomb, ChevronDown, Flame, RotateCcw, Share2,
  Shield, Trophy, Users
} from 'lucide-react';
import { MatchSummary, Player, PlayerCareerStats, SessionStats } from '../types';
import { ShareResultModal } from './ShareResultModal';

interface GameStatsScreenProps {
  players: Player[];
  matchSummary: MatchSummary;
  sessionStats: SessionStats;
  careerStats: Record<string, PlayerCareerStats>;
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  onRematch: () => void;
  onEditSetup: () => void;
}

const winnerMeta = {
  citizens: { title: 'Citizens win', icon: Shield, tone: 'text-emerald-300', panel: 'border-emerald-400/25 bg-emerald-400/[0.06]' },
  imposters: { title: 'Imposters win', icon: Flame, tone: 'text-[#ff8065]', panel: 'border-[#ff6846]/25 bg-[#ff6846]/[0.06]' },
  anarchist: { title: 'Anarchist wins', icon: Bomb, tone: 'text-amber-300', panel: 'border-amber-400/25 bg-amber-400/[0.06]' }
};

export const GameStatsScreen: React.FC<GameStatsScreenProps> = ({
  players, matchSummary, sessionStats, careerStats, trueCitizenWord, decoyWord,
  categoryName, onRematch, onEditSetup
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [wordFeedback, setWordFeedback] = useState<string>('');
  const meta = winnerMeta[matchSummary.winner];
  const WinnerIcon = meta.icon;
  const scores = matchSummary.playerScores || [];
  const standings = useMemo(
    () => Object.values(careerStats).sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins),
    [careerStats]
  );

  return (
    <>
      <div className="w-full max-w-lg mx-auto pb-36 pt-5 px-4 space-y-5 animate-fadeIn">
        <section className={`rounded-[28px] border p-6 text-center ${meta.panel}`}>
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-current/20 ${meta.tone}`}>
            <WinnerIcon className="h-6 w-6" />
          </div>
          <p className="cipher-kicker mt-5">Mission debrief</p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] text-stone-50">{meta.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-stone-400">{matchSummary.winReason}</p>
          <div className="mt-6 grid grid-cols-3 border-t border-white/[0.08] pt-5">
            <MiniStat value={players.length} label="Players" />
            <MiniStat value={matchSummary.roundsPlayed} label="Rounds" />
            <MiniStat value={`${matchSummary.impostersCaughtThisMatch}/${matchSummary.totalImposters}`} label="Caught" />
          </div>
          <button type="button" onClick={() => setShareOpen(true)} className="cipher-button-acid mt-6 w-full">
            <Share2 className="h-4 w-4" /> Create share card
          </button>
        </section>

        <section className="cipher-panel p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="cipher-kicker">Match points</p>
              <h2 className="mt-2 font-display text-2xl font-black text-stone-50">Tonight's leaderboard</h2>
            </div>
            <Trophy className="h-5 w-5 text-amber-300" />
          </div>

          <div className="mt-5 space-y-2">
            {scores.map((score, index) => (
              <button
                key={score.playerId}
                type="button"
                onClick={() => setExpandedScore(current => current === score.playerId ? null : score.playerId)}
                className={`w-full rounded-2xl border p-3.5 text-left ${index === 0 ? 'border-amber-300/25 bg-amber-300/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[10px] font-bold ${index === 0 ? 'bg-amber-300 text-stone-950' : 'bg-white/[0.06] text-stone-500'}`}>{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-100">{score.name}</p>
                    <p className="mt-0.5 text-[9px] font-mono uppercase tracking-wider text-stone-600">{score.role}</p>
                  </div>
                  <strong className="font-display text-xl text-stone-50">{score.points} <span className="text-[10px] text-stone-600">PTS</span></strong>
                  <ChevronDown className={`h-4 w-4 text-stone-600 transition-transform ${expandedScore === score.playerId ? 'rotate-180' : ''}`} />
                </div>
                {expandedScore === score.playerId && (
                  <div className="mt-3 border-t border-white/[0.07] pt-3 space-y-1">
                    {score.reasons.length ? score.reasons.map(reason => <p key={reason} className="text-[11px] text-stone-400">{reason}</p>) : <p className="text-[11px] text-stone-600">No points earned this match.</p>}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="cipher-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="cipher-kicker">Session standings</p>
              <h2 className="mt-2 font-display text-xl font-black text-stone-50">All-time on this device</h2>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-mono text-stone-500">{sessionStats.gamesPlayed} games</span>
          </div>
          <div className="mt-4 space-y-2">
            {standings.slice(0, 8).map((career, index) => (
              <div key={career.name.toLocaleLowerCase()} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-white/[0.06] py-3 last:border-0">
                <span className="font-mono text-[10px] text-stone-600">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-xs font-bold text-stone-200">{career.name}</p>
                  <p className="mt-1 text-[9px] text-stone-600">{career.wins} wins · {career.currentStreak} streak · best {career.bestStreak}</p>
                </div>
                <span className="font-display text-lg font-black text-[#ff8065]">{career.totalPoints}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            <p className="cipher-kicker">Citizen word</p>
            <p className="mt-2 font-display text-xl font-black text-stone-50">{trueCitizenWord}</p>
          </div>
          <div className="rounded-2xl border border-[#ff6846]/20 bg-[#ff6846]/[0.04] p-4">
            <p className="cipher-kicker">{decoyWord ? 'Decoy word' : 'Category'}</p>
            <p className="mt-2 font-display text-xl font-black text-stone-50">{decoyWord || categoryName}</p>
          </div>
        </section>

        <section className="cipher-panel p-5">
          <p className="cipher-kicker">Help tune your deck</p>
          <h2 className="mt-2 font-display text-xl font-black text-stone-50">How was this word pair?</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {['Good pair', 'Too similar', 'Too different', 'Seen before'].map(option => (
              <button key={option} aria-pressed={wordFeedback === option} onClick={() => {
                setWordFeedback(option);
                try {
                  const key = [trueCitizenWord, decoyWord].map(word => word.trim().toLowerCase()).sort().join('|');
                  const stored = JSON.parse(localStorage.getItem('cipher_word_feedback') || '{}');
                  localStorage.setItem('cipher_word_feedback', JSON.stringify({ ...stored, [key]: option }));
                } catch { /* feedback remains selected for this screen */ }
              }} className={`border-2 border-[var(--ink)] p-3 text-left text-xs font-black ${wordFeedback === option ? 'bg-[var(--coral)]' : 'bg-[var(--paper)]'}`}>{option}</button>
            ))}
          </div>
        </section>

      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#0b0b09]/92 p-4 backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
          <button type="button" onClick={onEditSetup} className="cipher-button-secondary"><Users className="h-4 w-4" /> Change setup</button>
          <button type="button" onClick={onRematch} className="cipher-button-primary"><RotateCcw className="h-4 w-4" /> Deal fresh words</button>
        </div>
      </div>

      <ShareResultModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        players={players}
        matchSummary={matchSummary}
        careerStats={careerStats}
        trueCitizenWord={trueCitizenWord}
        decoyWord={decoyWord}
        categoryName={categoryName}
      />
    </>
  );
};

const MiniStat = ({ value, label }: { value: string | number; label: string }) => (
  <div>
    <strong className="block font-display text-2xl font-black text-stone-50">{value}</strong>
    <span className="mt-1 block text-[9px] font-mono uppercase tracking-wider text-stone-600">{label}</span>
  </div>
);
