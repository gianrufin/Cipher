import React, { useState, useEffect } from 'react';
import { 
  GamePhase, Player, WordCategory, WordPair, GameMode, VotingStyle,
  RoundModifier, SessionStats, MatchSummary, SpecialRoleConfig, RoleType,
  EjectionReveal, EliminationsPerVote, PlayerCareerStats, WordAudience, WordDifficulty, CrewProfile,
  MatchHistoryRecord
} from './types';
import { BUILT_IN_CATEGORIES, ROUND_MODIFIERS } from './data/wordPacks';
import { secureShuffle } from './utils/wordHistory';
import { publishCrewHistory, selectCrewPair, syncCrewHistory } from './utils/crewSync';
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import { PassAndRevealScreen } from './components/PassAndRevealScreen';
import { ClueRoundView } from './components/ClueRoundView';
import { DiscussionAndVoting } from './components/DiscussionAndVoting';
import { EliminationAndOutcome } from './components/EliminationAndOutcome';
import { GameStatsScreen } from './components/GameStatsScreen';
import { GameOnboarding } from './components/GameOnboarding';
import { HowToPlayModal } from './components/HowToPlayModal';
import { CustomPackModal } from './components/CustomPackModal';
import { BodyguardDecision } from './components/BodyguardDecision';
import { calculateMatchScores, updateCareerStats } from './utils/scoring';
import { RestartMatchModal } from './components/RestartMatchModal';
import { GameModeScreen } from './components/GameModeScreen';
import { OnlineRoomScreen } from './components/OnlineRoomScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CrewScreen } from './components/CrewScreen';
import { RoleArchive } from './components/RoleArchive';
import { SoundboardModal } from './components/SoundboardModal';
import { getActiveCrew, markCrewPlayed, setActiveCrew } from './utils/crewStore';
import { useWakeLock } from './hooks/useWakeLock';

const DEFAULT_CUSTOM_PAIRS: WordPair[] = [
  { wordA: 'Superman', wordB: 'Batman', hint: 'DC Superheroes' },
  { wordA: 'Harry Potter', wordB: 'Percy Jackson', hint: 'Fantasy book heroes' }
];

const INITIAL_SESSION_STATS: SessionStats = {
  gamesPlayed: 0,
  citizenWins: 0,
  imposterWins: 0,
  anarchistWins: 0,
  totalRoundsPlayed: 0,
  totalImpostersCaught: 0,
  lastStandHeists: 0
};
const MATCH_SNAPSHOT_KEY = 'cipher_active_match_v1';
type MatchSnapshot = { phase: GamePhase; players: Player[]; passIndex: number; gameMode: GameMode; accomplicesAware: boolean; categoryId: string; activePair: WordPair; trueCitizenWord: string; decoyWord: string; roundNumber: number; activeModifier: RoundModifier|null; votingStyle: VotingStyle; decoyCount: 0|1|2; eliminationsPerVote: EliminationsPerVote; ejectionReveal:EjectionReveal; allowSkip:boolean; specialRoles:SpecialRoleConfig; audience:WordAudience; difficulty:WordDifficulty };

