import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Copy, Eye, FastForward, QrCode, Radio, Send, Share2, ShieldCheck, Skull, UserMinus, Wifi, X } from 'lucide-react';
import { BUILT_IN_CATEGORIES } from '../data/wordPacks';
import { DAILY_VAULT_CATEGORY } from '../data/dailyVault';
import { OnlineAssignment, OnlineProfile, OnlinePublicState, OnlineRoomMessage, OnlineSettings, buildInitialOnlineState, createOnlineAssignments, onlineScoreboard } from '../multiplayer/game';
import { CipherPeerRoom, makePeerId, makeRoomCode, RoomStatus } from '../multiplayer/signaling';
import { PlayerAvatar } from './PlayerAvatar';
import { SelfieCaptureModal } from './SelfieCaptureModal';
import { selectCrewPair } from '../utils/crewSync';
import { CrewProfile } from '../types';
import { getDailyDeck } from '../utils/wordHistory';
import { playCountdown, playTick } from '../utils/soundEffects';
import { getRoleDefinition } from '../data/roleCatalog';
import { useWakeLock } from '../hooks/useWakeLock';
import { getLiveLeaderboard, LiveLeaderboardEntry, recordLiveMatch } from '../utils/liveLeaderboard';

const ROLE_COPY: Record<OnlineAssignment['role'], string> = {
  citizen: 'Find and eject every Imposter.', decoy: 'You are a Citizen, but your word is the alternate word.',
  imposter: 'Blend in, survive, and decode the Citizen word.', inspector: 'Exactly one of your three Signal Sweep seats is an Imposter. Read their clues and steer the table.',
  bodyguard: 'You may pardon one innocent ejection.', sleeper: 'You know the Citizen word, but secretly help the Imposters.',
  anarchist: `${getRoleDefinition('anarchist').name}: bait the table into ejecting you first.`
};

const defaultSettings: OnlineSettings = { imposters: 1, decoys: 0, ejectionReveal: 'confirm', allowSkip: true, eliminations: 1, categoryId: 'variety' };
const LIVE_HOST_SNAPSHOT = 'cipher_live_host_session_v1';
type LiveHostSnapshot = { code:string; state:OnlinePublicState; roster:OnlineProfile[]; assignments:[string,OnlineAssignment][]; citizenWord:string; settings:OnlineSettings; bodyguardUsed:boolean };
const activePlayers = (state: OnlinePublicState) => state.players.filter(player => !player.eliminated && player.connected);

