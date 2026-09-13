import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
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
          {ROLE_CATALOG.map(role => <button key={role.id} onClick={() => setSelected(role)} className="role-archive-card text-left">
            <img src={role.image} alt="" loading="lazy" /><span className="cipher-kicker">{role.alignment}</span><strong>{role.name}</strong><small>{role.summary}</small>
          </button>)}
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

const RoleSheet = ({ role, onClose }: { role: RoleDefinition; onClose: () => void }) => <div className="fixed inset-0 z-[110] flex items-end bg-black/55" onClick={onClose}>
  <article className="role-sheet mx-auto w-full max-w-lg" onClick={event => event.stopPropagation()}>
    <button onClick={onClose} className="cipher-icon-button absolute right-5 top-5" aria-label="Close role"><X className="h-4 w-4" /></button>
    <img src={role.image} alt={`Illustration of the ${role.name} role`} className="role-sheet-art" />
    <p className="cipher-eyebrow mt-5">{role.alignment} · {role.complexity}</p>
    <h2 className="mt-2 font-display text-4xl font-black">{role.name}</h2>
    <p className="mt-3 text-sm font-semibold leading-6">{role.summary}</p>
    <dl className="role-facts mt-6">
      <div><dt>You know</dt><dd>{role.knows}</dd></div><div><dt>Your power</dt><dd>{role.power}</dd></div><div><dt>You win when</dt><dd>{role.wins}</dd></div><div><dt>Best with</dt><dd>{role.recommended}</dd></div>
    </dl>
  </article>
</div>;
