import React from 'react';
import { Shield, Flame, Bomb, Clock, Users, ArrowRight } from 'lucide-react';
import { MatchHistoryRecord } from '../types';

interface MatchHistoryViewProps {
  history: MatchHistoryRecord[];
}

const outcomeMeta = {
  citizens: {
    label: 'Citizens',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: Shield,
    accent: 'text-emerald-400'
  },
  imposters: {
    label: 'Imposters',
    badge: 'bg-[#ff6846]/15 text-[#ff8065] border-[#ff6846]/30',
    icon: Flame,
    accent: 'text-[#ff8065]'
  },
  anarchist: {
    label: 'Wild Card',
    badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    icon: Bomb,
    accent: 'text-amber-300'
  }
};

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <section className="cipher-panel p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-stone-600 mb-2" />
        <h3 className="font-display text-lg font-bold text-stone-200">No match history yet</h3>
        <p className="mt-1 text-xs text-stone-500">
          Finish this game or play a rematch to record and review your table's last 5 matches.
        </p>
      </section>
    );
  }

  return (
    <section className="cipher-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <p className="cipher-kicker">Recent games</p>
          <h2 className="mt-1 font-display text-xl font-black text-stone-50">Match History</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-mono text-stone-400">
          Last {history.length} of 5
        </span>
      </div>

      <div className="space-y-3">
        {history.map((match, idx) => {
          const meta = outcomeMeta[match.winner];
          const Icon = meta.icon;
          const isLatest = idx === 0;

          // Format relative or compact timestamp
          const date = new Date(match.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <article
              key={match.id || `${match.timestamp}-${idx}`}
              className={`rounded-2xl border p-3.5 transition-all ${
                isLatest
                  ? 'border-white/20 bg-white/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.01]'
              }`}
            >
              {/* Header: Winner Badge + Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${meta.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{meta.label} won</span>
                  </span>
                  {isLatest && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300">
                      Latest
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-stone-500">{timeStr}</span>
              </div>

              {/* Category & Secret Words */}
              <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 border-t border-white/[0.06] pt-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    Category: <strong className="text-stone-300 font-sans normal-case">{match.categoryName}</strong>
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-display font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-lg">
                      {match.trueCitizenWord}
                    </span>
                    {match.decoyWord && (
                      <>
                        <span className="text-stone-600 text-[10px]">vs</span>
                        <span className="font-display font-bold text-[#ff8065] bg-[#ff6846]/10 border border-[#ff6846]/20 px-2 py-0.5 rounded-lg">
                          {match.decoyWord}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-[11px] text-stone-400">
                    <Users className="h-3 w-3 text-stone-500" />
                    <span>{match.playerCount} players</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500">
                    {match.roundsPlayed} {match.roundsPlayed === 1 ? 'round' : 'rounds'}
                  </span>
                </div>
              </div>

              {/* Summary win reason & top scorer if available */}
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-stone-400 bg-black/20 rounded-xl px-2.5 py-1.5 border border-white/[0.04]">
                <p className="truncate text-stone-400">
                  {match.winReason}
                </p>
                {match.topScorerName && (
                  <span className="shrink-0 text-[10px] font-mono text-amber-300">
                    MVP: {match.topScorerName} ({match.topScorerPoints}pts)
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
