import React from 'react';
import { ArrowRight, Smartphone, Users } from 'lucide-react';

export const GameModeScreen = ({ onLocal, onOnline }: { onLocal: () => void; onOnline: () => void }) => (
  <div className="mx-auto w-full max-w-lg px-4 py-12">
    <p className="cipher-kicker">Case file 001 / connection</p>
    <h1 className="mt-3 font-display text-5xl font-black tracking-[-.05em] text-stone-50">How is your crew playing?</h1>
    <p className="mt-4 max-w-md text-sm leading-6 text-stone-500">Use one phone around the table, or let every player cast a private ballot from their own device.</p>
    <div className="mt-8 grid gap-4">
      <button type="button" onClick={onLocal} className="cipher-panel evidence-note flex items-center gap-4 p-5 text-left"><span className="role-icon role-amber"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-lg text-stone-100">Pass and play</strong><small className="mt-1 block text-stone-500">Full game on one device. Works completely offline after loading.</small></span><ArrowRight className="h-5 w-5 text-stone-500" /></button>
      <button type="button" onClick={onOnline} className="cipher-panel evidence-note flex items-center gap-4 p-5 text-left"><span className="role-icon role-sky"><Smartphone className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-lg text-stone-100">Live room</strong><small className="mt-1 block text-stone-500">Host a same-Wi-Fi room and collect silent ballots on each phone.</small></span><ArrowRight className="h-5 w-5 text-stone-500" /></button>
    </div>
  </div>
);
