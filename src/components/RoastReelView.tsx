import React, { useState } from 'react';
import {
  Flame, Sparkles, Copy, Check, Share2, Volume2,
  Trophy, Shield, AlertTriangle
} from 'lucide-react';
import { MatchSummary, Player } from '../types';
import {
  formatRoastReelText, generateMatchRoastReel, MatchRoastReel, RoastAward
} from '../utils/roastEngine';
import { PlayerAvatar } from './PlayerAvatar';
import { getRoleDefinition } from '../data/roleCatalog';
import { triggerHaptic } from '../utils/soundEffects';

interface RoastReelViewProps {
  players: Player[];
  matchSummary: MatchSummary;
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  onOpenShareCard: () => void;
  onOpenSoundboard: () => void;
}

const accentStyles: Record<RoastAward['accent'], { border: string; bg: string; badge: string; text: string }> = {
  gold: { border: 'border-amber-400/40', bg: 'bg-amber-400/[0.06]', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30', text: 'text-amber-300' },
  coral: { border: 'border-[#ff6846]/40', bg: 'bg-[#ff6846]/[0.06]', badge: 'bg-[#ff6846]/20 text-[#ff8065] border-[#ff6846]/30', text: 'text-[#ff8065]' },
  rose: { border: 'border-rose-500/40', bg: 'bg-rose-500/[0.06]', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'text-rose-300' },
  amber: { border: 'border-amber-500/40', bg: 'bg-amber-500/[0.06]', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-300' },
  emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.06]', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-300' },
  purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/[0.06]', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', text: 'text-purple-300' }
};

export const RoastReelView: React.FC<RoastReelViewProps> = ({
  players,
  matchSummary,
  trueCitizenWord,
  decoyWord,
  categoryName,
  onOpenShareCard,
  onOpenSoundboard
}) => {
  const [copied, setCopied] = useState(false);
  const reel: MatchRoastReel = React.useMemo(
    () => generateMatchRoastReel(players, matchSummary, trueCitizenWord, decoyWord),
    [players, matchSummary, trueCitizenWord, decoyWord]
  );

  const handleCopyChatText = async () => {
    const text = formatRoastReelText(reel, matchSummary, categoryName, trueCitizenWord, decoyWord);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      triggerHaptic([40, 40]);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Vibe banner */}
      <section className="relative overflow-hidden rounded-[24px] border-2 border-[var(--ink)] bg-[var(--paper)] p-5 text-[var(--ink)] shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)] bg-[var(--canvas)] px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider text-[var(--coral)]">
              <Flame className="h-3 w-3" /> {reel.vibeTag}
            </span>
            <h3 className="mt-3 font-display text-2xl font-black tracking-tight leading-tight">
              Post-Game Roast Reel
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
              {reel.matchVibe}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSoundboard}
            className="flex items-center gap-1.5 rounded-full border-2 border-[var(--ink)] bg-[var(--coral)] text-white px-3 py-1.5 text-xs font-black shadow hover:opacity-90 active:scale-95 transition-all"
            title="Play soundboard effects during recap"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Soundboard</span>
          </button>
        </div>

        {/* Action strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--ink)]/10">
          <button
            type="button"
            onClick={handleCopyChatText}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--ink)] bg-[var(--canvas)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-[var(--ink)]" />}
            <span className="text-[var(--ink)]">{copied ? 'Copied to clipboard!' : 'Copy Roast Reel for Group Chat'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenShareCard}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--ink)] bg-[var(--canvas)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-[var(--ink)]" />
            <span className="text-[var(--ink)]">Share Story Card</span>
          </button>
        </div>
      </section>

      {/* Awards list */}
      <div className="space-y-3">
        {reel.awards.map((award, index) => {
          const style = accentStyles[award.accent];
          const roleDef = getRoleDefinition(award.playerRole);
          return (
            <article
              key={award.id}
              className={`rounded-[22px] border-2 border-[var(--ink)] bg-[var(--canvas)] p-4 shadow-sm transition-all hover:translate-y-[-1px]`}
            >
              {/* Top row: Badge & Spiciness */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-2.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black uppercase tracking-wider text-[var(--ink)]">
                  {award.badge}
                </span>
                <div className="flex items-center gap-1 text-xs" title={`Spiciness: ${award.spiciness}/3`}>
                  {Array.from({ length: award.spiciness }).map((_, i) => (
                    <span key={i} role="img" aria-label="chili">🌶️</span>
                  ))}
                  <span className="ml-1 text-[10px] font-mono text-[var(--muted)]">
                    {award.statLabel}
                  </span>
                </div>
              </div>

              {/* Player Profile & Award Title */}
              <div className="mt-3 flex items-start gap-3">
                <div className="relative shrink-0">
                  <PlayerAvatar
                    name={award.playerName}
                    src={award.playerPhoto}
                    className="h-12 w-12 border-2 border-[var(--ink)] text-sm shadow-sm"
                  />
                  <img
                    src={roleDef.image}
                    alt=""
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-[var(--ink)] bg-white object-contain p-0.5"
                    title={roleDef.name}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-display text-base font-black text-[var(--ink)] truncate">
                      {award.title}
                    </h4>
                    <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted)]">
                      {award.playerName}
                    </span>
                  </div>
                  <p className="font-display text-xs font-bold text-[var(--coral)] mt-0.5 leading-snug">
                    "{award.headline}"
                  </p>
                </div>
              </div>

              {/* Roast commentary */}
              <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed bg-[var(--paper)] rounded-xl border border-[var(--ink)]/10 p-2.5">
                {award.commentary}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
};