export default function App() {
  // Navigation & Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRoleArchiveOpen, setIsRoleArchiveOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [activeCrew, setActiveCrewState] = useState<CrewProfile | undefined>(() => getActiveCrew());

  // Persistence: custom pairs & saved player roster
  const [customPairs, setCustomPairs] = useState<WordPair[]>(() => {
    try {
      const saved = localStorage.getItem('cipher_custom_pairs');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_PAIRS;
    } catch {
      return DEFAULT_CUSTOM_PAIRS;
    }
  });

  const [savedPlayers, setSavedPlayers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cipher_saved_players');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [setupPlayers, setSetupPlayers] = useState<string[]>([]);
  const [setupPhotos, setSetupPhotos] = useState<string[]>([]);

  // Session Statistics Persistence
  const [sessionStats, setSessionStats] = useState<SessionStats>(() => {
    try {
      const saved = localStorage.getItem('cipher_session_stats');
      return saved ? { ...INITIAL_SESSION_STATS, ...JSON.parse(saved) } : INITIAL_SESSION_STATS;
    } catch {
      return INITIAL_SESSION_STATS;
    }
  });

  const [careerStats, setCareerStats] = useState<Record<string, PlayerCareerStats>>(() => {
    try {
      const saved = localStorage.getItem('cipher_player_career_stats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [matchHistory, setMatchHistory] = useState<MatchHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cipher_match_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Game Engine State
  const [phase, setPhase] = useState<GamePhase>(() => {
    try {
      const onboarded = localStorage.getItem('cipher_has_completed_onboarding');
      return onboarded === 'true' ? 'mode_select' : 'onboarding';
    } catch {
      return 'onboarding';
    }
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [passIndex, setPassIndex] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('decoy');
  const [accomplicesAware, setAccomplicesAware] = useState(true);
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILT_IN_CATEGORIES[0]);
  const [activePair, setActivePair] = useState<WordPair>(BUILT_IN_CATEGORIES[0].pairs[0]);
  const [trueCitizenWord, setTrueCitizenWord] = useState('');
  const [decoyWord, setDecoyWord] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [activeModifier, setActiveModifier] = useState<RoundModifier | null>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [votingStyle, setVotingStyle] = useState<VotingStyle>('open');
  const [decoyCount, setDecoyCount] = useState<0 | 1 | 2>(0);
  const [eliminationsPerVote, setEliminationsPerVote] = useState<EliminationsPerVote>(1);
  const [ejectionReveal, setEjectionReveal] = useState<EjectionReveal>('confirm');
  const [allowSkip, setAllowSkip] = useState(true);
  const [specialRoles, setSpecialRoles] = useState<SpecialRoleConfig>({
    anarchist: false,
    inspector: false,
    sleeper: false,
    bodyguard: false
  });
  const [pendingElimination, setPendingElimination] = useState<Player | null>(null);
  const [eliminationQueue, setEliminationQueue] = useState<Player[]>([]);
  const [eliminationQueueIndex, setEliminationQueueIndex] = useState(0);
  const [activeAudience, setActiveAudience] = useState<WordAudience>('family');
  const [activeDifficulty, setActiveDifficulty] = useState<WordDifficulty>('easy');
  const [recovery, setRecovery] = useState<MatchSnapshot|undefined>(()=>{try{const raw=localStorage.getItem(MATCH_SNAPSHOT_KEY);return raw?JSON.parse(raw):undefined;}catch{return undefined;}});
  const localMatchActive = !['onboarding','mode_select','crew_select','online_room','setup','game_stats'].includes(phase);
  useWakeLock(localMatchActive);

  useEffect(() => {
    void syncCrewHistory();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [phase]);

  useEffect(() => {
    if (!localMatchActive) return;
    const protectMatch = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protectMatch);
    return () => window.removeEventListener('beforeunload', protectMatch);
  }, [localMatchActive]);

  useEffect(() => {
    history.replaceState({ ...(history.state || {}), cipherRoot: true }, '');
    history.pushState({ cipherGuard: true }, '');
  }, []);

  useEffect(() => {
    const handleBack = () => {
      history.pushState({ cipherGuard: true }, '');
      if (isSettingsOpen) { setIsSettingsOpen(false); return; }
      if (isRoleArchiveOpen) { setIsRoleArchiveOpen(false); return; }
      if (isRulesOpen) { setIsRulesOpen(false); return; }
      if (isCustomModalOpen) { setIsCustomModalOpen(false); return; }
      if (isRestartOpen) { setIsRestartOpen(false); return; }
      if (phase === 'online_room') { window.dispatchEvent(new Event('cipher-back')); return; }
      if (localMatchActive) { setIsSettingsOpen(true); return; }
      if (phase === 'setup' || phase === 'crew_select' || phase === 'game_stats' || phase === 'onboarding') setPhase('mode_select');
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [phase, localMatchActive, isSettingsOpen, isRoleArchiveOpen, isRulesOpen, isCustomModalOpen, isRestartOpen]);

  useEffect(()=>{
    const active=!['onboarding','mode_select','crew_select','online_room','setup','game_stats'].includes(phase);
    if(!active||!players.length)return;
    const snapshot:MatchSnapshot={phase,players:players.map(player=>({...player,avatarPhoto:undefined})),passIndex,gameMode,accomplicesAware,categoryId:activeCategory.id,activePair,trueCitizenWord,decoyWord,roundNumber,activeModifier,votingStyle,decoyCount,eliminationsPerVote,ejectionReveal,allowSkip,specialRoles,audience:activeAudience,difficulty:activeDifficulty};
    try{localStorage.setItem(MATCH_SNAPSHOT_KEY,JSON.stringify(snapshot));setRecovery(snapshot);}catch{/* recovery remains optional */}
  },[phase,players,passIndex,gameMode,accomplicesAware,activeCategory.id,activePair,trueCitizenWord,decoyWord,roundNumber,activeModifier,votingStyle,decoyCount,eliminationsPerVote,ejectionReveal,allowSkip,specialRoles,activeAudience,activeDifficulty]);

  const restoreMatch=()=>{if(!recovery)return;setPlayers(recovery.players);setPassIndex(recovery.passIndex);setGameMode(recovery.gameMode);setAccomplicesAware(recovery.accomplicesAware);setActiveCategory(BUILT_IN_CATEGORIES.find(category=>category.id===recovery.categoryId)||{...BUILT_IN_CATEGORIES[0],id:recovery.categoryId,name:'Daily Deck'});setActivePair(recovery.activePair);setTrueCitizenWord(recovery.trueCitizenWord);setDecoyWord(recovery.decoyWord);setRoundNumber(recovery.roundNumber);setActiveModifier(recovery.activeModifier);setVotingStyle(recovery.votingStyle);setDecoyCount(recovery.decoyCount);setEliminationsPerVote(recovery.eliminationsPerVote);setEjectionReveal(recovery.ejectionReveal);setAllowSkip(recovery.allowSkip);setSpecialRoles(recovery.specialRoles);setActiveAudience(recovery.audience);setActiveDifficulty(recovery.difficulty);setPhase(recovery.phase);};

  // Save custom pairs to local storage
  const handleSaveCustomPairs = (updated: WordPair[]) => {
    setCustomPairs(updated);
    try {
      localStorage.setItem('cipher_custom_pairs', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Launch Game from Setup
  const handleStartGame = ({
    playerNames,
    playerPhotos,
    impostersCount,
    mode,
    accomplicesAware: isAccomplicesAware,
    useModifiers,
    decoyCount: selectedDecoyCount,
    eliminationsPerVote: selectedEliminationsPerVote,
    ejectionReveal: selectedEjectionReveal,
    allowSkip: selectedAllowSkip,
    votingStyle: chosenVotingStyle,
    category,
    selectedPair,
    specialRoles: selectedSpecialRoles,
    difficulty,
    audience
  }: {
    playerNames: string[];
    playerPhotos: string[];
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    accomplicesAware: boolean;
    useModifiers: boolean;
    decoyCount: 0 | 1 | 2;
    eliminationsPerVote: EliminationsPerVote;
    ejectionReveal: EjectionReveal;
    allowSkip: boolean;
    votingStyle: VotingStyle;
    category: WordCategory;
    selectedPair: WordPair;
    specialRoles: SpecialRoleConfig;
    difficulty: WordDifficulty;
    audience: WordAudience;
  }) => {
    // Save player names for next time
    try {
      localStorage.setItem('cipher_saved_players', JSON.stringify(playerNames));
      setSavedPlayers(playerNames);
    } catch {
      // ignore
    }
    setSetupPlayers(playerNames);
    setSetupPhotos(playerPhotos);

    // Randomize whether wordA or wordB is the Citizen word
    const flip = secureShuffle([true, false])[0];
    const citizenWord = flip ? selectedPair.wordA : selectedPair.wordB;
    const imposterWord = flip ? selectedPair.wordB : selectedPair.wordA;

    setTrueCitizenWord(citizenWord);
    setDecoyWord(imposterWord);
    setActiveCategory(category);
    setActivePair(selectedPair);
    setGameMode(mode);
    setAccomplicesAware(isAccomplicesAware);
    setVotingStyle(chosenVotingStyle);
    setDecoyCount(selectedDecoyCount);
    setEliminationsPerVote(selectedEliminationsPerVote);
    setEjectionReveal(selectedEjectionReveal);
    setAllowSkip(selectedAllowSkip);
    setSpecialRoles(selectedSpecialRoles);
    setActiveDifficulty(difficulty);
    setActiveAudience(audience);
    setRoundNumber(1);
    setMatchSummary(null);
    setEliminationQueue([]);
    setEliminationQueueIndex(0);

    // Pick modifier if enabled
    if (useModifiers) {
      const mod = secureShuffle(ROUND_MODIFIERS)[0];
      setActiveModifier(mod);
    } else {
      setActiveModifier(null);
    }

    // Pick Imposters randomly
    const indices = secureShuffle(Array.from({ length: playerNames.length }, (_, i) => i));
    const imposterIndices = new Set(indices.slice(0, impostersCount));

    const nonImposterIndices = indices.slice(impostersCount);
    const roleQueue: RoleType[] = [];
    if (selectedSpecialRoles.inspector) roleQueue.push('inspector');
    if (selectedSpecialRoles.bodyguard) roleQueue.push('bodyguard');
    if (selectedSpecialRoles.sleeper) roleQueue.push('sleeper');
    if (selectedSpecialRoles.anarchist) roleQueue.push('anarchist');
    const specialRoleByIndex = new Map<number, RoleType>();
    roleQueue.forEach((role, queueIndex) => {
      const playerIndex = nonImposterIndices[queueIndex];
      if (playerIndex !== undefined) specialRoleByIndex.set(playerIndex, role);
    });

    const regularCitizenIndices = nonImposterIndices.filter(index => !specialRoleByIndex.has(index));
    const decoyIndices = new Set(regularCitizenIndices.slice(0, selectedDecoyCount));

    const inspectorIndex = [...specialRoleByIndex.entries()].find(([, role]) => role === 'inspector')?.[0];
    let inspectorIntel: string | undefined;
    if (inspectorIndex !== undefined) {
      const guaranteedImposter = secureShuffle(indices.filter(index => imposterIndices.has(index)))[0];
      const citizenCover = secureShuffle(indices.filter(index => index !== inspectorIndex && !imposterIndices.has(index))).slice(0, 2);
      const radarIndices = [guaranteedImposter, ...citizenCover];
      radarIndices.sort((a, b) => a - b);
      inspectorIntel = `Signal Sweep: exactly one Imposter is among seats ${radarIndices.map(index => `#${index + 1}`).join(', ')}.`;
    }

    // Construct Player list
    const generatedPlayers: Player[] = playerNames.map((name, idx) => {
      const isImposter = imposterIndices.has(idx);
      const assignedRole: RoleType = isImposter
        ? 'imposter'
        : specialRoleByIndex.get(idx) || (decoyIndices.has(idx) ? 'decoy' : 'citizen');
      return {
        id: `p-${idx}-${Date.now()}`,
        name,
        avatarPhoto: playerPhotos[idx],
        role: assignedRole,
        secretWord: isImposter
          ? (mode === 'decoy' ? imposterWord : '')
          : assignedRole === 'decoy' ? imposterWord : citizenWord,
        isDecoyWord: isImposter && mode === 'decoy',
        isEliminated: false,
        avatarSeed: idx,
        votesAgainst: 0,
        intel: assignedRole === 'inspector' ? inspectorIntel : undefined,
        powerUsed: false,
        roundsSurvived: 0,
        successfulActions: 0
      };
    });

    setPlayers(generatedPlayers);
    if (activeCrew) markCrewPlayed(activeCrew.id, generatedPlayers[0]?.id);
    setPassIndex(0);
    setPhase('pass_prompt');
  };

  // Pass navigation
  const handleNextPassPlayer = () => {
    setPassIndex(prev => prev + 1);
  };

  const handleFinishPass = () => {
    setPhase('clue_round');
  };

  const handleReplaceRepeatedWord = async () => {
    const pair = await selectCrewPair(activeCategory);
    const flip = secureShuffle([true, false])[0];
    const citizenWord = flip ? pair.wordA : pair.wordB;
    const alternateWord = flip ? pair.wordB : pair.wordA;
    setActivePair(pair);
    setTrueCitizenWord(citizenWord);
    setDecoyWord(alternateWord);
    setPlayers(current => current.map(player => ({
      ...player,
      secretWord: player.role === 'imposter'
        ? (gameMode === 'decoy' ? alternateWord : '')
        : player.role === 'decoy' ? alternateWord : citizenWord
    })));
    void publishCrewHistory();
  };

  // Proceed to voting
  const handleProceedToVoting = () => {
    setPhase('voting');
  };

  const finalizeElimination = (target: Player, sourcePlayers = players) => {
    const updated = sourcePlayers.map(p =>
      p.id === target.id ? { ...p, isEliminated: true } : p
    );
    setPlayers(updated);
    setEliminatedPlayer(target);
    setPendingElimination(null);
    setPhase('elimination_reveal');
  };

  const beginQueuedElimination = (queue: Player[], index: number, sourcePlayers = players) => {
    const target = queue[index];
    if (!target) return;
    setEliminationQueue(queue);
    setEliminationQueueIndex(index);
    const availableBodyguard = sourcePlayers.find(player =>
      player.role === 'bodyguard' && !player.isEliminated && !player.powerUsed && player.id !== target.id
    );
    if (availableBodyguard) {
      setPendingElimination(target);
      setPhase('bodyguard_decision');
    } else {
      finalizeElimination(target, sourcePlayers);
    }
  };

  const handleEliminatePlayers = (playerIds: string[]) => {
    const queue = playerIds
      .map(playerId => players.find(player => player.id === playerId))
      .filter((player): player is Player => Boolean(player));
    if (!queue.length) return;
    beginQueuedElimination(queue, 0);
  };

  const handleBodyguardVeto = () => {
    const protectedCitizenTeam = pendingElimination && ['citizen', 'decoy', 'inspector', 'bodyguard'].includes(pendingElimination.role);
    const updatedPlayers = players.map(player => ({
      ...player,
      ...(player.role === 'bodyguard' ? {
        powerUsed: true,
        successfulActions: (player.successfulActions || 0) + (protectedCitizenTeam ? 1 : 0)
      } : {})
    }));
    setPlayers(updatedPlayers);
    setPendingElimination(null);
    const nextIndex = eliminationQueueIndex + 1;
    if (eliminationQueue[nextIndex]) {
      setEliminationQueueIndex(nextIndex);
      finalizeElimination(eliminationQueue[nextIndex], updatedPlayers);
    } else {
      setPlayers(updatedPlayers.map(player => player.isEliminated
        ? player
        : { ...player, roundsSurvived: (player.roundsSurvived || 0) + 1 }
      ));
      setRoundNumber(current => current + 1);
      setPhase('clue_round');
    }
  };

  const handleContinueEliminationQueue = () => {
    const nextIndex = eliminationQueueIndex + 1;
    if (eliminationQueue[nextIndex]) beginQueuedElimination(eliminationQueue, nextIndex);
  };

  // Next round if game continues
  const handleNextRound = () => {
    setPlayers(current => current.map(player => player.isEliminated
      ? player
      : { ...player, roundsSurvived: (player.roundsSurvived || 0) + 1 }
    ));
    setRoundNumber(prev => prev + 1);
    setPhase('clue_round');
  };

  // Game over handler: records session metrics and transitions to Game Stats screen
  const handleGameOver = (summary: MatchSummary) => {
    localStorage.removeItem(MATCH_SNAPSHOT_KEY);
    setRecovery(undefined);
    const playerScores = calculateMatchScores(players, summary);
    const completedSummary = { ...summary, playerScores };
    setMatchSummary(completedSummary);
    setCareerStats(previous => {
      const updated = updateCareerStats(previous, players, completedSummary, playerScores);
      try {
        localStorage.setItem('cipher_player_career_stats', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setSessionStats(prev => {
      const updated: SessionStats = {
        gamesPlayed: prev.gamesPlayed + 1,
        citizenWins: prev.citizenWins + (summary.winner === 'citizens' ? 1 : 0),
        imposterWins: prev.imposterWins + (summary.winner === 'imposters' ? 1 : 0),
        anarchistWins: (prev.anarchistWins || 0) + (summary.winner === 'anarchist' ? 1 : 0),
        totalRoundsPlayed: prev.totalRoundsPlayed + summary.roundsPlayed,
        totalImpostersCaught: prev.totalImpostersCaught + summary.impostersCaughtThisMatch,
        lastStandHeists: prev.lastStandHeists + (summary.winReason.includes('Last Stand') ? 1 : 0)
      };
      try {
        localStorage.setItem('cipher_session_stats', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Record match in lightweight 5-match history
    const topScorer = playerScores && playerScores.length > 0 ? playerScores[0] : undefined;
    const historyRecord: MatchHistoryRecord = {
      id: `match_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      winner: summary.winner,
      winReason: summary.winReason,
      categoryName: activeCategory.name,
      trueCitizenWord,
      decoyWord: decoyWord || undefined,
      roundsPlayed: summary.roundsPlayed,
      playerCount: players.length,
      impostersCaught: summary.impostersCaughtThisMatch,
      totalImposters: summary.totalImposters,
      topScorerName: topScorer?.name,
      topScorerPoints: topScorer?.points
    };

    setMatchHistory(prev => {
      const updated = [historyRecord, ...prev].slice(0, 5);
      try {
        localStorage.setItem('cipher_match_history_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setEliminatedPlayer(null);
    setPendingElimination(null);
    setEliminationQueue([]);
    setPhase('game_stats');
  };

  // Explicit destructive reset. Custom word packs are intentionally preserved.
  const handleResetAllData = () => {
    setSessionStats(INITIAL_SESSION_STATS);
    setCareerStats({});
    setSavedPlayers([]);
    setSetupPlayers([]);
    setSetupPhotos([]);
    try {
      [
        'cipher_session_stats',
        'cipher_player_career_stats',
        'cipher_match_history_v1',
        'cipher_saved_players',
        'cipher_played_pairs_history',
        'cipher_played_pairs_history_v2',
        'cipher_recent_words_history',
        'cipher_crew_code',
        'cipher_crew_name',
        'cipher_crews_v1',
        'cipher_active_crew_id',
        'cipher_active_match_v1',
        'cipher_word_feedback',
        'cipher_sound',
        'cipher_haptics',
        'cipher_timer_seconds',
        'cipher_has_completed_onboarding',
        'cipher_theme',
        'cipher_live_leaderboard_v1',
        'cipher_live_host_session_v1',
        'cipher_live_name'
      ].forEach(key => localStorage.removeItem(key));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  // Play Rematch with same players
  const handleRematch = async () => {
    const cat = activeCategory;
    let pair: WordPair;
    try {
      pair = await selectCrewPair(cat);
    } catch {
      setSetupPlayers(players.map(player => player.name));
      setSetupPhotos(players.map(player => player.avatarPhoto || ''));
      setPhase('setup');
      return;
    }

    const imposterCount = (players.filter(p => p.role === 'imposter').length || 1) as 1 | 2 | 3;
    const names = players.map(p => p.name);
    const photos = players.map(player => player.avatarPhoto || '');

    handleStartGame({
      playerNames: names,
      playerPhotos: photos,
      impostersCount: imposterCount,
      mode: gameMode,
      accomplicesAware,
      useModifiers: activeModifier !== null,
      decoyCount,
      eliminationsPerVote,
      ejectionReveal,
      allowSkip,
      votingStyle,
      category: cat,
      selectedPair: pair,
      specialRoles,
      difficulty: activeDifficulty,
      audience: activeAudience
    });
  };

  const handleResetToSetup = () => {
    if (players.length > 0) {
      setSetupPlayers(players.map(player => player.name));
      setSetupPhotos(players.map(player => player.avatarPhoto || ''));
    }
    setPhase('setup');
    setPlayers([]);
    setPassIndex(0);
    setEliminatedPlayer(null);
    setMatchSummary(null);
    setPendingElimination(null);
    setEliminationQueue([]);
    setEliminationQueueIndex(0);
  };

  const handleRestartMatch = () => {
    setIsRestartOpen(false);
    setIsSettingsOpen(false);
    void handleRematch();
  };

  const handleEditSetup = () => {
    setIsRestartOpen(false);
    handleResetToSetup();
  };

  const handleStartNewGame = () => {
    window.dispatchEvent(new Event('cipher-new-game'));
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete('room');
    cleanUrl.searchParams.delete('host');
    history.replaceState({ cipherGuard: true }, '', cleanUrl);
    localStorage.removeItem(MATCH_SNAPSHOT_KEY);
    setRecovery(undefined);
    setIsSettingsOpen(false);
    setPlayers([]);
    setPassIndex(0);
    setEliminatedPlayer(null);
    setPendingElimination(null);
    setEliminationQueue([]);
    setMatchSummary(null);
    setPhase('mode_select');
  };

  return (
    <div className="cipher-shell min-h-screen flex flex-col font-sans antialiased selection:bg-[#ff6846] selection:text-stone-950">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        gameActive={!['mode_select', 'setup', 'game_stats', 'onboarding', 'online_room'].includes(phase)}
        playerCount={players.length}
      />

      {/* Main Screen Router */}
      <main className="cipher-content flex-1 flex flex-col">
        {phase === 'onboarding' && (
          <GameOnboarding
            onComplete={() => setPhase('mode_select')}
            onSkip={() => setPhase('mode_select')}
          />
        )}

        {phase === 'mode_select' && <><GameModeScreen onLocal={() => { setActiveCrew(undefined); setActiveCrewState(undefined); setSetupPlayers([]); setPhase('setup'); }} onOnline={() => { setActiveCrew(undefined); setActiveCrewState(undefined); setPhase('online_room'); }} onCrews={() => setPhase('crew_select')} />{recovery&&<div className="recovery-banner"><div><span className="cipher-kicker">Game in progress</span><strong>Round {recovery.roundNumber} · {recovery.phase.replaceAll('_',' ')}</strong></div><button onClick={restoreMatch} className="cipher-button-primary">Resume game</button><button onClick={()=>{localStorage.removeItem(MATCH_SNAPSHOT_KEY);setRecovery(undefined);}} className="cipher-text-button">Discard</button></div>}</>}
        {phase === 'crew_select' && <CrewScreen onBack={() => setPhase('mode_select')} onLocal={crew => { setActiveCrewState(crew); setSetupPlayers(crew.members.filter(member => member.active).map(member => member.name)); setSetupPhotos([]); setPhase('setup'); }} onOnline={crew => { setActiveCrewState(crew); setPhase('online_room'); }} />}
        {phase === 'online_room' && <OnlineRoomScreen initialCrew={activeCrew} onBack={() => setPhase(activeCrew ? 'crew_select' : 'mode_select')} />}

        {phase === 'setup' && (
          <SetupScreen
            onStartGame={handleStartGame}
            customPairs={customPairs}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            savedPlayers={savedPlayers}
            initialPlayers={setupPlayers}
            initialPlayerPhotos={setupPhotos}
            initialConfig={{
              impostersCount: Math.min(3, Math.max(1, players.filter(player => player.role === 'imposter').length || 1)) as 1 | 2 | 3,
              mode: gameMode,
              votingStyle,
              accomplicesAware,
              useModifiers: activeModifier !== null,
              decoyCount,
              eliminationsPerVote,
              ejectionReveal,
              allowSkip,
              specialRoles,
              audience: activeAudience,
              difficulty: activeDifficulty,
              selectedCategoryId: activeCategory.id === 'variety' ? 'random' : activeCategory.id
            }}
          />
        )}

        {phase === 'pass_prompt' && (
          <PassAndRevealScreen
            players={players}
            currentIndex={passIndex}
            mode={gameMode}
            categoryName={activeCategory.name}
            accomplicesAware={accomplicesAware}
            onWordRepeated={handleReplaceRepeatedWord}
            onNextPlayer={handleNextPassPlayer}
            onFinishPass={handleFinishPass}
          />
        )}

        {phase === 'clue_round' && (
          <ClueRoundView
            players={players}
            activeModifier={activeModifier}
            roundNumber={roundNumber}
            categoryName={activeCategory.name}
            timerSeconds={activeCrew?.defaults.timerSeconds || (Number(localStorage.getItem('cipher_timer_seconds')) || 20) as 5|10|20|30}
            preTimerEverySpeaker={activeCrew?.defaults.preTimerEverySpeaker ?? true}
            onProceedToVoting={handleProceedToVoting}
          />
        )}

        {phase === 'voting' && (
          <DiscussionAndVoting
            players={players}
            initialVotingStyle={votingStyle}
            eliminationsPerVote={eliminationsPerVote}
            allowSkip={allowSkip}
            onEliminatePlayers={handleEliminatePlayers}
            onSkipVote={handleNextRound}
            onReturnToClues={() => setPhase('clue_round')}
          />
        )}

        {phase === 'elimination_reveal' && eliminatedPlayer && (
          <EliminationAndOutcome
            key={`${eliminatedPlayer.id}-${eliminationQueueIndex}`}
            eliminatedPlayer={eliminatedPlayer}
            players={players}
            trueCitizenWord={trueCitizenWord}
            decoyWord={decoyWord}
            categoryName={activeCategory.name}
            roundsPlayed={roundNumber}
            eliminationQueue={eliminationQueue}
            queueIndex={eliminationQueueIndex}
            ejectionReveal={ejectionReveal}
            onContinueQueue={handleContinueEliminationQueue}
            onNextRound={handleNextRound}
            onGameOver={handleGameOver}
          />
        )}

        {phase === 'bodyguard_decision' && pendingElimination && (() => {
          const bodyguard = players.find(player => player.role === 'bodyguard' && !player.isEliminated && !player.powerUsed);
          return bodyguard ? (
            <BodyguardDecision
              target={pendingElimination}
              bodyguard={bodyguard}
              hasNextTarget={Boolean(eliminationQueue[eliminationQueueIndex + 1])}
              onVeto={handleBodyguardVeto}
              onProceed={() => finalizeElimination(pendingElimination)}
            />
          ) : null;
        })()}

        {phase === 'game_stats' && matchSummary && (
          <GameStatsScreen
            players={players}
            matchSummary={matchSummary}
            sessionStats={sessionStats}
            careerStats={careerStats}
            matchHistory={matchHistory}
            trueCitizenWord={trueCitizenWord}
            decoyWord={decoyWord}
            categoryName={activeCategory.name}
            onRematch={handleRematch}
            onEditSetup={handleResetToSetup}
            onOpenSoundboard={() => setIsSoundboardOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />
      <HowToPlayModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
      {isRoleArchiveOpen && <RoleArchive onClose={() => setIsRoleArchiveOpen(false)} />}

      <CustomPackModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        customPairs={customPairs}
        onSaveCustomPairs={handleSaveCustomPairs}
      />

      <RestartMatchModal
        isOpen={isRestartOpen}
        onClose={() => setIsRestartOpen(false)}
        onRestart={handleRestartMatch}
        onEditSetup={handleEditSetup}
      />
      {isSettingsOpen && (
        <SettingsScreen
          onClose={() => setIsSettingsOpen(false)}
          onHowToPlay={() => { setIsSettingsOpen(false); setIsRulesOpen(true); }}
          onRoleArchive={() => { setIsSettingsOpen(false); setIsRoleArchiveOpen(true); }}
          onReplayOnboarding={() => { setIsSettingsOpen(false); setPhase('onboarding'); }}
          onResetApp={handleResetAllData}
          onStartNewGame={handleStartNewGame}
          onRestartMatch={!['mode_select', 'setup', 'game_stats', 'onboarding', 'online_room'].includes(phase) ? () => { setIsSettingsOpen(false); setIsRestartOpen(true); } : undefined}
        />
      )}
    </div>
  );
}
