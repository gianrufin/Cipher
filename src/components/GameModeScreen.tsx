import React from 'react';
import { ArrowRight, Smartphone, UserRoundCog, Users } from 'lucide-react';
import { getCrewProfile, getPlayedPairKeys } from '../utils/wordHistory';
import { enterFullscreen } from '../utils/fullscreen';

export const GameModeScreen = ({ onLocal, onOnline, onCrews }: { onLocal: () => void; onOnline: () => void; onCrews: () => void }) => {
  const crew = getCrewProfile();
  const played = getPlayedPairKeys().size;
  return (
    <div className="parlor-home mx-auto flex min-h-[calc(100svh-73px)] w-full max-w-lg flex-col px-5 pb-8 pt-6">
      <div className="home-hero"><div><p className="cipher-eyebrow">A word game for suspicious friends</p><h1 className="parlor-title mt-3">WHO DOESN’T<br />BELONG?</h1></div><img src={`${import.meta.env.BASE_URL}cipher-mark.svg`} alt="" /></div>
      <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[var(--muted)]">Deal secret words, give careful clues, and catch the player bluffing at the table.</p>

      {crew.code && <div className="crew-ticket mt-7"><div><small>Playing as</small><strong>{crew.name || 'My crew'}</strong></div><div><small>Code</small><strong>{crew.code}</strong></div><div><small>History</small><strong>{played} pairs</strong></div></div>}

      <div className="mt-auto grid gap-3 pt-7">
        <button type="button" onClick={() => { void enterFullscreen(); onCrews(); }} className="mode-button mode-button-primary">
          <span className="mode-number">01</span><span><strong>Play with a Crew</strong><small>Load your regular table</small></span><UserRoundCog className="h-6 w-6" /><ArrowRight className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => { void enterFullscreen(); onLocal(); }} className="mode-button mode-button-primary">
          <span className="mode-number">02</span><span><strong>Quick Pass & Play</strong><small>One phone around the table</small></span><Users className="h-6 w-6" /><ArrowRight className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => { void enterFullscreen(); onOnline(); }} className="mode-button">
          <span className="mode-number">03</span><span><strong>Quick Live Room</strong><small>Every player joins privately</small></span><Smartphone className="h-6 w-6" /><ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
