import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Plus, Smartphone, Trash2, UserPlus, Users } from 'lucide-react';
import { CrewProfile } from '../types';
import { createCrew, readCrews, removeCrew, saveCrews, setActiveCrew, updateCrew } from '../utils/crewStore';
import { loadCrewDefinition, syncCrewDefinition } from '../utils/crewSync';

export const CrewScreen = ({ onBack, onLocal, onOnline }: { onBack: () => void; onLocal: (crew: CrewProfile) => void; onOnline: (crew: CrewProfile) => void }) => {
  const [crews, setCrews] = useState(readCrews());
  const [selectedId, setSelectedId] = useState(crews[0]?.id || '');
  const [creating, setCreating] = useState(crews.length === 0);
  const [crewName, setCrewName] = useState('');
  const [newName, setNewName] = useState('');
  const [draftNames, setDraftNames] = useState<string[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [notice, setNotice] = useState('');
  const selected = useMemo(() => crews.find(crew => crew.id === selectedId), [crews, selectedId]);

  const refresh = (focus?: string) => { const next = readCrews(); setCrews(next); setSelectedId(focus || next[0]?.id || ''); };
  const addDraft = () => { const name = newName.trim(); if (!name || draftNames.some(item => item.toLowerCase() === name.toLowerCase())) return; setDraftNames(items => [...items, name]); setNewName(''); };
  const saveNew = () => { if (!crewName.trim() || draftNames.length < 4) return; const crew = createCrew(crewName, draftNames); void syncCrewDefinition(crew); refresh(crew.id); setCreating(false); setCrewName(''); setDraftNames([]); };
  const patchSelected = (crew: CrewProfile) => { updateCrew(crew); void syncCrewDefinition(crew); refresh(crew.id); };
  const joinCrew = async () => { setNotice('Finding crew…'); const crew=await loadCrewDefinition(joinCode); if(!crew){setNotice('Crew not found or currently offline.');return;} const existing=readCrews(); saveCrews([...existing.filter(item=>item.id!==crew.id),crew]); setActiveCrew(crew); refresh(crew.id); setCreating(false); setNotice('Crew added to this device.'); };
  const launch = (mode: 'local' | 'online') => { if (!selected || selected.members.filter(member => member.active).length < 4) return; setActiveCrew(selected); mode === 'local' ? onLocal(selected) : onOnline(selected); };

  return <div className="mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-lg flex-col px-5 pb-24 pt-5">
    <header className="flex items-center justify-between"><button onClick={onBack} className="cipher-icon-button" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><span className="cipher-eyebrow">My crews</span><button onClick={() => setCreating(true)} className="cipher-icon-button" aria-label="Create crew"><Plus className="h-5 w-5" /></button></header>
    {creating ? <section className="mt-8 flex flex-1 flex-col">
      <p className="cipher-eyebrow">New crew</p><h1 className="mt-2 font-display text-4xl font-black">Build your regular table.</h1>
      <input className="cipher-input mt-6 w-full" value={crewName} onChange={event => setCrewName(event.target.value)} placeholder="Crew name" maxLength={28} />
      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--line)]"/><small className="cipher-kicker">or join by code</small><span className="h-px flex-1 bg-[var(--line)]"/></div>
      <div className="flex gap-2"><input className="cipher-input min-w-0 flex-1 uppercase tracking-[.2em]" value={joinCode} onChange={event=>setJoinCode(event.target.value.replace(/[^a-z0-9]/gi,'').slice(0,8).toUpperCase())} placeholder="CREW CODE"/><button onClick={()=>void joinCrew()} disabled={joinCode.length<4} className="cipher-button-secondary px-4 disabled:opacity-30">Join</button></div>
      {notice&&<p className="mt-2 text-xs text-[var(--muted)]">{notice}</p>}
      <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); addDraft(); }}><input className="cipher-input min-w-0 flex-1" value={newName} onChange={event => setNewName(event.target.value)} placeholder="Player name" maxLength={18}/><button className="cipher-button-secondary px-4"><UserPlus className="h-4 w-4"/>Add</button></form>
      <div className="crew-member-grid mt-5">{draftNames.map((name,index)=><div className="crew-member" key={`${name}-${index}`}><span>{name}</span><button onClick={() => setDraftNames(items=>items.filter((_,i)=>i!==index))} aria-label={`Remove ${name}`}><Trash2 className="h-4 w-4"/></button></div>)}</div>
      <p className="mt-4 text-xs text-[var(--muted)]">{Math.max(0,4-draftNames.length)} more player{Math.max(0,4-draftNames.length)===1?'':'s'} needed</p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-8"><button onClick={()=>setCreating(false)} className="cipher-button-secondary">Cancel</button><button disabled={!crewName.trim()||draftNames.length<4} onClick={saveNew} className="cipher-button-primary disabled:opacity-30">Create crew</button></div>
    </section> : selected ? <section className="mt-8 flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-4"><div><p className="cipher-eyebrow">Tonight's table</p><h1 className="mt-2 font-display text-4xl font-black">{selected.name}</h1></div><button className="crew-code" onClick={()=>navigator.clipboard.writeText(selected.code)}><Copy className="h-3.5 w-3.5"/>{selected.code}</button></div>
      <p className="mt-3 text-sm text-[var(--muted)]">Tap a player to mark them present or sitting out.</p>
      <div className="crew-member-grid mt-6">{selected.members.map(member=><button key={member.id} onClick={()=>patchSelected({...selected,members:selected.members.map(item=>item.id===member.id?{...item,active:!item.active}:item)})} className={`crew-member ${member.active?'active':''}`}><span>{member.name}</span>{member.active&&<Check className="h-4 w-4"/>}</button>)}</div>
      <form className="mt-4 flex gap-2" onSubmit={event=>{event.preventDefault();const name=newName.trim();if(!name)return;patchSelected({...selected,members:[...selected.members,{id:crypto.randomUUID(),name,active:true,temporary:true}]});setNewName('');}}><input className="cipher-input min-w-0 flex-1" value={newName} onChange={event=>setNewName(event.target.value)} placeholder="Add guest"/><button className="cipher-button-secondary px-4"><Plus className="h-4 w-4"/>Guest</button></form>
      <div className="mt-auto grid gap-2 pt-8"><button onClick={()=>launch('local')} className="cipher-button-primary"><Users className="h-4 w-4"/>Pass & Play</button><button onClick={()=>launch('online')} className="cipher-button-secondary"><Smartphone className="h-4 w-4"/>Live Room</button><button onClick={()=>{removeCrew(selected.id);refresh();}} className="cipher-text-button mx-auto mt-3 text-[var(--danger)]">Delete crew</button></div>
    </section> : null}
    {!creating&&crews.length>1&&<nav className="crew-switcher">{crews.map(crew=><button key={crew.id} aria-pressed={crew.id===selectedId} onClick={()=>setSelectedId(crew.id)}>{crew.name}</button>)}</nav>}
  </div>;
};
