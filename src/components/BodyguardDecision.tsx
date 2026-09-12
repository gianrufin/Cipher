import React, { useState } from 'react';
import { ArrowRight, Shield, ShieldCheck } from 'lucide-react';
import { Player } from '../types';
import { triggerHaptic } from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';

interface BodyguardDecisionProps {
  target: Player;
  bodyguard: Player;
  hasNextTarget?: boolean;
  onVeto: () => void;
  onProceed: () => void;
}

export const BodyguardDecision: React.FC<BodyguardDecisionProps> = ({
  target,
  bodyguard,
  hasNextTarget = false,
  onVeto,
  onProceed
}) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-14 animate-fadeIn">
      <div className="cipher-kicker mb-3">Protocol 04 / Final safeguard</div>
      <section className="cipher-panel overflow-hidden">
        <div className="border-b border-white/10 p-5 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-300/40 bg-lime-300/10 text-lime-300 mb-5">
            <Shield className="h-5 w-5" />
          </div>
          <PlayerAvatar name={target.name} src={target.avatarPhoto} className="mb-4 h-20 w-20 border border-white/10 text-xl" />
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Bodyguard window</p>
          <h1 className="font-display text-3xl font-black text-stone-50 mt-2 tracking-tight">
            The table chose {target.name}.
          </h1>
          <p className="text-sm leading-6 text-stone-400 mt-3 max-w-md">
            The Bodyguard may reveal their shield now to protect this player. The shield is single-use, cannot protect the Bodyguard, and {hasNextTarget ? 'the next queued elimination will still continue.' : 'ends this vote without a reveal.'}
          </p>
        </div>

        <div className="p-5 sm:p-7 space-y-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => {
                setConfirming(true);
                triggerHaptic(25);
              }}
              className="cipher-button-secondary w-full"
            >
              <ShieldCheck className="h-4 w-4" />
              Invoke a Bodyguard veto
            </button>
          ) : (
            <div className="rounded-2xl border border-lime-300/30 bg-lime-300/[0.07] p-4 space-y-3">
              <p className="text-sm text-stone-200">
                Reveal only if you are <strong className="text-lime-300">{bodyguard.name}</strong>. This permanently spends the shield.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="cipher-button-ghost">Cancel</button>
                <button type="button" onClick={onVeto} className="cipher-button-acid">Reveal & veto</button>
              </div>
            </div>
          )}

          <button type="button" onClick={onProceed} className="cipher-button-primary w-full">
            Continue to identity reveal
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[11px] text-stone-600">If no veto is declared, the vote becomes final.</p>
        </div>
      </section>
    </div>
  );
};
