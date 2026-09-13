import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Coffee, Copy, RefreshCw, RotateCcw, Settings2, UserRoundSearch, Vibrate, Volume2, VolumeX } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';
import { createCrewCode, getCrewProfile, getPlayedPairKeys, resetPlayedPairsHistory, saveCrewProfile } from '../utils/wordHistory';
import { CrewSyncState, syncCrewHistory } from '../utils/crewSync';

interface SettingsScreenProps {
  onClose: () => void;
  onHowToPlay: () => void;
  onRoleArchive: () => void;
  onReplayOnboarding: () => void;
  onResetApp: () => void;
  onRestartMatch?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onHowToPlay, onRoleArchive, onReplayOnboarding, onResetApp, onRestartMatch }) => {
  const profile = getCrewProfile();
  const [crewName, setCrewName] = useState(profile.name);
  const [crewCode, setCrewCode] = useState(profile.code);
  const [sound, setSound] = useState(isSoundEnabled());
  const [haptics,setHaptics]=useState(localStorage.getItem('cipher_haptics')!=='off');
  const [timerSeconds,setTimerSeconds]=useState<5|10|20|30>((Number(localStorage.getItem('cipher_timer_seconds'))||20) as 5|10|20|30);
  const [theme, setTheme] = useState<'light' | 'dark'>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [syncState, setSyncState] = useState<CrewSyncState>('disabled');
  const [historyCount, setHistoryCount] = useState(getPlayedPairKeys().size);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState<'history' | 'app' | null>(null);

  useEffect(() => {
    const update = () => setHistoryCount(getPlayedPairKeys().size);
    window.addEventListener('cipher-history-change', update);
    return () => window.removeEventListener('cipher-history-change', update);
  }, []);

  const saveCrew = async () => {
    const code = (crewCode || createCrewCode()).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase();
    setCrewCode(code);
    saveCrewProfile(code, crewName || 'My crew');
    setSyncState('syncing');
    setSyncState(await syncCrewHistory());
  };

  const updateTheme = (next: 'light' | 'dark') => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('cipher_theme', next);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[var(--canvas)]">
      <div className="mx-auto min-h-full w-full max-w-lg px-5 pb-16 pt-5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="cipher-icon-button" aria-label="Close settings"><ArrowLeft className="h-5 w-5" /></button>
          <span className="cipher-eyebrow">Settings</span>
          <Settings2 className="h-5 w-5 text-[var(--muted)]" />
        </header>
        <h1 className="mt-10 font-display text-5xl font-black tracking-[-.05em]">Make it yours.</h1>

        <section className="settings-section">
          <h2>Experience</h2>
          <div className="settings-row"><span>Appearance</span><div className="cipher-segmented">
            {(['light', 'dark'] as const).map(option => <button key={option} aria-pressed={theme === option} onClick={() => updateTheme(option)}>{option}</button>)}
          </div></div>
          <button className="settings-row w-full" onClick={() => { const next = !sound; setSound(next); setSoundEnabled(next); }}>
            <span>Sound</span><span className="flex items-center gap-2 text-sm font-bold">{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{sound ? 'On' : 'Off'}</span>
          </button>
          <button className="settings-row w-full" onClick={()=>{const next=!haptics;setHaptics(next);localStorage.setItem('cipher_haptics',next?'on':'off');}}><span>Vibration</span><span className="flex items-center gap-2 text-sm font-bold"><Vibrate className="h-4 w-4"/>{haptics?'On':'Off'}</span></button>
          <div className="settings-row"><span>Clue timer</span><div className="cipher-segmented">{([5,10,20,30] as const).map(value=><button key={value} aria-pressed={timerSeconds===value} onClick={()=>{setTimerSeconds(value);localStorage.setItem('cipher_timer_seconds',String(value));}}>{value}s</button>)}</div></div>
          <button className="settings-row w-full" onClick={onHowToPlay}><span>How to play</span><BookOpen className="h-4 w-4" /></button>
          <button className="settings-row w-full" onClick={onRoleArchive}><span>Role archive</span><UserRoundSearch className="h-4 w-4" /></button>
          <button className="settings-row w-full" onClick={onReplayOnboarding}><span>Replay introduction</span><span>›</span></button>
          <div className="settings-row"><span>Install Cipher</span><PWAInstallButton variant="nav" /></div>
        </section>

        <section className="settings-section">
          <div className="flex items-end justify-between gap-4">
            <div><h2>Word crew</h2><p className="mt-1 text-xs text-[var(--muted)]">Carry played-word history to another phone.</p></div>
            <span className="cipher-count">{historyCount} played</span>
          </div>
          <label className="mt-5 block text-xs font-bold">Crew name
            <input className="cipher-input mt-2 w-full" value={crewName} onChange={event => setCrewName(event.target.value)} placeholder="Sunday Barkada" />
          </label>
          <label className="mt-4 block text-xs font-bold">Crew code
            <div className="mt-2 flex gap-2">
              <input className="cipher-input min-w-0 flex-1 uppercase tracking-[.25em]" value={crewCode} onChange={event => setCrewCode(event.target.value.toUpperCase())} placeholder="CREATE ONE" maxLength={8} />
              <button className="cipher-icon-button" aria-label="Copy crew code" disabled={!crewCode} onClick={async () => { await navigator.clipboard.writeText(crewCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
            </div>
          </label>
          <button className="cipher-button-primary mt-4 w-full" onClick={saveCrew}>
            <RefreshCw className={`h-4 w-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />{crewCode ? 'Save and sync crew' : 'Create crew code'}
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">{syncState === 'synced' ? 'Crew history is synced.' : syncState === 'offline' ? 'Offline. Local history will sync next time.' : syncState === 'error' ? 'Could not reach crew sync. Local protection is still active.' : 'Sync requires the Cipher room service.'}</p>
          {confirmReset === 'history' ? <div className="confirm-strip mt-4"><span>{crewCode ? 'Start a new crew with an empty deck?' : 'Clear this device’s word history?'}</span><button onClick={() => { resetPlayedPairsHistory(); if (crewCode) { const next = createCrewCode(); setCrewCode(next); saveCrewProfile(next, crewName || 'My crew'); } setConfirmReset(null); }}>Clear</button><button onClick={() => setConfirmReset(null)}>Cancel</button></div> : <button className="cipher-text-button mt-4" onClick={() => setConfirmReset('history')}>{crewCode ? 'Start a fresh crew deck' : 'Reset word history'}</button>}
        </section>

        <section className="settings-section">
          <h2>Current game</h2>
          {onRestartMatch && <button className="settings-row w-full text-[var(--coral)]" onClick={onRestartMatch}><span>Restart match</span><RotateCcw className="h-4 w-4" /></button>}
          {confirmReset === 'app' ? <div className="confirm-strip mt-3"><span>Erase scores, roster and preferences?</span><button onClick={onResetApp}>Erase</button><button onClick={() => setConfirmReset(null)}>Cancel</button></div> : <button className="settings-row w-full" onClick={() => setConfirmReset('app')}><span>Reset app data</span><span>›</span></button>}
        </section>

        <section className="support-card">
          <div><Coffee className="h-5 w-5" /><p className="cipher-eyebrow mt-3">Enjoying the game?</p><h2 className="mt-1">Buy me a coffee</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">If Cipher earned a place at your table, you can help support future improvements. Totally optional.</p><small>Scan with your payment app</small></div>
          <img src={`${import.meta.env.BASE_URL}support-qr.png`} alt="InstaPay QR code to support the developer" />
        </section>
      </div>
    </div>
  );
};
