import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Radio, Send, ShieldCheck, Wifi } from 'lucide-react';
import { CipherPeerRoom, makePeerId, makeRoomCode, RoomStatus } from '../multiplayer/signaling';
import { PlayerAvatar } from './PlayerAvatar';
import { SelfieCaptureModal } from './SelfieCaptureModal';

type Profile = { id: string; name: string; photo?: string; connected: boolean };
type RoomMessage = { type: 'profile'; profile: Profile } | { type: 'roster'; roster: Profile[] } | { type: 'vote-open' } | { type: 'vote'; voterId: string; targetId?: string } | { type: 'vote-results'; counts: Record<string, number> };

export const OnlineRoomScreen = ({ onBack }: { onBack: () => void }) => {
  const endpoint = String(import.meta.env.VITE_SIGNALING_URL || '');
  const [role, setRole] = useState<'host' | 'player'>('host');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room')?.toUpperCase() || '');
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [notice, setNotice] = useState('');
  const [roster, setRoster] = useState<Profile[]>([]);
  const [voting, setVoting] = useState(false);
  const [myVote, setMyVote] = useState<string | 'skip'>();
  const [votes, setVotes] = useState<Record<string, string | undefined>>({});
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const peerId = useRef(makePeerId());
  const room = useRef<CipherPeerRoom>();
  const hostPeerId = useRef<string>();

  useEffect(() => () => room.current?.close(), []);

  const sendRoster = (next: Profile[]) => room.current?.broadcast({ type: 'roster', roster: next } satisfies RoomMessage);
  const connect = () => {
    if (!endpoint) { setStatus('error'); setNotice('This deployment needs VITE_SIGNALING_URL. See README for the Firebase-free Worker setup.'); return; }
    if (!name.trim() || !photo) { setNotice('Add your name and selfie first.'); return; }
    const roomCode = role === 'host' ? makeRoomCode() : code.trim().toUpperCase();
    if (!roomCode) { setNotice('Enter the six-character room code.'); return; }
    setCode(roomCode); setNotice('');
    const me: Profile = { id: peerId.current, name: name.trim(), photo, connected: true };
    if (role === 'host') setRoster([me]);
    room.current = new CipherPeerRoom({
      onStatus: (next, message) => { setStatus(next); if (message) setNotice(message); },
      onPeerOpen: remoteId => { if (role === 'player') { hostPeerId.current = remoteId; room.current?.send(remoteId, { type: 'profile', profile: me } satisfies RoomMessage); } },
      onPeerClose: remoteId => setRoster(current => { const next = current.map(profile => profile.id === remoteId ? { ...profile, connected: false } : profile); if (role === 'host') sendRoster(next); return next; }),
      onData: (remoteId, raw) => {
        const message = raw as RoomMessage;
        if (role === 'host' && message.type === 'profile') setRoster(current => { const next = [...current.filter(item => item.id !== message.profile.id), message.profile]; setTimeout(() => sendRoster(next)); return next; });
        if (message.type === 'roster') setRoster(message.roster);
        if (message.type === 'vote-open') { setVoting(true); setResults(null); setMyVote(undefined); }
        if (role === 'host' && message.type === 'vote') setVotes(current => ({ ...current, [message.voterId]: message.targetId }));
        if (message.type === 'vote-results') { setResults(message.counts); setVoting(false); }
      }
    });
    room.current.connect(endpoint, roomCode, peerId.current, role === 'host');
  };

  const openVote = () => { setVoting(true); setVotes({}); setResults(null); setMyVote(undefined); room.current?.broadcast({ type: 'vote-open' } satisfies RoomMessage); };
  const castVote = (targetId?: string) => {
    setMyVote(targetId || 'skip');
    if (role === 'host') setVotes(current => ({ ...current, [peerId.current]: targetId }));
    else if (hostPeerId.current) room.current?.send(hostPeerId.current, { type: 'vote', voterId: peerId.current, targetId } satisfies RoomMessage);
  };
  const revealResults = () => {
    const counts: Record<string, number> = {};
    Object.values(votes).forEach(target => { if (target) counts[target] = (counts[target] || 0) + 1; });
    setResults(counts); setVoting(false); room.current?.broadcast({ type: 'vote-results', counts } satisfies RoomMessage);
  };

  if (status === 'idle' || status === 'error') return <div className="mx-auto w-full max-w-lg px-4 py-8"><button onClick={onBack} className="cipher-button-ghost px-3"><ArrowLeft className="h-4 w-4" /> Modes</button><p className="cipher-kicker mt-8">Live room / beta</p><h1 className="mt-2 font-display text-4xl font-black text-stone-50">Every phone gets a ballot.</h1><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => setRole('host')} className={`rounded-2xl border p-4 text-left ${role === 'host' ? 'border-rose-500 bg-rose-500/10' : 'border-white/10'}`}><strong className="text-stone-100">Host room</strong><small className="mt-1 block text-stone-500">Creates the code</small></button><button onClick={() => setRole('player')} className={`rounded-2xl border p-4 text-left ${role === 'player' ? 'border-sky-500 bg-sky-500/10' : 'border-white/10'}`}><strong className="text-stone-100">Join room</strong><small className="mt-1 block text-stone-500">Enter a code</small></button></div><div className="cipher-panel mt-4 space-y-3 p-5"><input className="cipher-input w-full" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" maxLength={24}/>{role === 'player' && <input className="cipher-input w-full uppercase tracking-[.3em]" value={code} onChange={event => setCode(event.target.value)} placeholder="ROOM CODE" maxLength={6}/>}<button onClick={() => setSelfieOpen(true)} className="cipher-button-secondary w-full">{photo ? <><Check className="h-4 w-4" /> Selfie ready</> : 'Take private room selfie'}</button>{notice && <p className="text-xs leading-5 text-rose-300">{notice}</p>}<button onClick={connect} className="cipher-button-primary w-full"><Wifi className="h-4 w-4" /> {role === 'host' ? 'Create room' : 'Join room'}</button></div><SelfieCaptureModal playerName={selfieOpen ? name || 'Player' : null} onClose={() => setSelfieOpen(false)} onCapture={image => { setPhoto(image); setSelfieOpen(false); }}/></div>;

  return <div className="mx-auto w-full max-w-lg px-4 py-8"><div className="flex items-center justify-between"><div><p className="cipher-kicker">Room code</p><h1 className="font-mono text-3xl font-black tracking-[.18em] text-stone-50">{code}</h1></div><button className="cipher-button-secondary px-3" onClick={() => navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${code}`)}><Copy className="h-4 w-4" /> Invite</button></div><div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"><Radio className="h-4 w-4" /> Encrypted peer room connected</div><div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">{roster.map(profile => <div key={profile.id} className="evidence-note rounded-2xl border border-white/10 p-2 text-center"><PlayerAvatar name={profile.name} src={profile.photo} className="aspect-square w-full"/><span className="mt-2 block truncate text-[11px] font-bold text-stone-100">{profile.name}</span><span className={`text-[8px] uppercase ${profile.connected ? 'text-emerald-300' : 'text-stone-600'}`}>{profile.connected ? 'online' : 'reconnecting'}</span></div>)}</div>
    {!voting && !results && role === 'host' && <button onClick={openVote} disabled={roster.length < 2} className="cipher-button-primary mt-6 w-full disabled:opacity-30"><Send className="h-4 w-4" /> Open live ballot</button>}
    {voting && <div className="cipher-panel mt-6 p-5"><p className="cipher-kicker">Silent ballot</p><h2 className="mt-2 text-xl font-black text-stone-100">Who is most suspicious?</h2><div className="mt-4 grid grid-cols-3 gap-2">{roster.filter(profile => profile.id !== peerId.current && profile.connected).map(profile => <button key={profile.id} onClick={() => castVote(profile.id)} className={`rounded-2xl border p-2 ${myVote === profile.id ? 'border-rose-500 bg-rose-500/10' : 'border-white/10'}`}><PlayerAvatar name={profile.name} src={profile.photo} className="aspect-square w-full"/><span className="mt-2 block truncate text-[10px] text-stone-100">{profile.name}</span></button>)}</div><button onClick={() => castVote()} className="cipher-button-ghost mt-3 w-full">Skip</button>{myVote && <p className="mt-3 text-center text-xs text-emerald-300"><ShieldCheck className="mr-1 inline h-4 w-4" /> Your ballot is locked.</p>}{role === 'host' && <button onClick={revealResults} className="cipher-button-primary mt-4 w-full">Close and reveal ({Object.keys(votes).length}/{roster.length})</button>}</div>}
    {results && <div className="cipher-panel mt-6 p-5"><p className="cipher-kicker">Vote results</p><div className="mt-4 space-y-2">{[...roster].sort((a,b) => (results[b.id] || 0) - (results[a.id] || 0)).map(profile => <div key={profile.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3"><PlayerAvatar name={profile.name} src={profile.photo} className="h-11 w-11"/><strong className="flex-1 text-stone-100">{profile.name}</strong><span className="font-mono text-rose-300">{results[profile.id] || 0}</span></div>)}</div>{role === 'host' && <button onClick={openVote} className="cipher-button-secondary mt-4 w-full">Open another ballot</button>}</div>}
  </div>;
};
