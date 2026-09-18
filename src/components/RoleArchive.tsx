import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X, Trophy, ShieldCheck, Zap } from 'lucide-react';
import { ROLE_CATALOG, RoleDefinition } from '../data/roleCatalog';

export const RoleArchive = ({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) => {
  const [selected, setSelected] = useState<RoleDefinition>();
  return (
    <section className={embedded ? '' : 'fixed inset-0 z-[90] overflow-y-auto bg-[var(--canvas)]'}>
      <div className={embedded ? '' : 'mx-auto min-h-full w-full max-w-lg px-5 pb-20 pt-5'}>
        {!embedded && <header className="flex items-center justify-between"><button onClick={onClose} className="cipher-icon-button" aria-label="Close roles"><ArrowLeft className="h-5 w-5" /></button><span className="cipher-eyebrow">Role archive</span><span className="w-11" /></header>}
        <div className={embedded ? '' : 'mt-10'}>
          <p className="cipher-eyebrow">Know the cast</p>
          <h2 className="mt-2 font-display text-4xl font-black tracking-[-.05em]">Every role has a tell.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">Learn what each player knows, what they can do, and how they win.</p>
        </div>
        <div className="role-archive-grid mt-7">
          {ROLE_CATALOG.map(role => (
            <button key={role.id} onClick={() => setSelected(role)} className="role-archive-card text-left relative group">
              <img src={role.image} alt="" loading="lazy" />
              <div className="mt-2.5 flex items-center justify-between gap-1">
                <span className="cipher-kicker">{role.alignment}</span>
                {role.id === 'anarchist' && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-300">
                    Staying Power
                  </span>
                )}
              </div>
              <strong>{role.name}</strong>
              <small>{role.summary}</small>
            </button>
          ))}
        </div>
      </div>
      {selected && <RoleSheet role={selected} onClose={() => setSelected(undefined)} />}
    </section>
  );
};

export const RoleInfoButton = ({ role }: { role: RoleDefinition }) => {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={event => { event.stopPropagation(); setOpen(true); }} className="role-mini" aria-label={`Learn about ${role.name}`}><img src={role.image} alt="" /></button>{open && <RoleSheet role={role} onClose={() => setOpen(false)} />}</>;
};

const RoleSheet = ({ role, onClose }: { role: RoleDefinition; onClose: () => void }) => createPortal(
  <div className="role-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="role-detail-title">
    <article className="role-sheet mx-auto w-full max-w-lg">
      <header className="role-sheet-header">
        <span className="cipher-eyebrow">Role archive</span>
        <button onClick={onClose} className="cipher-icon-button" aria-label="Close role">
          <X className="h-4 w-4" />
        </button>
      </header>
      <main className="role-sheet-content">
        <img src={role.image} alt={`Illustration of the ${role.name} role`} className="role-sheet-art" />
        <p className="cipher-eyebrow mt-5">{role.alignment} · {role.complexity}</p>
        <h2 id="role-detail-title" className="mt-2 font-display text-4xl font-black">{role.name}</h2>
        <p className="mt-3 text-sm font-semibold leading-6">{role.summary}</p>

        {role.id === 'anarchist' && (
          <div className="mt-6 rounded-2xl border-2 border-amber-500/40 bg-stone-900/90 p-4 shadow-lg text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-amber-300">
                  Staying Power & Win Conditions
                </h3>
              </div>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400">
                2-Phase Strategy
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-xl border border-amber-500/20 bg-stone-950/70 p-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
                  <strong className="text-xs font-black uppercase tracking-wide">
                    Phase 1: Solo Heist (Round 1)
                  </strong>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-stone-300">
                  Your primary goal is to bait the table into ejecting you in the <strong>very first vote</strong>. If you are the first player ejected, you steal the match immediately with a <strong>Solo Anarchist Victory</strong>!
                </p>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-stone-950/70 p-3">
                <div className="flex items-center gap-2 text-sky-300">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" />
                  <strong className="text-xs font-black uppercase tracking-wide">
                    Phase 2: Staying Power · Rogue Citizen (Round 2+)
                  </strong>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-stone-300">
                  If <strong>another player is ejected first</strong>, your game isn't lost and you are never left out of place. Your <em>Staying Power</em> mechanic instantly activates:
                </p>
                <ul className="mt-2 space-y-1.5 pl-4 text-xs leading-5 text-stone-400 list-disc">
                  <li>
                    <strong className="text-stone-200">Alignment Pivot:</strong> You smoothly transition into a <strong>Rogue Citizen</strong> fighting for the Citizen team.
                  </li>
                  <li>
                    <strong className="text-stone-200">Secret Word Advantage:</strong> Because you already know the true secret word, you can drop your deceptive clues and help steer the group with authentic evidence.
                  </li>
                  <li>
                    <strong className="text-stone-200">Shared Victory:</strong> You win alongside the Citizen team once all Imposters are successfully identified and ejected.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <dl className="role-facts mt-6">
          <div><dt>You know</dt><dd>{role.knows}</dd></div>
          <div><dt>Your power</dt><dd>{role.power}</dd></div>
          <div><dt>You win when</dt><dd>{role.wins}</dd></div>
          {role.id === 'anarchist' && (
            <div>
              <dt>Staying Power</dt>
              <dd>
                If another player is ejected first, you remain in play as a Rogue Citizen. Use your secret word knowledge to expose Imposters and share the Citizen victory.
              </dd>
            </div>
          )}
          <div><dt>Best with</dt><dd>{role.recommended}</dd></div>
        </dl>
      </main>
    </article>
  </div>,
  document.body
);
