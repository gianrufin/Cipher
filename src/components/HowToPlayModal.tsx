import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Clock3, EyeOff, ShieldQuestion, Vote, X } from 'lucide-react';
import { RoleArchive } from './RoleArchive';

const chapters = [
  {id:'core',title:'Core rules',copy:'The complete game in sixty seconds.',icon:ShieldQuestion},
  {id:'reveal',title:'Private reveal',copy:'How to pass the phone without leaking a role.',icon:EyeOff},
  {id:'clues',title:'Clues and timer',copy:'What counts as a fair clue and how turns work.',icon:Clock3},
  {id:'voting',title:'Voting and winning',copy:'Open accusations, private ballots, and ties.',icon:Vote},
  {id:'roles',title:'Role archive',copy:'Every alignment, power, and win condition.',icon:ShieldQuestion}
];

export const HowToPlayModal = ({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}) => {
  const [chapter,setChapter]=useState(''); if(!isOpen)return null;
  return <div className="fixed inset-0 z-[90] bg-[var(--canvas)]"><div className="mx-auto flex h-full w-full max-w-lg flex-col px-5 pb-6 pt-5">
    <header className="flex items-center justify-between"><button onClick={()=>chapter?setChapter(''):onClose()} className="cipher-icon-button" aria-label="Back">{chapter?<ArrowLeft className="h-5 w-5"/>:<X className="h-5 w-5"/>}</button><span className="cipher-eyebrow">How to play</span><span className="w-11"/></header>
    {!chapter?<main className="flex-1 overflow-y-auto pt-9"><p className="cipher-eyebrow">Cipher field guide</p><h1 className="mt-2 font-display text-5xl font-black tracking-[-.06em]">Learn only what you need.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Open a chapter without losing your place in the game.</p><div className="chapter-list mt-8">{chapters.map(({id,title,copy,icon:Icon},index)=><button key={id} onClick={()=>setChapter(id)}><span>{String(index+1).padStart(2,'0')}</span><Icon className="h-5 w-5"/><div><strong>{title}</strong><small>{copy}</small></div><ChevronRight className="h-5 w-5"/></button>)}</div></main>:<main className="flex-1 overflow-y-auto pt-7">{chapter==='roles'?<RoleArchive embedded/>:<Chapter id={chapter}/>}</main>}
  </div></div>;
};

const Chapter=({id}:{id:string})=>{
  const content:Record<string,{kicker:string;title:string;intro:string;items:{title:string;copy:string}[]}>= {
    core:{kicker:'The objective',title:'Find who does not belong.',intro:'Most players receive the true word. Imposters receive a related decoy or only the category.',items:[{title:'Pass',copy:'Each player holds the screen to view their private role and word.'},{title:'Clue',copy:'Give one useful clue without saying either secret word.'},{title:'Accuse',copy:'Discuss what sounded suspicious and lock a vote.'},{title:'Survive',copy:'The Crew catches every Imposter before the Imposter team controls the table.'}]},
    reveal:{kicker:'Keep it private',title:'Hold to see. Release to hide.',intro:'Shield the phone before touching the reveal control. Every role uses identical color and brightness.',items:[{title:'Only the first viewer can replace a word',copy:'Use “Seen this word before?” before passing the device.'},{title:'Never announce the role screen',copy:'Return to the concealed handoff before giving the phone away.'}]},
    clues:{kicker:'The clue round',title:'Useful, but never obvious.',intro:'The host starts the sequence. Each speaker gets a 3-second preparation countdown followed by their selected timer.',items:[{title:'Finish early',copy:'Tap Clue given to stop the clock and prepare the next speaker.'},{title:'Time is up',copy:'The app sounds a cue but never advances automatically.'},{title:'Need pressure?',copy:'Draw a cross-examination prompt after clues are complete.'}]},
    voting:{kicker:'The accusation',title:'Choose, check, confirm.',intro:'Open voting supports table debate. Blind voting passes a private ballot around the group.',items:[{title:'Confirm every ballot',copy:'A selected player or skip is shown once more before it is locked.'},{title:'Ties return to the table',copy:'Runoff candidates are narrowed without exposing individual votes.'},{title:'Last Stand',copy:'A caught final Imposter may still steal the game by identifying the secret word.'}]}
  }; const page=content[id]||content.core;
  return <article><p className="cipher-eyebrow">{page.kicker}</p><h1 className="mt-2 font-display text-5xl font-black tracking-[-.06em]">{page.title}</h1><p className="mt-5 text-base font-semibold leading-7 text-[var(--muted)]">{page.intro}</p><div className="rule-list mt-8">{page.items.map((item,index)=><section key={item.title}><span>{String(index+1).padStart(2,'0')}</span><div><h2>{item.title}</h2><p>{item.copy}</p></div></section>)}</div></article>;
};
