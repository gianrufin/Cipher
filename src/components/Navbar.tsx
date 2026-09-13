import React from 'react';
import { Settings2, Users } from 'lucide-react';

interface NavbarProps { onOpenSettings: () => void; gameActive: boolean; playerCount: number; }

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, gameActive, playerCount }) => (
  <header className="cipher-navbar sticky top-0 z-40 w-full px-5 py-4">
    <div className="mx-auto flex max-w-lg items-center justify-between">
      <div className="flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}cipher-mark.svg`} alt="" className="cipher-brand-image"/><span className="cipher-brand-name font-display text-lg font-black tracking-[-.02em]">CIPHER</span></div>
      <div className="flex items-center gap-2">
        {gameActive && <span className="cipher-player-count"><Users className="h-4 w-4" />{playerCount}</span>}
        <button type="button" onClick={onOpenSettings} className="cipher-icon-button" aria-label="Open settings"><Settings2 className="h-4 w-4" /></button>
      </div>
    </div>
  </header>
);
