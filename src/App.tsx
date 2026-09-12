import React, { useState, useEffect } from 'react';
import { 
  GamePhase, Player, WordCategory, WordPair, GameMode, VotingStyle,
  RoundModifier, SessionStats, MatchSummary, SpecialRoleConfig, RoleType,
  EliminationsPerVote, PlayerCareerStats, WordAudience, WordDifficulty
} from './types';
import { BUILT_IN_CATEGORIES, ROUND_MODIFIERS } from './data/wordPacks';
import { selectNoRepeatPair } from './utils/wordHistory';
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
import { CipherAtmosphere } from './components/CipherAtmosphere';
import { RestartMatchModal } from './components/RestartMatchModal';

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

export default function App() {
  // Navigation & Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);

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

  // Game Engine State
  const [phase, setPhase] = useState<GamePhase>(() => {
    try {
      const onboarded = localStorage.getItem('cipher_has_completed_onboarding');
      return onboarded === 'true' ? 'setup' : 'onboarding';
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
    impostersCount,
    mode,
    accomplicesAware: isAccomplicesAware,
    useModifiers,
    decoyCount: selectedDecoyCount,
    eliminationsPerVote: selectedEliminationsPerVote,
    votingStyle: chosenVotingStyle,
    category,
    selectedPair,
    specialRoles: selectedSpecialRoles,
    difficulty,
    audience
  }: {
    playerNames: string[];
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    accomplicesAware: boolean;
    useModifiers: boolean;
    decoyCount: 0 | 1 | 2;
    eliminationsPerVote: EliminationsPerVote;
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

    // Randomize whether wordA or wordB is the Citizen word
    const flip = Math.random() > 0.5;
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
    setSpecialRoles(selectedSpecialRoles);
    setActiveDifficulty(difficulty);
    setActiveAudience(audience);
    setRoundNumber(1);
    setMatchSummary(null);
    setEliminationQueue([]);
    setEliminationQueueIndex(0);

    // Pick modifier if enabled
    if (useModifiers) {
      const mod = ROUND_MODIFIERS[Math.floor(Math.random() * ROUND_MODIFIERS.length)];
      setActiveModifier(mod);
    } else {
      setActiveModifier(null);
    }

    // Pick Imposters randomly
    const indices = Array.from({ length: playerNames.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
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
      const candidatePool = indices.filter(index => index !== inspectorIndex);
      const guaranteedImposter = indices.find(index => imposterIndices.has(index))!;
      const radarIndices = [guaranteedImposter];
      for (const index of candidatePool) {
        if (radarIndices.length >= Math.min(3, candidatePool.length)) break;
        if (!radarIndices.includes(index)) radarIndices.push(index);
      }
      radarIndices.sort((a, b) => a - b);
      inspectorIntel = `At least one Imposter is among seats ${radarIndices.map(index => `#${index + 1}`).join(', ')}.`;
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
    setPhase('game_stats');
  };

  // Explicit destructive reset. Custom word packs are intentionally preserved.
  const handleResetAllData = () => {
    setSessionStats(INITIAL_SESSION_STATS);
    setCareerStats({});
    setSavedPlayers([]);
    setSetupPlayers([]);
    try {
      [
        'cipher_session_stats',
        'cipher_player_career_stats',
        'cipher_saved_players',
        'cipher_played_pairs_history',
        'cipher_has_completed_onboarding',
        'cipher_theme'
      ].forEach(key => localStorage.removeItem(key));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  // Play Rematch with same players
  const handleRematch = () => {
    const cat = activeCategory;
    const pair = selectNoRepeatPair(cat);

    const imposterCount = (players.filter(p => p.role === 'imposter').length || 1) as 1 | 2 | 3;
    const names = players.map(p => p.name);

    handleStartGame({
      playerNames: names,
      impostersCount: imposterCount,
      mode: gameMode,
      accomplicesAware,
      useModifiers: activeModifier !== null,
      decoyCount,
      eliminationsPerVote,
      votingStyle,
      category: cat,
      selectedPair: pair,
      specialRoles,
      difficulty: activeDifficulty,
      audience: activeAudience
    });
  };

  const handleResetToSetup = () => {
    if (players.length > 0) setSetupPlayers(players.map(player => player.name));
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
    handleRematch();
  };

  const handleEditSetup = () => {
    setIsRestartOpen(false);
    handleResetToSetup();
  };

  return (
    <div className="cipher-shell min-h-screen flex flex-col font-sans antialiased selection:bg-[#ff6846] selection:text-stone-950">
      <CipherAtmosphere />
      {/* Universal Header Navbar */}
      <Navbar
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenOnboarding={() => setPhase('onboarding')}
        onOpenStats={matchSummary ? () => setPhase('game_stats') : undefined}
        onResetGame={() => setIsRestartOpen(true)}
        gameActive={phase !== 'setup' && phase !== 'game_stats' && phase !== 'onboarding'}
        playerCount={players.length}
        hasSessionStats={sessionStats.gamesPlayed > 0}
      />

      {/* Main Screen Router */}
      <main className="cipher-content flex-1 flex flex-col">
        {phase === 'onboarding' && (
          <GameOnboarding
            onComplete={() => setPhase('setup')}
            onSkip={() => setPhase('setup')}
          />
        )}

        {phase === 'setup' && (
          <SetupScreen
            onStartGame={handleStartGame}
            customPairs={customPairs}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            savedPlayers={savedPlayers}
            initialPlayers={setupPlayers}
            onOpenOnboarding={() => setPhase('onboarding')}
          />
        )}

        {phase === 'pass_prompt' && (
          <PassAndRevealScreen
            players={players}
            currentIndex={passIndex}
            mode={gameMode}
            categoryName={activeCategory.name}
            accomplicesAware={accomplicesAware}
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
            onProceedToVoting={handleProceedToVoting}
          />
        )}

        {phase === 'voting' && (
          <DiscussionAndVoting
            players={players}
            initialVotingStyle={votingStyle}
            eliminationsPerVote={eliminationsPerVote}
            onEliminatePlayers={handleEliminatePlayers}
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
            trueCitizenWord={trueCitizenWord}
            decoyWord={decoyWord}
            categoryName={activeCategory.name}
            onRematch={handleRematch}
            onEditSetup={handleResetToSetup}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Modals */}
      <HowToPlayModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

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
    </div>
  );
}
