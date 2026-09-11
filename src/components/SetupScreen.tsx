import React, { useState } from 'react';
import { 
  Users, UserPlus, Trash2, Shuffle, Sparkles, 
  Settings2, Flame, Eye, EyeOff, BookOpen, AlertCircle, Compass,
  ShieldAlert, Vote, Calendar, RotateCcw, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { GameMode, VotingStyle, WordCategory, WordPair } from '../types';
import { BUILT_IN_CATEGORIES, ROUND_MODIFIERS } from '../data/wordPacks';
import { selectNoRepeatPair, getVaultStats, resetPlayedPairsHistory } from '../utils/wordHistory';
import { playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface SetupScreenProps {
  onStartGame: (config: {
    playerNames: string[];
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    accomplicesAware: boolean;
    useModifiers: boolean;
    useDoubleAgentDecoy: boolean;
    votingStyle: VotingStyle;
    category: WordCategory;
    selectedPair: WordPair;
  }) => void;
  customPairs: WordPair[];
  onOpenCustomModal: () => void;
  savedPlayers: string[];
  onOpenOnboarding: () => void;
}

const DEFAULT_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan'];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  customPairs,
  onOpenCustomModal,
  savedPlayers,
  onOpenOnboarding
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>(
    savedPlayers.length >= 3 ? savedPlayers : DEFAULT_NAMES
  );
  const [newPlayerName, setNewPlayerName] = useState('');
  const [impostersCount, setImpostersCount] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<GameMode>('decoy');
  const [accomplicesAware, setAccomplicesAware] = useState(true);
  const [useModifiers, setUseModifiers] = useState(false);
  const [useDoubleAgentDecoy, setUseDoubleAgentDecoy] = useState(false);
  const [votingStyle, setVotingStyle] = useState<VotingStyle>('open');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('random');
  const [errorMessage, setErrorMessage] = useState('');
  const [vaultStats, setVaultStats] = useState(() => getVaultStats(BUILT_IN_CATEGORIES, customPairs));
  const [resetFeedback, setResetFeedback] = useState(false);

  // Update vault stats when customPairs change
  React.useEffect(() => {
    setVaultStats(getVaultStats(BUILT_IN_CATEGORIES, customPairs));
  }, [customPairs]);

  const handleResetHistory = () => {
    resetPlayedPairsHistory();
    setVaultStats(getVaultStats(BUILT_IN_CATEGORIES, customPairs));
    setResetFeedback(true);
    triggerHaptic(30);
    setTimeout(() => setResetFeedback(false), 2500);
  };

  // Auto-adjust imposters count if player count shrinks
  React.useEffect(() => {
    const maxAllowed = playerNames.length <= 4 ? 1 : playerNames.length <= 6 ? 2 : 3;
    if (impostersCount > maxAllowed) {
      setImpostersCount(maxAllowed as 1 | 2 | 3);
    }
  }, [playerNames.length, impostersCount]);

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) {
      const nextNum = playerNames.length + 1;
      const autoName = `Player ${nextNum}`;
      setPlayerNames([...playerNames, autoName]);
      triggerHaptic(20);
      return;
    }
    if (playerNames.some(p => p.toLowerCase() === clean.toLowerCase())) {
      setErrorMessage(`Player "${clean}" is already added.`);
      return;
    }
    if (playerNames.length >= 16) {
      setErrorMessage('Maximum 16 players for a single device round.');
      return;
    }
    setPlayerNames([...playerNames, clean]);
    setNewPlayerName('');
    setErrorMessage('');
    triggerHaptic(30);
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length <= 3) {
      setErrorMessage('At least 3 players are required to play.');
      return;
    }
    setPlayerNames(playerNames.filter((_, i) => i !== index));
    setErrorMessage('');
    triggerHaptic(20);
  };

  const handleQuickPreset = (count: number) => {
    const pool = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Rowan', 'Dakota'];
    setPlayerNames(pool.slice(0, count));
    triggerHaptic(30);
  };

  const handleLaunch = () => {
    if (playerNames.length < 3) {
      setErrorMessage('Social deduction requires at least 3 players.');
      return;
    }

    // Determine category & pair
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

    let chosenCategory: WordCategory;
    if (selectedCategoryId === 'random') {
      chosenCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    } else {
      chosenCategory = availableCategories.find(c => c.id === selectedCategoryId) || availableCategories[0];
    }

    if (!chosenCategory.pairs || chosenCategory.pairs.length === 0) {
      setErrorMessage('Selected category has no word pairs.');
      return;
    }

    const chosenPair = selectNoRepeatPair(chosenCategory);

    playWhoosh();
    triggerHaptic([50, 40, 60]);

    onStartGame({
      playerNames,
      impostersCount,
      mode,
      accomplicesAware,
      useModifiers,
      useDoubleAgentDecoy: playerNames.length >= 4 ? useDoubleAgentDecoy : false,
      votingStyle,
      category: chosenCategory,
      selectedPair: chosenPair
    });
  };

  const maxImposters = playerNames.length <= 4 ? 1 : playerNames.length <= 6 ? 2 : 3;

  return (
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 space-y-5">
      {/* Session Header Card */}
      <div className="rounded-2xl bg-[#0c101a] border border-white/[0.08] p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md mb-2">
              <Flame className="h-3 w-3" /> Pass & Play Engine
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-100 tracking-tight">
              Host a Session
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Gather players in a circle. Hand this phone around to privately reveal secret words.
            </p>
          </div>

          <button
            type="button"
            id="hero-onboarding-btn"
            onClick={onOpenOnboarding}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 transition-colors active:scale-95"
          >
            <Compass className="h-3.5 w-3.5 text-rose-400" />
            <span>Rules</span>
          </button>
        </div>

        {/* Quick Party Size Presets */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">Party Size</span>
          <div className="flex gap-1.5">
            {[4, 5, 6, 8, 10].map(count => (
              <button
                key={count}
                type="button"
                onClick={() => handleQuickPreset(count)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all border ${
                  playerNames.length === count
                    ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                {count}P
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Players Section */}
      <div className="rounded-2xl bg-[#0c101a] border border-white/[0.08] p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
            <Users className="h-4 w-4 text-rose-400" />
            <span>Player Roster ({playerNames.length})</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tap tag to remove</span>
        </div>

        {/* Add Player Input */}
        <form onSubmit={handleAddPlayer} className="flex gap-2">
          <input
            id="player-name-input"
            type="text"
            placeholder="Enter player name..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            maxLength={18}
            className="flex-1 rounded-xl border border-white/[0.08] bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none transition-colors"
          />
          <button
            id="add-player-btn"
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-semibold text-xs active:scale-95 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5 text-rose-400" />
            <span>Add</span>
          </button>
        </form>

        {/* Players Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {playerNames.map((name, index) => (
            <div
              key={index}
              className="group flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 shadow-sm transition-all hover:border-rose-500/40 hover:bg-rose-500/5"
            >
              <span className="font-mono text-[10px] text-slate-500 font-medium">{index + 1}</span>
              <span className="font-medium text-slate-200">{name}</span>
              <button
                type="button"
                onClick={() => handleRemovePlayer(index)}
                className="ml-0.5 text-slate-500 group-hover:text-rose-400 hover:scale-110 transition-transform"
                title={`Remove ${name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Imposter Count & Roles Config */}
      <div className="rounded-2xl bg-[#0c101a] border border-white/[0.08] p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Imposters
            </span>
            <span className="text-[11px] font-mono text-rose-400 font-medium">
              {impostersCount} of {playerNames.length} Players
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((count) => {
              const disabled = count > maxImposters;
              const active = impostersCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setImpostersCount(count);
                    triggerHaptic(25);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    disabled
                      ? 'border-white/[0.04] bg-white/[0.01] text-slate-600 cursor-not-allowed'
                      : active
                      ? 'border-rose-500 bg-rose-500/10 text-rose-200 shadow-sm'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] text-slate-300'
                  }`}
                >
                  <span className="text-sm font-display font-bold">{count} Imposter{count > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {disabled ? `Need ${count === 2 ? '5+' : '7+'} players` : count === 1 ? 'Classic' : 'Duo'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mechanics Mode: Decoy vs Blind */}
        <div className="pt-3.5 border-t border-white/[0.06] space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
            Imposter Role Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Decoy Mode */}
            <button
              type="button"
              onClick={() => {
                setMode('decoy');
                triggerHaptic(25);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mode === 'decoy'
                  ? 'border-amber-500/80 bg-amber-500/10 text-amber-100'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Decoy Word (Recommended)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Imposter gets a plausible alternative word (e.g. <em>Latte</em> vs <em>Espresso</em>). Causes high-tension wordplay.
              </p>
            </button>

            {/* Blind Mode */}
            <button
              type="button"
              onClick={() => {
                setMode('blind');
                triggerHaptic(25);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mode === 'blind'
                  ? 'border-rose-500/80 bg-rose-500/10 text-rose-100'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300 mb-1">
                <EyeOff className="h-3.5 w-3.5" />
                <span>Blind Phantom</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Imposter sees only the category, with no word. Must deduce the theme from other players' clues.
              </p>
            </button>
          </div>
        </div>

        {/* Accomplices aware toggle (if > 1 imposter) */}
        {impostersCount > 1 && (
          <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Accomplices Know Each Other
              </span>
              <span className="text-[11px] text-slate-400">
                Imposters see partner names during role reveal
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAccomplicesAware(!accomplicesAware);
                triggerHaptic(20);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accomplicesAware ? 'bg-rose-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  accomplicesAware ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Double-Agent Decoy toggle */}
        <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <div className="max-w-[78%]">
            <span className="text-xs font-semibold text-slate-200 block flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Double-Agent Decoy (Paranoid Citizen)</span>
            </span>
            <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
              1 innocent Citizen is warned their word <em>might</em> be a decoy. They hold the real word, but play with hyper-paranoia!
              {playerNames.length < 4 && (
                <span className="text-rose-400/80 block mt-0.5"> (Requires 4+ players)</span>
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={playerNames.length < 4}
            onClick={() => {
              setUseDoubleAgentDecoy(!useDoubleAgentDecoy);
              triggerHaptic(20);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              playerNames.length < 4 
                ? 'bg-slate-800/40 opacity-50 cursor-not-allowed'
                : useDoubleAgentDecoy 
                ? 'bg-amber-600' 
                : 'bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useDoubleAgentDecoy && playerNames.length >= 4 ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Round Modifiers toggle */}
        <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>Round Modifiers</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Random dynamic rule twists per round (e.g. One-Word Limit)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUseModifiers(!useModifiers);
              triggerHaptic(20);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useModifiers ? 'bg-rose-600' : 'bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useModifiers ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Voting Protocol: Open Accusation vs Blind Ballot */}
      <div className="rounded-2xl bg-[#0c101a] border border-white/[0.08] p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Vote className="h-4 w-4 text-rose-400" />
            <span>Voting Protocol</span>
          </label>
          <span className="text-[10px] font-mono uppercase text-slate-400">
            {votingStyle === 'open' ? 'Face-to-Face' : 'Confidential'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Open Accusation */}
          <button
            type="button"
            onClick={() => {
              setVotingStyle('open');
              triggerHaptic(20);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              votingStyle === 'open'
                ? 'border-rose-500/80 bg-rose-500/10 text-white'
                : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <Users className="h-3.5 w-3.5" />
                <span>Open Accusation</span>
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Debate in the circle, countdown 3-2-1 to point fingers simultaneously, then tap the accused player.
            </p>
          </button>

          {/* Blind Ballot */}
          <button
            type="button"
            onClick={() => {
              setVotingStyle('blind');
              triggerHaptic(20);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              votingStyle === 'blind'
                ? 'border-sky-500/80 bg-sky-500/10 text-white'
                : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <EyeOff className="h-3.5 w-3.5" />
                <span>Blind Ballot</span>
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Secret
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pass the phone in private. Every player secretly votes on-screen. Tally and elimination are revealed together.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Category Selection */}
      <div className="rounded-2xl bg-[#0c101a] border border-white/[0.08] p-5 space-y-4">
        {/* Weekly Rotation & Vault Intelligence Badge */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3.5 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
              <Calendar className="h-4 w-4 text-rose-400" />
              <span>{vaultStats.weeklyInfo.label}</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              1,100+ Words in Vault
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300/90 flex-wrap gap-y-1.5 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-200">No-Repeat Shield:</strong>{' '}
                {vaultStats.playedCount} played / {vaultStats.remainingCount} fresh remaining
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetHistory}
              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-1 rounded transition-colors"
              title="Reset the played words record to refresh the no-repeat cycle"
            >
              {resetFeedback ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">History Cleared!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Word History</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            The word pool is seeded deterministically every week to prioritize fresh word combinations and completely avoids repeats across matches.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Word Category
          </label>
          <button
            type="button"
            onClick={onOpenCustomModal}
            className="flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300 transition-colors font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Custom ({customPairs.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* All Random */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId('random');
              triggerHaptic(20);
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedCategoryId === 'random'
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-rose-400">
              <Shuffle className="h-3.5 w-3.5" />
              <span>Random Mix</span>
            </div>
            <p className="text-[10px] text-slate-500">All packs combined</p>
          </button>

          {/* Built-in Categories */}
          {BUILT_IN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(cat.id);
                triggerHaptic(20);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCategoryId === cat.id
                  ? 'border-rose-500 bg-rose-500/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-xs font-bold text-slate-200">
                <span className="truncate">{cat.name}</span>
              </div>
              <p className="text-[10px] text-slate-500">{cat.pairs.length} pairs</p>
            </button>
          ))}

          {/* Custom Category if exists */}
          {customPairs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('custom_pack');
                triggerHaptic(20);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCategoryId === 'custom_pack'
                  ? 'border-amber-500 bg-amber-500/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-xs font-bold text-amber-300">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="truncate">Custom Pack</span>
              </div>
              <p className="text-[10px] text-slate-500">{customPairs.length} pairs</p>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fixed Sticky Launch Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#090d16]/95 border-t border-white/[0.08] backdrop-blur-md">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            id="start-cipher-game-btn"
            type="button"
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-sm tracking-wider uppercase shadow-lg shadow-rose-950/40 active:scale-[0.98] transition-all"
          >
            <span>Start Game ({playerNames.length} Players)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