export const OnlineRoomScreen = ({ onBack, initialCrew }: { onBack: () => void; initialCrew?: CrewProfile }) => {
  const endpoint = String(import.meta.env.VITE_SIGNALING_URL || '');
  const [role, setRole] = useState<'host' | 'player'>(() => new URLSearchParams(location.search).get('host') === '1' ? 'host' : new URLSearchParams(location.search).has('room') ? 'player' : 'host');
  const [name, setName] = useState(initialCrew?.members.find(member => member.active)?.name || localStorage.getItem('cipher_live_name') || '');
  const [photo, setPhoto] = useState<string>();
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room')?.toUpperCase() || '');
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [notice, setNotice] = useState('');
  const [roster, setRoster] = useState<OnlineProfile[]>([]);
  const [settings, setSettings] = useState<OnlineSettings>(defaultSettings);
  const [match, setMatch] = useState<OnlinePublicState>();
  const [assignment, setAssignment] = useState<OnlineAssignment>();
  const [privatePrompt, setPrivatePrompt] = useState<{ prompt: 'bodyguard' | 'inspector' | 'word'; targetId?: string }>();
  const [selectedVote, setSelectedVote] = useState<string | 'skip'>();
  const [counterWord, setCounterWord] = useState('');
  const [roleVisible, setRoleVisible] = useState(false);
  const [roleViewed, setRoleViewed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine);
  const [setupStep, setSetupStep] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardEntry[]>(getLiveLeaderboard);
  const peerId = useRef(sessionStorage.getItem('cipher_live_peer_id') || makePeerId());
  const room = useRef<CipherPeerRoom>();
  const hostPeerId = useRef<string>();
  const rosterRef = useRef<OnlineProfile[]>([]);
  const matchRef = useRef<OnlinePublicState>();
  const assignmentsRef = useRef(new Map<string, OnlineAssignment>());
  const votesRef = useRef<Record<string, string | undefined>>({});
  const pendingTargetsRef = useRef<string[]>([]);
  const lockedTargetsRef = useRef<string[]>([]);
  const citizenWordRef = useRef('');
  const bodyguardUsedRef = useRef(false);
  const ejectionPositionRef = useRef(0);
  const activePromptRef = useRef<{ playerId: string; prompt: 'bodyguard' | 'inspector' | 'word'; targetId?: string }>();
  const messageHandler = useRef<(peerId: string, message: OnlineRoomMessage) => void>(() => undefined);

  useEffect(() => { sessionStorage.setItem('cipher_live_peer_id', peerId.current); }, []);
  useEffect(() => { rosterRef.current = roster; }, [roster]);
  useEffect(() => { matchRef.current = match; }, [match]);
  useEffect(() => () => room.current?.close(), []);
  useEffect(() => {
    const hidePrivateState = () => { if (document.hidden) { setRoleVisible(false); setSelectedVote(undefined); } };
    const blur = () => setRoleVisible(false);
    const release = () => setRoleVisible(false);
    document.addEventListener('visibilitychange', hidePrivateState);
    window.addEventListener('blur', blur);
    window.addEventListener('pointerup', release);
    window.addEventListener('touchend', release);
    window.addEventListener('touchcancel', release);
    return () => {
      document.removeEventListener('visibilitychange', hidePrivateState);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('touchend', release);
      window.removeEventListener('touchcancel', release);
    };
  }, []);
  useWakeLock(status === 'connected' && Boolean(match && match.phase !== 'results'));
  useEffect(() => {
    const online = () => setNetworkOnline(true); const offline = () => setNetworkOnline(false);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  useEffect(() => {
    if (!match || match.phase === 'results') return;
    const protect = (event:BeforeUnloadEvent) => { event.preventDefault(); event.returnValue=''; };
    window.addEventListener('beforeunload', protect); return () => window.removeEventListener('beforeunload', protect);
  }, [match]);
  useEffect(() => {
    if (match?.phase === 'results') setLeaderboard(recordLiveMatch(match));
  }, [match?.matchId, match?.phase]);
  useEffect(() => {
    const onBackGesture = () => { if (status === 'connected') setLeaveOpen(true); else onBack(); };
    const onNewGame = () => { if(role==='host') { room.current?.broadcast({type:'room-closed'} satisfies OnlineRoomMessage); localStorage.removeItem(LIVE_HOST_SNAPSHOT); } room.current?.close(); };
    window.addEventListener('cipher-back', onBackGesture);
    window.addEventListener('cipher-new-game', onNewGame);
    return () => { window.removeEventListener('cipher-back', onBackGesture); window.removeEventListener('cipher-new-game', onNewGame); };
  }, [status, onBack, role]);

  const sendRoster = (next: OnlineProfile[]) => room.current?.broadcast({ type: 'roster', roster: next } satisfies OnlineRoomMessage);
  const publishState = (next: OnlinePublicState) => {
    matchRef.current = next; setMatch(next); room.current?.broadcast({ type: 'match-state', state: next } satisfies OnlineRoomMessage);
    if (role === 'host' && code) try { localStorage.setItem(LIVE_HOST_SNAPSHOT, JSON.stringify({ code, state:next, roster:rosterRef.current, assignments:[...assignmentsRef.current], citizenWord:citizenWordRef.current, settings, bodyguardUsed:bodyguardUsedRef.current } satisfies LiveHostSnapshot)); } catch { /* Live recovery remains optional. */ }
  };
  const promptPlayer = (playerId: string, prompt: 'bodyguard' | 'inspector' | 'word', targetId?: string) => {
    activePromptRef.current = { playerId, prompt, targetId };
    if (playerId === peerId.current) setPrivatePrompt({ prompt, targetId });
    else room.current?.send(playerId, { type: 'private-prompt', prompt, targetId } satisfies OnlineRoomMessage);
  };

  const finishMatch = (winner: OnlinePublicState['winner'], winReason: string) => {
    const current = matchRef.current; if (!current) return;
    publishState({ ...current, phase: 'results', winner, winReason, players: onlineScoreboard({ ...current, winner }, assignmentsRef.current) });
    activePromptRef.current = undefined; setPrivatePrompt(undefined);
  };

  const beginNextRound = () => {
    const current = matchRef.current; if (!current) return;
    const first = current.players.findIndex(player => !player.eliminated && player.connected);
    votesRef.current = {}; lockedTargetsRef.current = []; pendingTargetsRef.current = []; setSelectedVote(undefined);
    activePromptRef.current = undefined;
    publishState({ ...current, phase: 'clues', round: current.round + 1, speakerIndex: Math.max(0, first), clueStartedAt: undefined, readyIds: [], votedIds: [], runoffCandidateIds: undefined, ejectedId: undefined, ejectionText: undefined });
  };

  const assessAfterEjection = () => {
    const current = matchRef.current; if (!current) return;
    const living = current.players.filter(player => !player.eliminated);
    const livingImposters = living.filter(player => assignmentsRef.current.get(player.id)?.role === 'imposter');
    const bad = living.filter(player => ['imposter', 'sleeper'].includes(assignmentsRef.current.get(player.id)?.role || 'citizen'));
    const citizens = living.filter(player => ['citizen', 'decoy', 'inspector', 'bodyguard'].includes(assignmentsRef.current.get(player.id)?.role || 'citizen'));
    if (!livingImposters.length) {
      const lastImposter = current.players.find(player => player.id === current.ejectedId && assignmentsRef.current.get(player.id)?.role === 'imposter');
      if (!lastImposter) { finishMatch('citizens', 'Every Imposter was ejected.'); return; }
      const inspector = living.find(player => assignmentsRef.current.get(player.id)?.role === 'inspector');
      publishState({ ...current, phase: 'counterplay' });
      promptPlayer(lastImposter.id, inspector ? 'inspector' : 'word');
      return;
    }
    if (bad.length >= citizens.length) { finishMatch('imposters', 'The Imposter bloc equals or outnumbers the Citizen team.'); return; }
    if (pendingTargetsRef.current.length) { ejectionPositionRef.current += 1; prepareEjection(pendingTargetsRef.current.shift()!); return; }
    beginNextRound();
  };

  const finalizeEjection = (targetId: string) => {
    const current = matchRef.current; if (!current) return;
    const target = current.players.find(player => player.id === targetId); if (!target) return;
    const targetRole = assignmentsRef.current.get(targetId)?.role;
    const nextPlayers = current.players.map(player => player.id === targetId ? { ...player, eliminated: true } : player);
    if (targetRole === 'anarchist' && ejectionPositionRef.current === 0) {
      publishState({ ...current, players: nextPlayers, ejectedId: targetId, ejectionText: `${target.name} was the Wild Card.`, phase: 'ejection' });
      finishMatch('anarchist', `${target.name} baited the table into an ejection and wins alone.`); return;
    }
    const remaining = nextPlayers.filter(player => !player.eliminated && assignmentsRef.current.get(player.id)?.role === 'imposter').length;
    const ejectionText = settings.ejectionReveal === 'confirm'
      ? `${target.name} was ${targetRole === 'imposter' ? 'an Imposter' : 'not an Imposter'}. ${remaining} Imposter${remaining === 1 ? '' : 's'} remaining.`
      : `${target.name} was ejected. Their identity remains classified.`;
    publishState({ ...current, players: nextPlayers, phase: 'ejection', ejectedId: targetId, ejectionText, votedIds: [] });
  };

  const prepareEjection = (targetId: string) => {
    const current = matchRef.current; if (!current) return;
    const guard = current.players.find(player => !player.eliminated && player.id !== targetId && assignmentsRef.current.get(player.id)?.role === 'bodyguard');
    if (guard && !bodyguardUsedRef.current && ['citizen', 'decoy', 'inspector', 'bodyguard'].includes(assignmentsRef.current.get(targetId)?.role || 'citizen')) {
      publishState({ ...current, phase: 'bodyguard' }); promptPlayer(guard.id, 'bodyguard', targetId); return;
    }
    finalizeEjection(targetId);
  };

  const resolveVotes = (votes: Record<string, string | undefined>) => {
    const current = matchRef.current; if (!current) return;
    const living = activePlayers(current);
    const skips = Object.values(votes).filter(value => !value).length;
    if (skips * 2 >= living.length) { beginNextRound(); return; }
    const counts: Record<string, number> = {};
    Object.values(votes).forEach(target => { if (target) counts[target] = (counts[target] || 0) + 1; });
    const ranked = [...living].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    if (current.runoffCandidateIds) {
      const leaders = ranked.filter(player => current.runoffCandidateIds?.includes(player.id));
      const top = counts[leaders[0]?.id] || 0;
      const tied = leaders.filter(player => (counts[player.id] || 0) === top);
      const targets = top >= 2 && tied.length === 1 ? [...lockedTargetsRef.current, tied[0].id] : [...lockedTargetsRef.current];
      if (!targets.length) { beginNextRound(); return; }
      ejectionPositionRef.current = 0; pendingTargetsRef.current = targets.slice(1); prepareEjection(targets[0]); return;
    }
    const slots = Math.min(settings.eliminations, Math.max(1, living.length - 1));
    const cutoff = counts[ranked[slots - 1]?.id] || 0;
    const locked = ranked.filter(player => (counts[player.id] || 0) > cutoff && (counts[player.id] || 0) >= 2).map(player => player.id).slice(0, slots);
    const tied = ranked.filter(player => (counts[player.id] || 0) === cutoff && cutoff >= 2).map(player => player.id);
    const valid = ranked.slice(0, slots).filter(player => (counts[player.id] || 0) >= 2).map(player => player.id);
    if (!valid.length) { beginNextRound(); return; }
    if (tied.length > slots - locked.length) {
      lockedTargetsRef.current = locked; votesRef.current = {}; setSelectedVote(undefined);
      publishState({ ...current, phase: 'voting', runoffCandidateIds: tied, votedIds: [] }); return;
    }
    ejectionPositionRef.current = 0; pendingTargetsRef.current = valid.slice(1); prepareEjection(valid[0]);
  };

  const receiveHostAction = (_remoteId: string, message: OnlineRoomMessage) => {
    const current = matchRef.current;
    if (message.type === 'ready' && current?.phase === 'reveal') {
      const readyIds = [...new Set([...current.readyIds, message.playerId])];
      const next = { ...current, readyIds }; publishState(next);
      if (activePlayers(next).every(player => readyIds.includes(player.id))) publishState({ ...next, phase: 'clues', speakerIndex: Math.max(0, next.players.findIndex(player => !player.eliminated && player.connected)), clueStartedAt: Date.now(), clueDuration: 20, cluePreSeconds: 3 });
    }
    if (message.type === 'clue-start' && current?.phase === 'clues' && current.players[current.speakerIndex]?.id === message.playerId && !current.clueStartedAt) {
      publishState({ ...current, clueStartedAt: Date.now(), clueDuration: 20, cluePreSeconds: 3 });
    }
    if (message.type === 'clue-done' && current?.phase === 'clues' && current.players[current.speakerIndex]?.id === message.playerId) {
      let nextIndex = current.speakerIndex + 1;
      while (nextIndex < current.players.length && (current.players[nextIndex].eliminated || !current.players[nextIndex].connected)) nextIndex += 1;
      publishState(nextIndex < current.players.length ? { ...current, speakerIndex: nextIndex, clueStartedAt: Date.now(), clueDuration: 20, cluePreSeconds: 3 } : { ...current, phase: 'voting', clueStartedAt: undefined, votedIds: [], runoffCandidateIds: undefined });
    }
    if (message.type === 'vote' && current?.phase === 'voting' && !current.votedIds.includes(message.voterId)) {
      votesRef.current = { ...votesRef.current, [message.voterId]: message.targetId };
      const votedIds = [...current.votedIds, message.voterId]; publishState({ ...current, votedIds });
      if (votedIds.length >= activePlayers(current).length) publishState({ ...current, phase: 'vote_ready', votedIds });
    }
    if (message.type === 'resolve-votes' && current?.phase === 'vote_ready') resolveVotes(votesRef.current);
    if (message.type === 'bodyguard-choice' && current?.phase === 'bodyguard') {
      activePromptRef.current = undefined; setPrivatePrompt(undefined); bodyguardUsedRef.current = true;
      if (message.pardon) {
        if (pendingTargetsRef.current.length) { ejectionPositionRef.current += 1; prepareEjection(pendingTargetsRef.current.shift()!); } else beginNextRound();
      } else finalizeEjection(message.targetId);
    }
    if (message.type === 'counter-inspector' && current?.phase === 'counterplay') {
      const inspector = current.players.find(player => !player.eliminated && assignmentsRef.current.get(player.id)?.role === 'inspector');
      if (message.targetId !== inspector?.id) finishMatch('citizens', 'The final Imposter failed to identify the Inspector.');
      else promptPlayer(message.playerId, 'word');
    }
    if (message.type === 'counter-word' && current?.phase === 'counterplay') {
      const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean(message.word) === clean(citizenWordRef.current)) finishMatch('imposters', 'The final Imposter decoded the Citizen word.');
      else finishMatch('citizens', 'The final Imposter failed the Last Stand word guess.');
    }
  };

  messageHandler.current = (remoteId, message) => {
    if (role === 'host') {
      if (message.type === 'profile') {
        const existing = rosterRef.current.find(profile => profile.id === message.profile.id);
        if (matchRef.current && !existing) { room.current?.send(message.profile.id, { type: 'room-error', message: 'This match has already started. Join the next game with the same room code.' }); return; }
        const duplicate = rosterRef.current.find(profile => profile.id !== message.profile.id && profile.name.trim().toLowerCase() === message.profile.name.trim().toLowerCase());
        if (duplicate) { room.current?.send(message.profile.id, { type: 'room-error', message: 'That name is already in this room. Choose a different name.' }); return; }
        const next = existing ? rosterRef.current.map(profile => profile.id === message.profile.id ? { ...message.profile, connected: true } : profile) : [...rosterRef.current, message.profile];
        rosterRef.current = next; setRoster(next); sendRoster(next);
        const current = matchRef.current; const savedAssignment = assignmentsRef.current.get(message.profile.id);
        const reconnectedState = current ? { ...current, players: current.players.map(player => player.id === message.profile.id ? { ...player, connected: true, photo: message.profile.photo } : player) } : undefined;
        if (reconnectedState) publishState(reconnectedState);
        if (reconnectedState) room.current?.send(message.profile.id, { type: 'match-state', state: reconnectedState });
        if (savedAssignment) room.current?.send(message.profile.id, { type: 'private-assignment', assignment: savedAssignment });
        const activePrompt = activePromptRef.current;
        if (activePrompt?.playerId === message.profile.id) room.current?.send(message.profile.id, { type: 'private-prompt', prompt: activePrompt.prompt, targetId: activePrompt.targetId });
      } else receiveHostAction(remoteId, message);
    } else {
      if (message.type === 'roster') setRoster(message.roster);
      if (message.type === 'match-state') { matchRef.current = message.state; setMatch(message.state); if (!['bodyguard', 'counterplay'].includes(message.state.phase)) setPrivatePrompt(undefined); if (message.state.phase === 'voting' && !message.state.votedIds.includes(peerId.current)) setSelectedVote(undefined); }
      if (message.type === 'private-assignment') { setAssignment(message.assignment); setRoleVisible(false); setCounterWord(''); }
      if (message.type === 'private-prompt') setPrivatePrompt(message);
      if (message.type === 'room-error') { room.current?.close(); setStatus('error'); setNotice(message.message); setMatch(undefined); }
      if (message.type === 'room-closed') { room.current?.close(); setStatus('error'); setNotice('The host ended this room.'); setMatch(undefined); }
    }
  };

  const connect = () => {
    if (!endpoint) { setStatus('error'); setNotice('This deployment needs VITE_SIGNALING_URL. See README for setup.'); return; }
    if (!name.trim()) { setNotice('Add your name first.'); return; }
    const roomCode = role === 'host' ? code || makeRoomCode() : code.trim().toUpperCase();
    if (!roomCode) { setNotice('Enter the six-character room code.'); return; }
    setCode(roomCode); setNotice(''); localStorage.setItem('cipher_live_name', name.trim());
    const roomUrl = new URL(location.href); roomUrl.searchParams.set('room', roomCode); if (role==='host') roomUrl.searchParams.set('host','1'); else roomUrl.searchParams.delete('host'); history.replaceState(null,'',roomUrl);
    const me: OnlineProfile = { id: peerId.current, name: name.trim(), photo, connected: true };
    if (role === 'host') {
      let restored:LiveHostSnapshot|undefined; try { const raw=localStorage.getItem(LIVE_HOST_SNAPSHOT); const parsed=raw?JSON.parse(raw) as LiveHostSnapshot:undefined; if(parsed?.code===roomCode&&parsed.state?.phase!=='results')restored=parsed; } catch { /* Start a clean room. */ }
      if(restored){const restoredRoster=restored.roster.map(profile=>profile.id===me.id?me:{...profile,connected:false});rosterRef.current=restoredRoster;setRoster(restoredRoster);matchRef.current=restored.state;setMatch({...restored.state,players:restored.state.players.map(player=>player.id===me.id?{...player,...me}:{...player,connected:false})});assignmentsRef.current=new Map(restored.assignments);citizenWordRef.current=restored.citizenWord;bodyguardUsedRef.current=restored.bodyguardUsed;setSettings(restored.settings);setAssignment(assignmentsRef.current.get(me.id));setNotice('Recovered the live match. Other players can rejoin their seats.');}
      else { rosterRef.current = [me]; setRoster([me]); }
    }
    room.current = new CipherPeerRoom({
      onStatus: (next, message) => { setStatus(next); if (message) setNotice(message); if (next === 'connected' && role === 'host') setInviteOpen(true); },
      onPeerOpen: remoteId => { if (role === 'player') { hostPeerId.current = remoteId; room.current?.send(remoteId, { type: 'profile', profile: me }); } },
      onPeerClose: remoteId => { if (role === 'host') { const next = rosterRef.current.map(profile => profile.id === remoteId ? { ...profile, connected: false } : profile); rosterRef.current = next; setRoster(next); sendRoster(next); if (matchRef.current) { const nextMatch = { ...matchRef.current, players: matchRef.current.players.map(player => player.id === remoteId ? { ...player, connected: false } : player) }; publishState(nextMatch); if (nextMatch.phase === 'voting' && nextMatch.votedIds.length >= activePlayers(nextMatch).length) publishState({ ...nextMatch, phase: 'vote_ready' }); if (nextMatch.phase === 'clues' && nextMatch.players[nextMatch.speakerIndex]?.id === remoteId) receiveHostAction(remoteId, { type: 'clue-done', playerId: remoteId }); } } else { setStatus('error'); setNotice('Connection lost. Tap Join room to restore your seat.'); } },
      onData: (remoteId, raw) => messageHandler.current(remoteId, raw as OnlineRoomMessage)
    });
    room.current.connect(endpoint, roomCode, peerId.current, role === 'host');
  };

  const startMatch = async () => {
    const connected = rosterRef.current.filter(profile => profile.connected);
    if (connected.length < 4) { setNotice(`${4 - connected.length} more player${4 - connected.length === 1 ? '' : 's'} needed.`); return; }
    const category = settings.categoryId === 'variety'
      ? { id: 'variety', name: 'Daily Deck', iconName: 'Sparkles', description: 'A fresh Philippine-time rotation.', pairs: getDailyDeck([...BUILT_IN_CATEGORIES,DAILY_VAULT_CATEGORY].flatMap(item => item.pairs.filter(pair => pair.difficulty === 'easy'))) }
      : [...BUILT_IN_CATEGORIES,DAILY_VAULT_CATEGORY].find(item => item.id === settings.categoryId) || BUILT_IN_CATEGORIES[0];
    const easyPairs = category.pairs.filter(pair => pair.difficulty === 'easy');
    let pair;
    try {
      pair = await selectCrewPair({ ...category, pairs: easyPairs.length ? easyPairs : category.pairs });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No fresh word pair is available.');
      return;
    }
    const maxImposters = connected.length < 7 ? 1 : connected.length < 10 ? 2 : 3;
    const safeSettings = { ...settings, imposters: Math.min(settings.imposters, maxImposters) as 1 | 2 | 3 };
    const generated = createOnlineAssignments(connected, safeSettings, category, pair);
    assignmentsRef.current = generated.assignments; citizenWordRef.current = generated.citizenWord; bodyguardUsedRef.current = false; activePromptRef.current = undefined; setRoleVisible(false); setRoleViewed(false); setCounterWord(''); setSelectedVote(undefined);
    const next = buildInitialOnlineState(connected, generated.categoryName, safeSettings.allowSkip); matchRef.current = next; setMatch(next);
    generated.assignments.forEach((privateAssignment, playerId) => {
      if (playerId === peerId.current) setAssignment(privateAssignment);
      else room.current?.send(playerId, { type: 'private-assignment', assignment: privateAssignment });
    });
    publishState(next);
  };

  const sendAction = (message: OnlineRoomMessage) => {
    if (role === 'host') receiveHostAction(peerId.current, message);
    else if (hostPeerId.current) room.current?.send(hostPeerId.current, message);
  };
  const inviteUrl = `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`;
  const copyInvite = async () => { await navigator.clipboard.writeText(inviteUrl); setInviteCopied(true); window.setTimeout(() => setInviteCopied(false), 1600); };
  const shareInvite = async () => {
    if (navigator.share) await navigator.share({ title: 'Join my Cipher room', text: `Join room ${code}`, url: inviteUrl });
    else await copyInvite();
  };
  const removePlayer = (playerId: string) => {
    const profile = rosterRef.current.find(player => player.id === playerId); if (!profile || playerId === peerId.current || matchRef.current) return;
    room.current?.send(playerId, { type: 'room-error', message: 'The host removed you from this lobby.' });
    window.setTimeout(() => room.current?.disconnect(playerId), 50);
    const next = rosterRef.current.filter(player => player.id !== playerId); rosterRef.current = next; setRoster(next); sendRoster(next);
  };
  const leaveRoom = () => { if (role === 'host') { room.current?.broadcast({ type: 'room-closed' }); localStorage.removeItem(LIVE_HOST_SNAPSHOT); } room.current?.close(); sessionStorage.removeItem('cipher_live_peer_id'); setPhoto(undefined); const clean=new URL(location.href);clean.searchParams.delete('room');clean.searchParams.delete('host');history.replaceState(null,'',clean);onBack(); };

  if (status === 'idle' || status === 'error') return <JoinRoom initialCrew={initialCrew} role={role} setRole={setRole} name={name} setName={setName} code={code} setCode={setCode} photo={photo} notice={notice} onBack={onBack} onSelfie={() => setSelfieOpen(true)} onConnect={connect} selfieOpen={selfieOpen} setSelfieOpen={setSelfieOpen} setPhoto={setPhoto} />;

  const me = match?.players.find(player => player.id === peerId.current);
  const currentSpeaker = match?.players[match.speakerIndex];
  const candidates = match?.players.filter(player => !player.eliminated && player.connected && player.id !== peerId.current && (!match.runoffCandidateIds || match.runoffCandidateIds.includes(player.id))) || [];

  return <div className="mx-auto w-full max-w-lg px-4 py-8">
    <div className="flex items-center justify-between"><div><p className="cipher-kicker">Live case / room</p><h1 className="font-mono text-2xl font-black tracking-[.14em] text-stone-50">{code}</h1></div><div className="flex gap-2"><button className="cipher-button-secondary px-3" onClick={() => setInviteOpen(true)}><QrCode className="h-4 w-4" /> Invite</button><button className="cipher-button-ghost px-3" onClick={() => setLeaveOpen(true)}>Leave</button></div></div>
    <div className={`mt-5 flex items-center gap-2 rounded-xl border p-3 text-xs ${networkOnline?'border-emerald-500/20 bg-emerald-500/10 text-emerald-300':'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}><Radio className="h-4 w-4" /> {networkOnline?`Peer room connected · ${roster.filter(player => player.connected).length} online`:'You are offline · actions will resume after reconnecting'}</div>

    {!match && <Lobby role={role} roster={roster} settings={settings} setSettings={setSettings} setupStep={setupStep} setSetupStep={setSetupStep} onInvite={()=>setInviteOpen(true)} onStart={startMatch} onRemove={removePlayer} myId={peerId.current} notice={notice} />}

    {match?.phase === 'reveal' && assignment && <section className="cipher-panel mt-6 p-6 text-center"><p className="cipher-kicker">Private role · {match.readyIds.length} of {activePlayers(match).length} ready</p><PlayerAvatar name={name} src={photo} className="mx-auto mt-5 h-24 w-24"/><h2 className={roleVisible?'role-emphasis mt-4 text-stone-100':'mt-4 text-2xl font-black text-stone-100'}>{roleVisible ? (assignment.role==='decoy'?'Citizen':getRoleDefinition(assignment.role).name) : `Private card for ${name}`}</h2>{roleVisible ? <div className="mt-5 space-y-3"><div className="secret-word-focus"><small>Your word</small><p>{assignment.word}</p></div><p className="text-sm text-stone-400">{ROLE_COPY[assignment.role]}</p>{assignment.intel && <p className="rounded-xl bg-sky-500/10 p-3 text-xs text-sky-300">{assignment.intel}</p>}{assignment.teammates.length > 0 && <p className="text-xs text-stone-400">Teammates: {assignment.teammates.join(', ')}</p>}</div> : <p className="mt-3 text-xs text-stone-500">{roleViewed ? 'Hold again if you need another look.' : 'Shield your screen, then press and hold. You can slide your finger away after the hold starts.'}</p>}<button onPointerDown={event => { event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Global release listeners remain the fallback. */ } setRoleVisible(true); setRoleViewed(true); }} onPointerUp={() => setRoleVisible(false)} onPointerCancel={event => { if (event.pointerType !== 'touch') setRoleVisible(false); }} onTouchMove={event => event.preventDefault()} className={roleVisible?'reveal-hold-capture touch-none':'cipher-button-secondary mt-5 w-full touch-none'}>{!roleVisible&&<><Eye className="h-4 w-4" /> Press and hold to view</>}</button><button disabled={!roleViewed || roleVisible || match.readyIds.includes(peerId.current)} onClick={() => sendAction({ type: 'ready', playerId: peerId.current })} className="cipher-button-primary mt-3 w-full disabled:opacity-30"><Check className="h-4 w-4" /> {match.readyIds.includes(peerId.current) ? 'Ready · waiting for others' : 'Hide card and mark ready'}</button></section>}

    {match?.phase === 'clues' && <LiveCluePanel match={match} currentSpeaker={currentSpeaker} canControl={currentSpeaker?.id===peerId.current || role==='host'} onStart={()=>sendAction({type:'clue-start',playerId:currentSpeaker?.id || peerId.current})} onDone={()=>sendAction({type:'clue-done',playerId:currentSpeaker?.id || peerId.current})}/>}

    {match?.phase === 'voting' && me && !me.eliminated && <section className="cipher-panel mt-6 p-5"><p className="cipher-kicker">{match.runoffCandidateIds ? 'Silent runoff' : `Round ${match.round} / silent ballot`}</p><h2 className="mt-2 text-2xl font-black text-stone-100">{selectedVote ? 'Check your ballot.' : 'Pick a suspect.'}</h2>{!match.votedIds.includes(peerId.current) && !selectedVote && <><div className="mt-4 grid grid-cols-3 gap-2">{candidates.map(player => <button key={player.id} onClick={() => setSelectedVote(player.id)} className="rounded-2xl border border-white/10 p-2"><PlayerAvatar name={player.name} src={player.photo} className="aspect-square w-full"/><span className="mt-2 block truncate text-[10px] text-stone-100">{player.name}</span></button>)}</div>{match.allowSkip && !match.runoffCandidateIds && <button onClick={() => setSelectedVote('skip')} className="cipher-button-ghost mt-3 w-full"><FastForward className="h-4 w-4" /> Skip</button>}</>}{!match.votedIds.includes(peerId.current) && selectedVote && <div className="vote-confirmation mt-5"><p>{selectedVote === 'skip' ? 'Submit a blank ballot?' : `Vote for ${candidates.find(player => player.id === selectedVote)?.name}?`}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setSelectedVote(undefined)} className="cipher-button-secondary">Change</button><button onClick={() => sendAction({ type: 'vote', voterId: peerId.current, targetId: selectedVote === 'skip' ? undefined : selectedVote })} className="cipher-button-primary">{selectedVote === 'skip' ? 'Confirm skip' : 'Confirm vote'}</button></div></div>}<p className="mt-4 text-center text-xs text-stone-500">{match.votedIds.includes(peerId.current) ? 'Ballot locked. Results stay hidden until everyone votes.' : `${match.votedIds.length} of ${activePlayers(match).length} ballots locked`}</p></section>}
    {match?.phase === 'voting' && me?.eliminated && <section className="cipher-panel mt-6 p-6 text-center"><Eye className="mx-auto h-8 w-8 text-stone-500"/><h2 className="mt-4 text-2xl font-black text-stone-100">Observe the ballot</h2><p className="mt-2 text-sm text-stone-500">Ejected players cannot vote. {match.votedIds.length} of {activePlayers(match).length} living players have voted.</p></section>}
    {match?.phase === 'vote_ready' && <section className="cipher-panel mt-6 p-6 text-center"><Check className="mx-auto h-9 w-9 text-emerald-300"/><p className="cipher-kicker mt-4">All votes are in</p><h2 className="mt-2 text-3xl font-black text-stone-100">Ballot locked.</h2><p className="mt-3 text-sm text-stone-500">The result stays hidden until the host reveals it to everyone.</p>{role === 'host' ? <button onClick={() => sendAction({ type: 'resolve-votes', playerId: peerId.current })} className="cipher-button-primary mt-5 w-full">Reveal ballot result</button> : <p className="mt-5 text-xs text-stone-500">Waiting for the host.</p>}</section>}

    {match?.phase === 'bodyguard' && <PrivateActionCard prompt={privatePrompt} match={match} counterWord={counterWord} setCounterWord={setCounterWord} onAction={sendAction} playerId={peerId.current} />}
    {match?.phase === 'counterplay' && <PrivateActionCard prompt={privatePrompt} match={match} counterWord={counterWord} setCounterWord={setCounterWord} onAction={sendAction} playerId={peerId.current} />}
    {(match?.phase === 'bodyguard' || match?.phase === 'counterplay') && !privatePrompt && <section className="cipher-panel mt-6 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-violet-300"/><h2 className="mt-4 text-2xl font-black text-stone-100">Private action in progress</h2><p className="mt-2 text-sm text-stone-500">The correct player has the confidential prompt on their device.</p></section>}

    {match?.phase === 'ejection' && <section className="cipher-panel mt-6 p-6 text-center"><Skull className="mx-auto h-9 w-9 text-rose-300"/><p className="cipher-kicker mt-4">Ejection report</p><h2 className="mt-2 text-2xl font-black text-stone-100">{match.ejectionText}</h2>{role === 'host' && <button onClick={assessAfterEjection} className="cipher-button-primary mt-5 w-full">Continue case</button>} {role !== 'host' && <p className="mt-4 text-xs text-stone-500">Waiting for the host.</p>}</section>}

    {match?.phase === 'results' && <><section className="cipher-panel mt-6 p-6 text-center"><p className="cipher-kicker">Case closed</p><h2 className="mt-2 font-display text-4xl font-black capitalize text-stone-100">{match.winner} win</h2><p className="mt-3 text-sm text-stone-500">{match.winReason}</p><div className="mt-5 space-y-2">{[...match.players].sort((a,b) => b.score-a.score).map((player,index) => <div key={player.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-left"><span className="font-mono text-xs text-stone-500">#{index+1}</span><PlayerAvatar name={player.name} src={player.photo} className="h-11 w-11"/><strong className="flex-1 text-stone-100">{player.name}</strong><span className="font-mono text-amber-300">{player.score} pts</span></div>)}</div>{role === 'host' && <div className="mt-5 grid grid-cols-[1fr_auto] gap-2"><button onClick={startMatch} className="cipher-button-primary">Same group · fresh words</button><button onClick={() => setInviteOpen(true)} className="cipher-icon-button" aria-label="Invite players"><QrCode className="h-5 w-5"/></button></div>}</section><section className="cipher-panel mt-4 p-5"><div className="text-left"><p className="cipher-kicker">Device leaderboard</p><h3 className="mt-2 text-xl font-black text-stone-100">Same names, running totals</h3><p className="mt-1 text-xs text-stone-500">Scores stay on this device until app data is reset.</p></div><div className="mt-4 space-y-1">{leaderboard.slice(0,10).map((entry,index)=><div key={entry.name.toLocaleLowerCase()} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-t border-white/[0.06] py-3 text-left"><span className="font-mono text-[10px] text-stone-600">{String(index+1).padStart(2,'0')}</span><div><strong className="block text-sm text-stone-200">{entry.name}</strong><small className="text-stone-600">{entry.gamesPlayed} game{entry.gamesPlayed===1?'':'s'}</small></div><strong className="font-display text-lg text-amber-300">{entry.totalPoints}</strong></div>)}</div></section></>}
    {inviteOpen && createPortal(<InviteRoomModal code={code} inviteUrl={inviteUrl} roster={roster} copied={inviteCopied} onCopy={() => void copyInvite()} onShare={() => void shareInvite()} onClose={() => setInviteOpen(false)} />, document.body)}
    {leaveOpen && createPortal(<div className="vote-popup" role="dialog" aria-modal="true" aria-label="Leave live room"><section><p className="cipher-eyebrow">Leave live room?</p><h3 className="mt-2 font-display text-3xl font-black">{role==='host'?'This ends the room for everyone.':'Your seat will be marked offline.'}</h3><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={()=>setLeaveOpen(false)} className="cipher-button-secondary">Stay</button><button onClick={leaveRoom} className="cipher-button-primary">Leave room</button></div></section></div>,document.body)}
  </div>;
};

const JoinRoom = ({ initialCrew, role, setRole, name, setName, code, setCode, photo, notice, onBack, onSelfie, onConnect, selfieOpen, setSelfieOpen, setPhoto }: any) => <div className="mx-auto w-full max-w-lg px-4 py-8"><button onClick={onBack} className="cipher-button-ghost px-3"><ArrowLeft className="h-4 w-4" /> Modes</button><p className="cipher-kicker mt-8">Live room</p><h1 className="mt-2 font-display text-4xl font-black text-stone-50">Every phone joins the case.</h1>{initialCrew && <div className="crew-ticket mt-5"><div><small>Crew</small><strong>{initialCrew.name}</strong></div><div><small>Expected</small><strong>{initialCrew.members.filter((member:any)=>member.active).length}</strong></div><div><small>Deck</small><strong>Shared</strong></div></div>}<div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => setRole('host')} className={`rounded-2xl border p-4 text-left ${role === 'host' ? 'border-rose-500 bg-rose-500/10' : 'border-white/10'}`}><strong className="text-stone-100">Host room</strong><small className="mt-1 block text-stone-500">Runs the match</small></button><button onClick={() => setRole('player')} className={`rounded-2xl border p-4 text-left ${role === 'player' ? 'border-sky-500 bg-sky-500/10' : 'border-white/10'}`}><strong className="text-stone-100">Join room</strong><small className="mt-1 block text-stone-500">Private dashboard</small></button></div><div className="cipher-panel mt-4 space-y-3 p-5">{initialCrew&&<select className="cipher-input w-full" value={name} onChange={(event:React.ChangeEvent<HTMLSelectElement>)=>setName(event.target.value)}><option value="">Choose your Crew profile</option>{initialCrew.members.filter((member:any)=>member.active).map((member:any)=><option key={member.id} value={member.name}>{member.name}</option>)}</select>}<input className="cipher-input w-full" value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} placeholder="Your name" maxLength={24}/>{role === 'player' && <input className="cipher-input w-full uppercase tracking-[.3em]" value={code} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)} placeholder="ROOM CODE" maxLength={6}/>}<button onClick={onSelfie} className="cipher-button-secondary w-full">{photo ? <><Check className="h-4 w-4" /> Selfie ready</> : 'Add optional selfie'}</button>{notice && <p className="text-xs leading-5 text-rose-300">{notice}</p>}<button onClick={onConnect} className="cipher-button-primary w-full"><Wifi className="h-4 w-4" /> {role === 'host' ? 'Create room' : 'Join room'}</button></div><SelfieCaptureModal playerName={selfieOpen ? name || 'Player' : null} onClose={() => setSelfieOpen(false)} onCapture={(image: string) => { setPhoto(image); setSelfieOpen(false); }}/></div>;

const Lobby = ({ role, roster, settings, setSettings, setupStep, setSetupStep, onInvite, onStart, onRemove, myId, notice }: { role: 'host'|'player'; roster: OnlineProfile[]; settings: OnlineSettings; setSettings: React.Dispatch<React.SetStateAction<OnlineSettings>>; setupStep:number; setSetupStep:(step:number)=>void; onInvite:()=>void; onStart: () => void; onRemove: (id:string)=>void; myId:string; notice: string }) => {
  const online=roster.filter(player=>player.connected).length;
  const rosterGrid=<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{roster.map(profile => <div key={profile.id} className="evidence-note relative rounded-2xl border border-white/10 p-2 text-center"><PlayerAvatar name={profile.name} src={profile.photo} className="aspect-square w-full"/><span className="mt-2 block truncate text-[11px] font-bold text-stone-100">{profile.name}</span><span className={`text-[8px] uppercase ${profile.connected ? 'text-emerald-300' : 'text-stone-600'}`}>{profile.connected ? 'ready' : 'reconnecting'}</span>{role==='host'&&profile.id!==myId&&<button onClick={()=>onRemove(profile.id)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-stone-950/75 text-stone-300" aria-label={`Remove ${profile.name}`}><UserMinus className="h-3.5 w-3.5"/></button>}</div>)}</div>;
  if(role==='player') return <div className="mt-6">{rosterGrid}<div className="cipher-panel mt-5 p-6 text-center"><Radio className="mx-auto h-7 w-7 text-sky-300"/><p className="mt-3 text-sm text-stone-400">You are ready. The host is setting up the game.</p></div></div>;
  const titles=['Who is playing?','Set the rules.','Choose the deck.','Ready to deal?'];
  return <div className="live-setup mt-6"><div className="setup-progress"><p className="cipher-kicker">Live setup · {setupStep+1} of 4</p><div>{[0,1,2,3].map(step=><span key={step} className={step<=setupStep?'active':''}/>)}</div></div><section className="cipher-panel mt-4 p-5"><h2 className="font-display text-3xl font-black text-stone-100">{titles[setupStep]}</h2>
    {setupStep===0&&<div className="mt-5">{rosterGrid}<button onClick={onInvite} className="cipher-button-secondary mt-4 w-full"><QrCode className="h-4 w-4"/>Invite more players</button><p className="mt-3 text-xs text-stone-500">{online<4?`${4-online} more player${4-online===1?'':'s'} needed to start.`:`${online} players are ready.`}</p></div>}
    {setupStep===1&&<div className="mt-5 space-y-4"><div className="grid grid-cols-2 gap-2"><SettingSelect label="Imposters" value={settings.imposters} values={[1,2,3]} onChange={value => setSettings(current => ({...current,imposters:Number(value) as 1|2|3}))}/><SettingSelect label="Decoys" value={settings.decoys} values={[0,1,2]} onChange={value => setSettings(current => ({...current,decoys:Number(value) as 0|1|2}))}/><SettingSelect label="Ejections" value={settings.eliminations} values={[1,2]} onChange={value => setSettings(current => ({...current,eliminations:Number(value) as 1|2}))}/><SettingSelect label="Reveal" value={settings.ejectionReveal} values={['confirm','classified']} onChange={value => setSettings(current => ({...current,ejectionReveal:value as 'confirm'|'classified'}))}/></div><label className="settings-row w-full"><span>Allow skip</span><input type="checkbox" checked={settings.allowSkip} onChange={event => setSettings(current => ({...current,allowSkip:event.target.checked}))}/></label></div>}
    {setupStep===2&&<label className="mt-5 block text-xs text-stone-400">Easy word pack<select className="cipher-input mt-2 w-full" value={settings.categoryId} onChange={event => setSettings(current => ({...current,categoryId:event.target.value}))}><option value="variety">Variety Deck · 40 pairs</option>{BUILT_IN_CATEGORIES.filter(category => category.pairs.some(pair => pair.difficulty === 'easy')).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><p className="mt-3 leading-5 text-stone-500">Played-word history stays protected across rematches and crew sessions.</p></label>}
    {setupStep===3&&<div className="mt-5 space-y-3"><div className="crew-ticket"><div><small>Players</small><strong>{online}</strong></div><div><small>Imposters</small><strong>{settings.imposters}</strong></div><div><small>Deck</small><strong>{settings.categoryId==='variety'?'Daily':BUILT_IN_CATEGORIES.find(category=>category.id===settings.categoryId)?.name||'Custom'}</strong></div></div><p className="text-xs leading-5 text-stone-500">{settings.eliminations} ejection{settings.eliminations===1?'':'s'} per vote · {settings.allowSkip?'skip allowed':'no skipping'} · {settings.ejectionReveal==='confirm'?'identity confirmed':'identity classified'}</p>{notice&&<p className="text-xs text-rose-300">{notice}</p>}</div>}
    <div className="mt-6 grid grid-cols-[auto_1fr] gap-2">{setupStep>0?<button onClick={()=>setSetupStep(setupStep-1)} className="cipher-button-secondary px-4"><ArrowLeft className="h-4 w-4"/>Back</button>:<span/>}{setupStep<3?<button onClick={()=>setSetupStep(setupStep+1)} className="cipher-button-primary">{setupStep===0?'Set game rules':setupStep===1?'Choose word deck':'Review game'}</button>:<button onClick={onStart} disabled={online<4} className="cipher-button-primary disabled:opacity-30"><Send className="h-4 w-4"/>{online<4?`Need ${4-online} more`:`Start game with ${online}`}</button>}</div>
  </section></div>;
};

const LiveCluePanel=({match,currentSpeaker,canControl,onStart,onDone}:{match:OnlinePublicState;currentSpeaker?:OnlineProfile;canControl:boolean;onStart:()=>void;onDone:()=>void})=>{
  const [now,setNow]=useState(Date.now());
  const lastSound=useRef('');
  useEffect(()=>{setNow(Date.now());lastSound.current='';if(!match.clueStartedAt)return;const id=window.setInterval(()=>setNow(Date.now()),200);return()=>window.clearInterval(id);},[match.clueStartedAt,currentSpeaker?.id]);
  const pre=match.cluePreSeconds??3;const duration=match.clueDuration??20;const elapsed=match.clueStartedAt?Math.max(0,(now-match.clueStartedAt)/1000):0;
  const preLeft=Math.max(0,Math.ceil(pre-elapsed));const runElapsed=Math.max(0,elapsed-pre);const timeLeft=Math.max(0,Math.ceil(duration-runElapsed));
  const phase=!match.clueStartedAt?'ready':elapsed<pre?'pre':runElapsed<duration?'run':'time';
  useEffect(()=>{const key=phase==='pre'?`pre-${preLeft}`:phase==='run'?`run-${timeLeft}`:phase;if(lastSound.current===key)return;lastSound.current=key;if(phase==='pre')playCountdown(preLeft);if(phase==='run')playTick();if(phase==='time')playCountdown(0);},[phase,preLeft,timeLeft]);
  return <section className="cipher-panel mt-6 p-5 text-center"><p className="cipher-kicker">Round {match.round} / clue sequence</p><PlayerAvatar name={currentSpeaker?.name||''} src={currentSpeaker?.photo} className="mx-auto mt-4 h-20 w-20"/><h2 className="mt-3 text-3xl font-black">{currentSpeaker?.name ? `${currentSpeaker.name}'s clue` : 'Next clue'}</h2><div className="live-timer mt-4"><strong>{phase==='ready'?'READY':phase==='pre'?(preLeft||'GO'):phase==='time'?'TIME':String(timeLeft).padStart(2,'0')}</strong></div>{canControl&&phase==='ready'&&<button onClick={onStart} className="cipher-button-primary mt-4 w-full">Start 3-second countdown</button>}{canControl&&phase!=='ready'&&<button onClick={onDone} className="cipher-button-primary mt-3 w-full"><Send className="h-4 w-4"/>Clue given · next player</button>} {!canControl&&<p className="mt-4 text-xs text-stone-500">Timer is synced from the active player or host.</p>}</section>;
};

const InviteRoomModal = ({code,inviteUrl,roster,copied,onCopy,onShare,onClose}:{code:string;inviteUrl:string;roster:OnlineProfile[];copied:boolean;onCopy:()=>void;onShare:()=>void;onClose:()=>void}) => {
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=16&format=svg&data=${encodeURIComponent(inviteUrl)}`;
  return <div className="invite-overlay" role="dialog" aria-modal="true" aria-labelledby="invite-title" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="invite-sheet"><header><div><p className="cipher-kicker">Quick invite</p><h2 id="invite-title">Scan to join</h2></div><button onClick={onClose} className="share-close" aria-label="Close invite"><X className="h-5 w-5"/></button></header><div className="invite-body"><img src={qrUrl} alt={`QR code to join Cipher room ${code}`}/><div className="invite-code"><small>Room code</small><strong>{code}</strong></div><p>{roster.filter(player=>player.connected).length} player{roster.filter(player=>player.connected).length===1?'':'s'} joined</p><div className="invite-avatars">{roster.filter(player=>player.connected).slice(0,8).map(player=><PlayerAvatar key={player.id} name={player.name} src={player.photo} className="h-10 w-10"/>)}</div><div className="grid grid-cols-2 gap-2"><button onClick={onCopy} className="cipher-button-secondary"><Copy className="h-4 w-4"/>{copied?'Copied':'Copy link'}</button><button onClick={onShare} className="cipher-button-primary"><Share2 className="h-4 w-4"/>Share invite</button></div><small className="invite-help">The code and link stop working when the host closes the room.</small></div></section></div>;
};

const SettingSelect = ({label,value,values,onChange}:{label:string;value:string|number;values:(string|number)[];onChange:(value:string)=>void}) => <label className="text-[10px] uppercase tracking-wider text-stone-500">{label}<select className="cipher-input mt-1 w-full" value={value} onChange={event=>onChange(event.target.value)}>{values.map(item=><option key={item} value={item}>{item}</option>)}</select></label>;

const PrivateActionCard = ({ prompt, match, counterWord, setCounterWord, onAction, playerId }: { prompt?: {prompt:'bodyguard'|'inspector'|'word';targetId?:string}; match:OnlinePublicState; counterWord:string; setCounterWord:(word:string)=>void; onAction:(message:OnlineRoomMessage)=>void; playerId:string }) => {
  if (!prompt) return null;
  if (prompt.prompt === 'bodyguard') { const target=match.players.find(player=>player.id===prompt.targetId); if (!target) return null; return <section className="cipher-panel mt-6 p-6 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-emerald-300"/><p className="cipher-kicker mt-4">Bodyguard / private</p><h2 className="mt-2 text-2xl font-black text-stone-100">Pardon {target.name}?</h2><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>onAction({type:'bodyguard-choice',playerId,targetId:target.id,pardon:true})} className="cipher-button-primary">Use Pardon</button><button onClick={()=>onAction({type:'bodyguard-choice',playerId,targetId:target.id,pardon:false})} className="cipher-button-secondary">Allow ejection</button></div></section>; }
  if (prompt.prompt === 'inspector') return <section className="cipher-panel mt-6 p-6"><p className="cipher-kicker">Last Imposter / private</p><h2 className="mt-2 text-2xl font-black text-stone-100">Identify the Inspector.</h2><div className="mt-4 grid grid-cols-2 gap-2">{match.players.filter(player=>!player.eliminated).map(player=><button key={player.id} onClick={()=>onAction({type:'counter-inspector',playerId,targetId:player.id})} className="rounded-xl border border-white/10 p-3 text-left text-sm text-stone-200">{player.name}</button>)}</div></section>;
  return <section className="cipher-panel mt-6 p-6"><p className="cipher-kicker">Last Stand / private</p><h2 className="mt-2 text-2xl font-black text-stone-100">Guess the Citizen word.</h2><input className="cipher-input mt-4 w-full" value={counterWord} onChange={event=>setCounterWord(event.target.value)} placeholder="Citizen word"/><button disabled={!counterWord.trim()} onClick={()=>onAction({type:'counter-word',playerId,word:counterWord})} className="cipher-button-primary mt-3 w-full disabled:opacity-30">Lock final guess</button></section>;
};
