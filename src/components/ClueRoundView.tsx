import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Pause, Play, RotateCcw, Shuffle, Vote } from 'lucide-react';
import { Player, RoundModifier } from '../types';
import { playCountdown, playTick, playWhoosh, triggerHaptic } from '../utils/soundEffects';
import { secureShuffle } from '../utils/wordHistory';
import { PlayerAvatar } from './PlayerAvatar';

interface Props { players: Player[]; activeModifier: RoundModifier | null; roundNumber: number; categoryName: string; onProceedToVoting: () => void; timerSeconds?: 5|10|20|30; preTimerEverySpeaker?: boolean; }
type TimerPhase = 'ready'|'pre'|'running'|'paused'|'timeup';

const fairOrder = (players: Player[], round: number) => {
  const active = secureShuffle(players.filter(player => !player.isEliminated));
  if (!active.length) return active;
  const offset = (round - 1) % active.length;
  return [...active.slice(offset), ...active.slice(0, offset)];
};
export const ClueRoundView: React.FC<Props> = ({ players, activeModifier, roundNumber, categoryName, onProceedToVoting, timerSeconds=20, preTimerEverySpeaker=true }) => {
  const [orderedPlayers,setOrderedPlayers]=useState(()=>fairOrder(players,roundNumber));
  const [speakerIndex,setSpeakerIndex]=useState(0);
  const [completedIds,setCompletedIds]=useState<string[]>([]);
  const totalSeconds=activeModifier?.id==='mod_rapid'?5:timerSeconds;
  const [timeLeft,setTimeLeft]=useState<number>(totalSeconds);
  const [preCount,setPreCount]=useState(3);
  const [timerPhase,setTimerPhase]=useState<TimerPhase>('pre');
  const [resumePhase,setResumePhase]=useState<'pre'|'running'>('running');
  const [advancing,setAdvancing]=useState(false);
  const turnRailRef=useRef<HTMLDivElement>(null);
  const turnItemRefs=useRef<Array<HTMLDivElement|null>>([]);
  const currentSpeaker=orderedPlayers[speakerIndex];
  const allSpoken=completedIds.length>=orderedPlayers.length;

  useEffect(()=>{
    if(timerPhase!=='pre')return;
    playCountdown(preCount);
    if(preCount===0){const go=window.setTimeout(()=>{setTimeLeft(totalSeconds);setTimerPhase('running');},700);return()=>window.clearTimeout(go);}
    const timer=window.setTimeout(()=>setPreCount(value=>value-1),1000);return()=>window.clearTimeout(timer);
  },[preCount,timerPhase,totalSeconds]);

  useEffect(()=>{
    if(timerPhase!=='running')return;
    if(timeLeft<=0){setTimerPhase('timeup');playCountdown(0);triggerHaptic([90,40,120]);return;}
    const timer=window.setTimeout(()=>{setTimeLeft(value=>value-1);playTick();if(timeLeft<=5)triggerHaptic(18);},1000);return()=>window.clearTimeout(timer);
  },[timerPhase,timeLeft]);

  useEffect(()=>{const pauseHidden=()=>{if(document.visibilityState==='hidden'&&(timerPhase==='pre'||timerPhase==='running')){setResumePhase(timerPhase);setTimerPhase('paused');}};document.addEventListener('visibilitychange',pauseHidden);return()=>document.removeEventListener('visibilitychange',pauseHidden);},[timerPhase]);

  useEffect(()=>{
    const rail=turnRailRef.current;const active=turnItemRefs.current[speakerIndex];if(!rail||!active)return;
    const left=active.offsetLeft-(rail.clientWidth-active.clientWidth)/2;
    rail.scrollTo({left:Math.max(0,left),behavior:'smooth'});
  },[speakerIndex]);

  const begin=()=>{setPreCount(3);setTimeLeft(totalSeconds);setTimerPhase('pre');};
  const togglePause=()=>{if(timerPhase==='paused')setTimerPhase(resumePhase);else if(timerPhase==='pre'||timerPhase==='running'){setResumePhase(timerPhase);setTimerPhase('paused');}};
  const next=()=>{if(advancing)return;setAdvancing(true);window.setTimeout(()=>setAdvancing(false),450);if(currentSpeaker&&!completedIds.includes(currentSpeaker.id))setCompletedIds(ids=>[...ids,currentSpeaker.id]);if(speakerIndex<orderedPlayers.length-1){setSpeakerIndex(index=>index+1);setTimeLeft(totalSeconds);setPreCount(3);setTimerPhase(preTimerEverySpeaker?'pre':'running');playWhoosh();}else setTimerPhase('ready');};
  const reshuffle=()=>{setOrderedPlayers(fairOrder(players,roundNumber+1));setSpeakerIndex(0);setCompletedIds([]);setTimeLeft(totalSeconds);setPreCount(3);setTimerPhase('ready');triggerHaptic([25,20,30]);};
  const progress=useMemo(()=>orderedPlayers.length?completedIds.length/orderedPlayers.length:0,[completedIds.length,orderedPlayers.length]);

  return <div className="clue-stage clue-stage-compact mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-lg flex-col px-5 pb-24 pt-4">
    <header className="flex items-end justify-between border-b-2 border-[var(--ink)] pb-3"><div><p className="cipher-eyebrow">Round {String(roundNumber).padStart(2,'0')}</p><h1 className="mt-1 font-display text-2xl font-black">{categoryName}</h1></div><button className="cipher-icon-button" onClick={reshuffle} aria-label="Reshuffle turn order"><Shuffle className="h-4 w-4"/></button></header>
    {activeModifier&&<div className="modifier-ribbon mt-3"><strong>{activeModifier.title}</strong><span>{activeModifier.rule}</span></div>}
    <section className="speaker-board mt-4 flex flex-1 flex-col"><div className="flex items-center justify-between"><span className="cipher-eyebrow">Speaker {speakerIndex+1} of {orderedPlayers.length}</span><span className="text-xs font-bold">{completedIds.length} clues given</span></div>
      <div className="speaker-identity mt-4"><PlayerAvatar name={currentSpeaker?.name||''} src={currentSpeaker?.avatarPhoto} className="h-16 w-16 border-2 border-[var(--ink)]"/><div><h2 className="font-display text-4xl font-black tracking-[-.05em]">{currentSpeaker?.name}</h2><p className="mt-1 text-xs font-semibold text-[var(--muted)]">One useful clue. Do not say either word.</p></div></div>
      <div className={`countdown-stage mt-5 phase-${timerPhase}`} aria-live="assertive">
        {timerPhase==='ready'&&<><p className="cipher-eyebrow">Place the phone at the center</p><strong>Ready?</strong><button onClick={begin} className="cipher-button-primary mt-5 w-full"><Play className="h-4 w-4"/>Begin clues</button></>}
        {timerPhase==='pre'&&<><p className="cipher-eyebrow">Get ready</p><strong>{preCount||'GO'}</strong></>}
        {(timerPhase==='running'||timerPhase==='paused'||timerPhase==='timeup')&&<><p className="cipher-eyebrow">{timerPhase==='paused'?'Paused':timerPhase==='timeup'?'Time':'Clue timer'}</p><strong>{timerPhase==='timeup'?'TIME':String(timeLeft).padStart(2,'0')}</strong><div className="timer-progress" style={{'--timer-progress':`${Math.max(0,timeLeft/totalSeconds)*100}%`} as React.CSSProperties}/><div className="mt-4 flex justify-center gap-2"><button onClick={togglePause} className="cipher-button-secondary px-4">{timerPhase==='paused'?<Play className="h-4 w-4"/>:<Pause className="h-4 w-4"/>}{timerPhase==='paused'?'Resume':'Pause'}</button><button onClick={begin} className="cipher-icon-button" aria-label="Restart countdown"><RotateCcw className="h-4 w-4"/></button></div></>}
      </div>
      <button onClick={next} disabled={allSpoken||advancing} className="cipher-button-primary mt-4 w-full disabled:opacity-30">{speakerIndex===orderedPlayers.length-1?'Finish clue round':'Clue given · next speaker'}<ChevronRight className="h-4 w-4"/></button>
      <div className="mt-auto pt-5"><p className="cipher-eyebrow mb-2">Speaking order</p><div ref={turnRailRef} className="turn-rail" aria-label="Speaking order">{orderedPlayers.map((player,index)=><div ref={element=>{turnItemRefs.current[index]=element;}} key={player.id} className={`${index===speakerIndex?'active':''} ${completedIds.includes(player.id)?'done':''}`}><span>{String(index+1).padStart(2,'0')}</span>{player.name}</div>)}</div><div className="turn-progress mt-2"><span style={{width:`${progress*100}%`}}/></div></div>
    </section>
    {allSpoken&&<div className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-[var(--ink)] bg-[var(--canvas)] p-3"><button className="cipher-button-primary mx-auto flex w-full max-w-lg" onClick={onProceedToVoting}><Vote className="h-4 w-4"/>Open voting</button></div>}
  </div>;
};
