import React, { useState, useEffect } from 'react';
import { 
  GamePhase, Player, WordCategory, WordPair, GameMode, 
  RoundModifier, SessionStats, MatchSummary 
} from './types';
import { BUILT_IN_CATEGORIES, ROUND_MODIFIERS } from './data/wordPacks';
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

const DEFAULT_CUSTOM_PAIRS: WordPair[] = [
  { wordA: 'Superman', wordB: 'Batman', hint: 'DC Superheroes' },
  { wordA: 'Harry Potter', wordB: 'Percy Jackson', hint: 'Fantasy book heroes' }
];

const INITIAL_SESSION_STATS: SessionStats = {
  gamesPlayed: 0,
  citizenWins: 0,
  imposterWins: 0,
  totalRoundsPlayed: 0,
  totalImpostersCaught: 0,
  lastStandHeists: 0
};

export default function App() {
  // Navigation & Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

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
      return saved ? JSON.parse(saved) : ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'];
    } catch {
      return ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'];
    }
  });

  // Session Statistics Persistence
  const [sessionStats, setSessionStats] = useState<SessionStats>(() => {
    try {
      const saved = localStorage.getItem('cipher_session_stats');
      return saved ? JSON.parse(saved) : INITIAL_SESSION_STATS;
    } catch {
      return INITIAL_SESSION_STATS;
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
    category,
    selectedPair
  }: {
    playerNames: string[];
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    accomplicesAware: boolean;
    useModifiers: boolean;
    category: WordCategory;
    selectedPair: WordPair;
  }) => {
    // Save player names for next time
    try {
      localStorage.setItem('cipher_saved_players', JSON.stringify(playerNames));
      setSavedPlayers(playerNames);
    } catch {
      // ignore
    }

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
    setRoundNumber(1);
    setMatchSummary(null);

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

    // Construct Player list
    const generatedPlayers: Player[] = playerNames.map((name, idx) => {
      const isImposter = imposterIndices.has(idx);
      return {
        id: `p-${idx}-${Date.now()}`,
        name,
        role: isImposter ? 'imposter' : 'citizen',
        secretWord: isImposter ? (mode === 'decoy' ? imposterWord : '') : citizenWord,
        isDecoyWord: isImposter && mode === 'decoy',
        isEliminated: false,
        avatarSeed: idx,
        votesAgainst: 0
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

  // Eliminate player
  const handleEliminatePlayer = (playerId: string) => {
    const target = players.find(p => p.id === playerId);
    if (!target) return;

    // Update player state
    const updated = players.map(p => 
      p.id === playerId ? { ...p, isEliminated: true } : p
    );
    setPlayers(updated);
    setEliminatedPlayer(target);
    setPhase('elimination_reveal');
  };

  // Next round if game continues
  const handleNextRound = () => {
    setRoundNumber(prev => prev + 1);
    setPhase('clue_round');
  };

  // Game over handler: records session metrics and transitions to Game Stats screen
  const handleGameOver = (summary: MatchSummary) => {
    setMatchSummary(summary);
    setSessionStats(prev => {
      const updated: SessionStats = {
        gamesPlayed: prev.gamesPlayed + 1,
        citizenWins: prev.citizenWins + (summary.winner === 'citizens' ? 1 : 0),
        imposterWins: prev.imposterWins + (summary.winner === 'imposters' ? 1 : 0),
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

  // Reset Session Stats
  const handleResetSessionStats = () => {
    setSessionStats(INITIAL_SESSION_STATS);
    try {
      localStorage.removeItem('cipher_session_stats');
    } catch {
      // ignore
    }
  };

  // Play Rematch with same players
  const handleRematch = () => {
    let availableCategories = [...BUILT_IN_CATEGORIES];
    if (customPairs.length > 0) {
      availableCategories.push({
        id: 'custom_pack',
        name: 'Custom Word Pack',
        iconName: 'BookOpen',
        description: 'User created words and inside jokes.',
        pairs: customPairs
      });
    }

    const cat = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const pair = cat.pairs[Math.floor(Math.random() * cat.pairs.length)];

    const imposterCount = (players.filter(p => p.role === 'imposter').length || 1) as 1 | 2 | 3;
    const names = players.map(p => p.name);

    handleStartGame({
      playerNames: names,
      impostersCount: imposterCount,
      mode: gameMode,
      accomplicesAware,
      useModifiers: activeModifier !== null,
      category: cat,
      selectedPair: pair
    });
  };

  const handleResetToSetup = () => {
    setPhase('setup');
    setPlayers([]);
    setPassIndex(0);
    setEliminatedPlayer(null);
    setMatchSummary(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Universal Header Navbar */}
      <Navbar
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenOnboarding={() => setPhase('onboarding')}
        onOpenStats={matchSummary ? () => setPhase('game_stats') : undefined}
        onResetGame={handleResetToSetup}
        gameActive={phase !== 'setup' && phase !== 'game_stats' && phase !== 'onboarding'}
        playerCount={players.length}
        hasSessionStats={sessionStats.gamesPlayed > 0}
      />

      {/* Main Screen Router */}
      <main className="flex-1 flex flex-col">
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
            onEliminatePlayer={handleEliminatePlayer}
            onReturnToClues={() => setPhase('clue_round')}
          />
        )}

        {phase === 'elimination_reveal' && eliminatedPlayer && (
          <EliminationAndOutcome
            eliminatedPlayer={eliminatedPlayer}
            players={players}
            trueCitizenWord={trueCitizenWord}
            decoyWord={decoyWord}
            categoryName={activeCategory.name}
            roundsPlayed={roundNumber}
            onNextRound={handleNextRound}
            onGameOver={handleGameOver}
          />
        )}

        {phase === 'game_stats' && matchSummary && (
          <GameStatsScreen
            players={players}
            matchSummary={matchSummary}
            sessionStats={sessionStats}
            trueCitizenWord={trueCitizenWord}
            decoyWord={decoyWord}
            categoryName={activeCategory.name}
            onRematch={handleRematch}
            onNewGame={handleResetToSetup}
            onResetSessionStats={handleResetSessionStats}
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
    </div>
  );
}
