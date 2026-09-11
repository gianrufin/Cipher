import React, { useState } from 'react';
import { 
  Users, UserPlus, Trash2, Shuffle, Sparkles, 
  Settings2, Flame, Eye, EyeOff, BookOpen, AlertCircle, Compass
} from 'lucide-react';
import { GameMode, WordCategory, WordPair } from '../types';
import { BUILT_IN_CATEGORIES, ROUND_MODIFIERS } from '../data/wordPacks';
import { playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface SetupScreenProps {
  onStartGame: (config: {
    playerNames: string[];
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    accomplicesAware: boolean;
    useModifiers: boolean;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('random');
  const [errorMessage, setErrorMessage] = useState('');

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

    const chosenPair = chosenCategory.pairs[Math.floor(Math.random() * chosenCategory.pairs.length)];

    playWhoosh();
    triggerHaptic([50, 40, 60]);

    onStartGame({
      playerNames,
      impostersCount,
      mode,
      accomplicesAware,
      useModifiers,
      category: chosenCategory,
      selectedPair: chosenPair
    });
  };

  const maxImposters = playerNames.length <= 4 ? 1 : playerNames.length <= 6 ? 2 : 3;

  return (
    <div className="w-full max-w-lg mx-auto pb-24 pt-2 px-4 space-y-6">
      {/* Hero Badge */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 p-4.5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider uppercase text-rose-400 bg-rose-950/70 border border-rose-800/50 px-2 py-0.5 rounded-full mb-1.5">
              <Flame className="h-3 w-3" /> Party Social Deduction
            </span>
            <h1 className="font-display text-2xl font-black text-white tracking-tight">
              Host a Game
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gather face-to-face in a circle. Pass this phone around to begin.
            </p>
          </div>

          <button
            type="button"
            id="hero-onboarding-btn"
            onClick={onOpenOnboarding}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-rose-300 transition-colors shadow-sm"
          >
            <Compass className="h-3.5 w-3.5 text-rose-400" />
            <span>Tutorial</span>
          </button>
        </div>

        {/* Quick Party Size Presets */}
        <div className="mt-4 flex items-center justify-between gap-1.5 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
          <div className="flex gap-1.5">
            {[4, 5, 6, 8].map(count => (
              <button
                key={count}
                type="button"
                onClick={() => handleQuickPreset(count)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all border ${
                  playerNames.length === count
                    ? 'bg-rose-600 border-rose-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {count}P
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Players Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Users className="h-4 w-4 text-rose-400" />
            <span>Players ({playerNames.length})</span>
          </label>
          <span className="text-[11px] text-slate-500">Tap name to delete</span>
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
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <button
            id="add-player-btn"
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4 text-rose-400" />
            <span>Add</span>
          </button>
        </form>

        {/* Players Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {playerNames.map((name, index) => (
            <div
              key={index}
              className="group flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 shadow-sm transition-all hover:border-rose-800/80 hover:bg-rose-950/20"
            >
              <span className="font-mono text-[10px] text-slate-500 font-bold">#{index + 1}</span>
              <span className="font-medium text-white">{name}</span>
              <button
                type="button"
                onClick={() => handleRemovePlayer(index)}
                className="ml-1 text-slate-500 group-hover:text-rose-400 hover:scale-110 transition-transform"
                title={`Remove ${name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Imposter Count & Roles Config */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Imposters in the Group
            </span>
            <span className="text-[11px] font-mono text-rose-400 font-bold">
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
                      ? 'border-slate-800/40 bg-slate-950/30 text-slate-600 cursor-not-allowed'
                      : active
                      ? 'border-rose-500 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500 shadow-md shadow-rose-950/30'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-base font-display font-extrabold">{count} Imposter{count > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {disabled ? `Need ${count === 2 ? '5+' : '7+'} players` : count === 1 ? 'Classic 1 vs All' : 'Duo Sabotage'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mechanics Mode: Decoy vs Blind */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Imposter Word Mechanism
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Decoy Mode */}
            <button
              type="button"
              onClick={() => {
                setMode('decoy');
                triggerHaptic(25);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'decoy'
                  ? 'border-amber-500 bg-amber-950/30 text-amber-100 ring-1 ring-amber-500/60'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Decoy Word (Recommended)</span>
              </div>
              <p className="text-[11px] leading-snug text-slate-300">
                Imposter receives a subtly paired decoy (e.g. <em>Latte</em> vs <em>Espresso</em>). Creates wild misunderstandings!
              </p>
            </button>

            {/* Blind Mode */}
            <button
              type="button"
              onClick={() => {
                setMode('blind');
                triggerHaptic(25);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'blind'
                  ? 'border-rose-500 bg-rose-950/30 text-rose-100 ring-1 ring-rose-500/60'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300 mb-1">
                <EyeOff className="h-3.5 w-3.5" />
                <span>Blind Phantom</span>
              </div>
              <p className="text-[11px] leading-snug text-slate-300">
                Imposter receives NO word at all (only category). Must bluff by listening carefully to other players.
              </p>
            </button>
          </div>
        </div>

        {/* Accomplices aware toggle (if > 1 imposter) */}
        {impostersCount > 1 && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Accomplices Know Each Other
              </span>
              <span className="text-[11px] text-slate-400">
                Imposters see their partner's name during role reveal
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAccomplicesAware(!accomplicesAware);
                triggerHaptic(20);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accomplicesAware ? 'bg-rose-600' : 'bg-slate-700'
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

        {/* Round Modifiers toggle */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Round Twist Modifiers</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Draw a fun rule twist (e.g., "One-Word Only", "Speed Clue")
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUseModifiers(!useModifiers);
              triggerHaptic(20);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useModifiers ? 'bg-amber-600' : 'bg-slate-700'
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

      {/* 4. Category Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Word Theme & Category
          </label>
          <button
            type="button"
            onClick={onOpenCustomModal}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Custom Pairs ({customPairs.length})</span>
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
                ? 'border-rose-500 bg-rose-950/40 text-white ring-1 ring-rose-500'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-rose-300">
              <Shuffle className="h-3.5 w-3.5" />
              <span>Random Mix</span>
            </div>
            <p className="text-[10px] text-slate-400">All categories combined</p>
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
                  ? 'border-rose-500 bg-rose-950/40 text-white ring-1 ring-rose-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-xs font-bold text-slate-200">
                <span className="truncate">{cat.name}</span>
              </div>
              <p className="text-[10px] text-slate-400">{cat.pairs.length} word pairs</p>
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
                  ? 'border-amber-500 bg-amber-950/40 text-white ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-xs font-bold text-amber-300">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="truncate">My Custom Pack</span>
              </div>
              <p className="text-[10px] text-slate-400">{customPairs.length} custom pairs</p>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fixed Sticky Launch Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-slate-800/40 backdrop-blur-md">
        <div className="max-w-lg mx-auto space-y-1.5">
          <button
            id="start-cipher-game-btn"
            type="button"
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-display font-extrabold text-base shadow-lg shadow-rose-950/50 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-5 w-5" />
            <span>START GAME ({playerNames.length} PLAYERS)</span>
          </button>

          <button
            id="brief-room-onboarding-btn"
            type="button"
            onClick={onOpenOnboarding}
            className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-rose-400" />
            <span>First time playing? Brief the room with Onboarding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
