import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeHelp, Bomb, BookOpen, Camera, Check, ChevronRight,
  EyeOff, Flame, HeartHandshake, ScanSearch, ShieldCheck, Sparkles,
  Trash2, UserPlus, Users, Vote, WandSparkles
} from 'lucide-react';
import {
  EjectionReveal, EliminationsPerVote, GameMode, SpecialRoleConfig, VotingStyle, WordAudience,
  WordCategory, WordDifficulty, WordPair, GamePreset
} from '../types';
import { BUILT_IN_CATEGORIES } from '../data/wordPacks';
import { DAILY_VAULT_CATEGORY } from '../data/dailyVault';
import { selectCrewPair } from '../utils/crewSync';
import { getDailyDeck, getDailyDeckLabel, getWordPoolStatus } from '../utils/wordHistory';
import { playWhoosh, triggerHaptic } from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';
import { SelfieCaptureModal } from './SelfieCaptureModal';
import { getRoleDefinition } from '../data/roleCatalog';

interface SetupScreenProps {
  onStartGame: (config: {
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
  }) => void;
  customPairs: WordPair[];
  onOpenCustomModal: () => void;
  savedPlayers: string[];
  initialPlayers?: string[];
  initialPlayerPhotos?: string[];
  initialConfig?: {
    impostersCount: 1 | 2 | 3;
    mode: GameMode;
    votingStyle: VotingStyle;
    accomplicesAware: boolean;
    useModifiers: boolean;
    decoyCount: 0 | 1 | 2;
    eliminationsPerVote: EliminationsPerVote;
    ejectionReveal: EjectionReveal;
    allowSkip: boolean;
    specialRoles: SpecialRoleConfig;
    audience: WordAudience;
    difficulty: WordDifficulty;
    selectedCategoryId: string;
  };
}

const STEPS = ['Players', 'Game style', 'Roles', 'Word vault', 'Review'];
const EMPTY_ROLES: SpecialRoleConfig = { anarchist: false, inspector: false, sleeper: false, bodyguard: false };
const FAMILY_CATEGORY_IDS = new Set(['pinoy_everyday', 'food_beverage', 'places_travel', 'creatures_nature', 'sports_hobbies']);

const difficultyCopy: Record<WordDifficulty, string> = {
  easy: 'Broad, familiar pairs that younger players can recognize quickly.',
  standard: 'Everyday concepts with enough overlap for a balanced bluff.',
  tricky: 'Close relationships that reward careful clues, rather than obscure vocabulary.'
};

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame, customPairs, onOpenCustomModal, savedPlayers, initialPlayers = [], initialPlayerPhotos = [], initialConfig
}) => {
  const [step, setStep] = useState(0);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers);
  const [playerPhotos, setPlayerPhotos] = useState<Array<string | null>>(() => initialPlayers.map((_, index) => initialPlayerPhotos[index] || null));
  const [selfiePlayerIndex, setSelfiePlayerIndex] = useState<number | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [impostersCount, setImpostersCount] = useState<1 | 2 | 3>(initialConfig?.impostersCount || 1);
  const [mode, setMode] = useState<GameMode>(initialConfig?.mode || 'decoy');
  const [votingStyle, setVotingStyle] = useState<VotingStyle>(initialConfig?.votingStyle || 'open');
  const [accomplicesAware, setAccomplicesAware] = useState(initialConfig?.accomplicesAware ?? true);
  const [useModifiers, setUseModifiers] = useState(initialConfig?.useModifiers ?? false);
  const [decoyCount, setDecoyCount] = useState<0 | 1 | 2>(initialConfig?.decoyCount || 0);
  const [eliminationsPerVote, setEliminationsPerVote] = useState<EliminationsPerVote>(initialConfig?.eliminationsPerVote || 1);
  const [ejectionReveal, setEjectionReveal] = useState<EjectionReveal>(initialConfig?.ejectionReveal || 'confirm');
  const [allowSkip, setAllowSkip] = useState(initialConfig?.allowSkip ?? true);
  const [specialRoles, setSpecialRoles] = useState<SpecialRoleConfig>(() => ({ ...(initialConfig?.specialRoles || EMPTY_ROLES) }));
  const [audience, setAudience] = useState<WordAudience>(initialConfig?.audience || 'family');
  const [difficulty, setDifficulty] = useState<WordDifficulty>(initialConfig?.difficulty || 'easy');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialConfig?.selectedCategoryId || 'random');
  const [isLaunching, setIsLaunching] = useState(false);
  const [gamePreset, setGamePreset] = useState<GamePreset>('classic');

  const isLargeLobby = playerNames.length >= 7;
  const maxImposters = playerNames.length <= 4 ? 1 : playerNames.length <= 6 ? 2 : 3;
  const baseMaxDecoys: 0 | 1 | 2 = playerNames.length < 4 ? 0 : playerNames.length <= 8 ? 1 : 2;
  const maxDecoys: 0 | 1 | 2 = specialRoles.sleeper && playerNames.length < 11 ? Math.min(1, baseMaxDecoys) as 0 | 1 : baseMaxDecoys;
  const maxSpecialRoles = playerNames.length <= 8 ? 2 : playerNames.length <= 12 ? 3 : 4;
  const selectedSpecialCount = Object.values(specialRoles).filter(Boolean).length;
  const missingPlayers = Math.max(0, 4 - playerNames.length);

  useEffect(() => {
    if (impostersCount > maxImposters) setImpostersCount(maxImposters as 1 | 2 | 3);
    if (!isLargeLobby) setSpecialRoles(EMPTY_ROLES);
    if (!isLargeLobby) setEliminationsPerVote(1);
    if (eliminationsPerVote === 2 && playerNames.length < 9 && specialRoles.anarchist) {
      setSpecialRoles(current => ({ ...current, anarchist: false }));
    }
    if (decoyCount > maxDecoys) setDecoyCount(maxDecoys);
    if (mode === 'blind' && decoyCount > 0) setDecoyCount(0);
  }, [decoyCount, eliminationsPerVote, impostersCount, isLargeLobby, maxDecoys, maxImposters, mode, playerNames.length, specialRoles.anarchist]);

  const categories = useMemo(() => {
    const all: WordCategory[] = [...BUILT_IN_CATEGORIES, DAILY_VAULT_CATEGORY];
    if (customPairs.length) {
      all.push({
        id: 'custom_pack',
        name: 'Custom Pack',
        iconName: 'BookOpen',
        description: 'Your own words and inside jokes.',
        audiences: ['barkada', 'mixed'],
        pairs: customPairs
      });
    }

    return all
      .filter(category => {
        if (audience === 'mixed') return true;
        if (category.audiences?.includes(audience)) return true;
        if (audience === 'family') return FAMILY_CATEGORY_IDS.has(category.id);
        return category.id !== 'science_space' && category.id !== 'history_myths';
      })
      .map(category => ({
        ...category,
        pairs: category.pairs.filter(pair => pair.difficulty
          ? pair.difficulty === difficulty
          : difficulty === 'standard')
      }))
      .filter(category => category.pairs.length > 0);
  }, [audience, customPairs, difficulty]);

  useEffect(() => {
    if (selectedCategoryId !== 'random' && !categories.some(category => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id || 'random');
    }
  }, [categories, selectedCategoryId]);

  const selectedDeckPairs = selectedCategoryId === 'random'
    ? getDailyDeck(categories.flatMap(category => category.pairs))
    : categories.find(category => category.id === selectedCategoryId)?.pairs || [];
  const selectedDeckStatus = getWordPoolStatus(selectedDeckPairs);

  const addPlayer = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) {
      setErrorMessage('Enter a name before adding a player.');
      return;
    }
    if (playerNames.some(name => name.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
      setErrorMessage(`${clean} is already in this group.`);
      return;
    }
    if (playerNames.length >= 16) {
      setErrorMessage('Cipher supports up to 16 players on one device.');
      return;
    }
    setPlayerNames(current => [...current, clean]);
    setPlayerPhotos(current => [...current, null]);
    setNewPlayerName('');
    setErrorMessage('');
    triggerHaptic(25);
  };

  const removePlayer = (index: number) => {
    setPlayerNames(current => current.filter((_, playerIndex) => playerIndex !== index));
    setPlayerPhotos(current => current.filter((_, playerIndex) => playerIndex !== index));
    setSelfiePlayerIndex(null);
    setErrorMessage('');
    triggerHaptic(18);
  };

  const applyBalancedRoles = () => {
    setImpostersCount(playerNames.length >= 10 ? 3 : 2);
    setSpecialRoles({
      inspector: true,
      bodyguard: true,
      sleeper: false,
      anarchist: false
    });
    setDecoyCount(1);
    if (playerNames.length >= 9) setEliminationsPerVote(2);
    triggerHaptic([25, 25, 45]);
  };

  const applyChaoticRoles = () => {
    setImpostersCount(playerNames.length >= 10 ? 3 : 2);
    setSpecialRoles({
      inspector: false,
      bodyguard: false,
      sleeper: true,
      anarchist: eliminationsPerVote === 1 || playerNames.length >= 9
    });
    setDecoyCount(1);
    if (playerNames.length >= 9) setEliminationsPerVote(2);
    triggerHaptic([25, 25, 45]);
  };

  const applyVotingPreset = (preset: 'party' | 'detective' | 'speed') => {
    if (preset === 'party') {
      setVotingStyle('open'); setEjectionReveal('confirm'); setAllowSkip(true); setEliminationsPerVote(1);
    } else if (preset === 'detective') {
      setVotingStyle('blind'); setEjectionReveal('classified'); setAllowSkip(true); setEliminationsPerVote(1);
    } else {
      setVotingStyle('blind'); setEjectionReveal('confirm'); setAllowSkip(false); setEliminationsPerVote(playerNames.length >= 7 ? 2 : 1);
    }
    triggerHaptic(20);
  };

  const applyGamePreset = (preset: GamePreset) => {
    setGamePreset(preset);
    if (preset === 'classic') {
      setImpostersCount(playerNames.length >= 9 ? 2 : 1); setDecoyCount(0); setSpecialRoles(EMPTY_ROLES);
      setMode('decoy'); setVotingStyle('open'); setEjectionReveal('confirm'); setAllowSkip(true); setEliminationsPerVote(1); setUseModifiers(false);
    } else if (preset === 'expanded') {
      setMode('decoy'); setVotingStyle('blind'); setEjectionReveal('confirm'); setAllowSkip(true); setUseModifiers(false);
      if (playerNames.length >= 7) applyBalancedRoles();
      else { setImpostersCount(1); setDecoyCount(1); setSpecialRoles(EMPTY_ROLES); }
    }
    triggerHaptic(20);
  };

  const canContinue = step !== 0 || playerNames.length >= 4;
  const speedEjections: EliminationsPerVote = playerNames.length >= 7 ? 2 : 1;
  const activeVotingPreset = votingStyle === 'open' && ejectionReveal === 'confirm' && allowSkip && eliminationsPerVote === 1
    ? 'party'
    : votingStyle === 'blind' && ejectionReveal === 'classified' && allowSkip && eliminationsPerVote === 1
    ? 'detective'
    : votingStyle === 'blind' && ejectionReveal === 'confirm' && !allowSkip && eliminationsPerVote === speedEjections
    ? 'speed'
    : 'custom';

  const continueSetup = () => {
    if (!canContinue) return;
    setErrorMessage('');
    setStep(current => Math.min(STEPS.length - 1, current + 1));
    triggerHaptic(18);
  };

  const launch = async () => {
    const reservedSeats = Object.values(specialRoles).filter(Boolean).length + decoyCount;
    if (reservedSeats > playerNames.length - impostersCount - 2) {
      setErrorMessage('Reduce the Imposter, Decoy, or special-role count. Keep at least two standard Citizens in the game.');
      setStep(2);
      return;
    }
    if (!categories.length) {
      setErrorMessage('No word pairs match this audience and difficulty yet.');
      setStep(3);
      return;
    }
    const category = selectedCategoryId === 'random'
      ? {
          id: 'variety',
          name: `Daily Deck · ${getDailyDeckLabel()}`,
          iconName: 'Sparkles',
          description: 'All eligible topics shuffled together.',
          audiences: [audience],
          pairs: getDailyDeck(categories.flatMap(item => item.pairs))
        } as WordCategory
      : categories.find(item => item.id === selectedCategoryId) || categories[0];

    setIsLaunching(true);
    setErrorMessage('');
    try {
      const selectedPair = await selectCrewPair(category);
      playWhoosh();
      triggerHaptic([45, 35, 60]);
      onStartGame({
      playerNames,
      playerPhotos: playerPhotos.map(photo => photo || ''),
      impostersCount,
      mode,
      accomplicesAware,
      useModifiers,
      decoyCount,
      eliminationsPerVote,
      ejectionReveal,
      allowSkip,
      votingStyle,
      category,
      selectedPair,
      specialRoles,
      difficulty,
      audience
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Cipher could not prepare a fresh word pair.');
      setStep(3);
    } finally {
      setIsLaunching(false);
    }
  };

  const playerGuidance = missingPlayers
    ? `${missingPlayers} more player${missingPlayers === 1 ? '' : 's'} needed`
    : playerNames.length >= 7
    ? 'Large Lobby Roles unlocked'
    : 'Minimum reached. Ready to continue';

  const roleCards = [
    { key: 'inspector' as const, name: 'Inspector', team: 'Citizen', icon: ScanSearch, copy: 'Signal Sweep: exactly one of three seats is an Imposter.' },
    { key: 'bodyguard' as const, name: 'Bodyguard', team: 'Citizen', icon: ShieldCheck, copy: 'Protects another player once.' },
    { key: 'sleeper' as const, name: 'Sleeper Agent', team: 'Imposter ally', icon: HeartHandshake, copy: 'Knows the true Citizen word.' },
    { key: 'anarchist' as const, name: 'Wild Card', team: 'Neutral', icon: Bomb, copy: 'Must rank first when voted out.' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto min-h-[calc(100svh-61px)] px-4 pt-5 pb-28 flex flex-col">
      <header className="mb-6">
        <div className="cipher-kicker"><span>New session</span></div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {STEPS.map((label, index) => (
            <div key={label}>
              <div className={`h-1 rounded-full ${index <= step ? 'bg-[#ff6846]' : 'bg-white/[0.07]'}`} />
              <span className={`hidden sm:block mt-2 text-[9px] font-mono uppercase ${index === step ? 'text-stone-200' : 'text-stone-600'}`}>{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-stone-600">
          Step {step + 1} of {STEPS.length} / {STEPS[step]}
        </p>
      </header>

      <main className="flex-1">
        {step === 0 && (
          <section className="animate-fadeIn">
            <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-stone-50">Who is playing?</h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">Add each player one at a time. You need at least four people around the table.</p>

            <form onSubmit={addPlayer} className="mt-7 flex gap-2">
              <input
                autoFocus
                value={newPlayerName}
                onChange={event => setNewPlayerName(event.target.value)}
                maxLength={18}
                placeholder="Enter player name"
                className="cipher-input min-w-0 flex-1"
              />
              <button type="submit" className="cipher-button-primary px-4" aria-label="Add player">
                <UserPlus className="h-4 w-4" /> Add
              </button>
            </form>

            <div className={`mt-3 rounded-xl border px-3 py-2.5 text-xs ${missingPlayers ? 'border-white/10 text-stone-500' : 'border-lime-300/20 bg-lime-300/[0.05] text-lime-200'}`}>
              {playerGuidance}
            </div>

            <div className="setup-roster-grid mt-6">
              {playerNames.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <Users className="mx-auto h-6 w-6 text-stone-700" />
                  <p className="mt-3 text-xs text-stone-600">Your roster will appear here</p>
                  {savedPlayers.length >= 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerNames(savedPlayers);
                        setPlayerPhotos(savedPlayers.map(() => null));
                      }}
                      className="cipher-button-secondary mt-5"
                    >
                      <Users className="h-4 w-4" /> Load last group
                    </button>
                  )}
                </div>
              ) : playerNames.map((name, index) => (
                <div key={name} className="setup-player-card rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-3">
                  <span className="font-mono text-[10px] text-stone-600">{String(index + 1).padStart(2, '0')}</span>
                  <button type="button" onClick={() => setSelfiePlayerIndex(index)} className={`setup-photo-button ${playerPhotos[index] ? 'has-photo' : ''}`} aria-label={`${playerPhotos[index] ? 'Change' : 'Add'} optional photo for ${name}`} title="Optional photo">
                    <PlayerAvatar name={name} src={playerPhotos[index]} className="h-12 w-12 border border-white/10 text-xs" /><span><Camera className="h-3 w-3" /></span>
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-200">{name}</span>
                  <button type="button" onClick={() => removePlayer(index)} aria-label={`Remove ${name}`} className="text-stone-600 hover:text-[#ff6846]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-7 animate-fadeIn">
            <div>
              <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-stone-50">Set the tension.</h1>
              <p className="mt-3 text-sm leading-6 text-stone-500">Choose how much information and privacy the table gets.</p>
            </div>
            <div>
              <p className="cipher-kicker mb-3">Game preset</p>
              <div className="grid grid-cols-3 gap-2">
                <PresetButton active={gamePreset === 'classic'} title="Classic" copy="Fast, familiar rules" onClick={() => applyGamePreset('classic')} />
                <PresetButton active={gamePreset === 'expanded'} title="Expanded" copy="Balanced special roles" onClick={() => applyGamePreset('expanded')} />
                <PresetButton active={gamePreset === 'custom'} title="Custom" copy="Tune every rule" onClick={() => setGamePreset('custom')} />
              </div>
            </div>
            <div>
              <p className="cipher-kicker mb-3">Quick voting presets</p>
              <div className="grid grid-cols-3 gap-2">
                <PresetButton active={activeVotingPreset === 'party'} title="Party" copy="Open and forgiving" onClick={() => applyVotingPreset('party')} />
                <PresetButton active={activeVotingPreset === 'detective'} title="Detective" copy="Silent and classified" onClick={() => applyVotingPreset('detective')} />
                <PresetButton active={activeVotingPreset === 'speed'} title="Speed" copy="Fast, no skips" onClick={() => applyVotingPreset('speed')} />
              </div>
              {activeVotingPreset === 'custom' && <p className="mt-2 text-xs font-bold text-[var(--coral)]">Custom voting mix</p>}
            </div>
            <ChoiceGroup
              label="Imposter information"
              options={[
                { id: 'decoy', title: 'Decoy word', copy: 'A related word keeps Imposters active in every clue.' },
                { id: 'blind', title: 'Blind phantom', copy: 'Imposters only see the category. More chaotic.' }
              ]}
              value={mode}
              onChange={value => setMode(value as GameMode)}
            />
            <ChoiceGroup
              label="Voting protocol"
              options={[
                { id: 'open', title: 'Open accusation', copy: 'Debate, point together, then lock a suspect.' },
                { id: 'blind', title: 'Silent ballot', copy: 'Pass the phone and vote privately.' }
              ]}
              value={votingStyle}
              onChange={value => setVotingStyle(value as VotingStyle)}
            />
            <ChoiceGroup
              label="Ejection information"
              options={[
                { id: 'confirm', title: 'Confirmation on', copy: 'Reveal Imposter or not, plus how many Imposters remain.' },
                { id: 'classified', title: 'Keep classified', copy: 'Hide alignment and remaining Imposter count until the debrief.' }
              ]}
              value={ejectionReveal}
              onChange={value => setEjectionReveal(value as EjectionReveal)}
            />
            <ToggleRow label="Allow skip" copy="Silent voters may abstain. If at least half skip, nobody is ejected." checked={allowSkip} onChange={setAllowSkip} />
            {isLargeLobby && (
              <ChoiceGroup
                label="Eliminations per vote"
                options={[
                  { id: '1', title: 'Single', copy: 'The table eliminates one suspect.' },
                  { id: '2', title: 'Double', copy: playerNames.length < 9 ? 'Two suspects. High risk with 7–8 players.' : 'Two suspects for a faster large-group game.' }
                ]}
                value={String(eliminationsPerVote)}
                onChange={value => setEliminationsPerVote(Number(value) as EliminationsPerVote)}
              />
            )}
            <ToggleRow label="Round modifiers" copy="Add a random clue constraint each round." checked={useModifiers} onChange={setUseModifiers} />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-stone-50">Build the cast.</h1>
              <p className="mt-3 text-sm leading-6 text-stone-500">Cipher will assign every role privately after you start.</p>
            </div>

            <div>
              <p className="cipher-kicker mb-3">Imposters</p>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    disabled={count > maxImposters}
                    onClick={() => setImpostersCount(count)}
                    className={`rounded-2xl border p-4 text-center transition-all disabled:opacity-25 ${impostersCount === count ? 'border-[#ff6846] bg-[#ff6846]/10' : 'border-white/10 bg-white/[0.025]'}`}
                  >
                    <span className="font-display text-2xl font-black text-stone-100">{count}</span>
                    <span className="block mt-1 text-[10px] uppercase tracking-wider text-stone-500">Imposter{count > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            </div>

            {impostersCount > 1 && (
              <ToggleRow label="Known accomplices" copy="Imposters see each other's names." checked={accomplicesAware} onChange={setAccomplicesAware} />
            )}

            <div>
              <p className="cipher-kicker mb-3">Decoy Citizens</p>
              <div className="grid grid-cols-3 gap-2">
                {([0, 1, 2] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    disabled={count > maxDecoys || mode === 'blind'}
                    onClick={() => setDecoyCount(count)}
                    className={`rounded-2xl border p-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-25 ${decoyCount === count ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/[0.025]'}`}
                  >
                    <span className="font-display text-xl font-black text-stone-100">{count}</span>
                    <span className="mt-1 block text-[9px] uppercase tracking-wider text-stone-500">{count === 1 ? 'Decoy' : 'Decoys'}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-stone-500">
                {mode === 'blind'
                  ? 'Unavailable in Blind Phantom mode.'
                  : 'Innocent Citizens who unknowingly receive the alternate word.'}
              </p>
            </div>

            <div className={`rounded-[24px] border overflow-hidden ${isLargeLobby ? 'border-lime-300/25 bg-lime-300/[0.035]' : 'border-white/[0.07] bg-white/[0.02] opacity-60'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <BadgeHelp className={`h-5 w-5 shrink-0 ${isLargeLobby ? 'text-lime-300' : 'text-stone-700'}`} />
                    <div>
                      <h2 className="text-sm font-black text-stone-100">Large Lobby Roles</h2>
                      <p className="mt-1 text-[11px] leading-5 text-stone-500">{isLargeLobby ? 'Unlocked for this group.' : 'Requires 7 or more players.'}</p>
                    </div>
                  </div>
                  {isLargeLobby && (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={applyBalancedRoles} className="rounded-lg bg-lime-300 px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-stone-950">Balanced</button>
                      <button type="button" onClick={applyChaoticRoles} className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-amber-200">Chaotic</button>
                    </div>
                  )}
                </div>
              </div>
              {isLargeLobby && (
                <div className="border-t border-white/[0.07] p-3">
                  <p className="mb-3 text-[10px] leading-4 text-stone-500">Choose a preset, or tap individual roles for a custom cast.</p>
                  <div className="grid grid-cols-2 gap-2">
                  {roleCards.map(({ key, name, team, icon: Icon, copy }) => {
                    const unavailableAnarchist = key === 'anarchist' && eliminationsPerVote === 2 && playerNames.length < 9;
                    return (
                    <button
                      key={key}
                      type="button"
                      disabled={unavailableAnarchist || (!specialRoles[key] && selectedSpecialCount >= maxSpecialRoles)}
                      aria-pressed={specialRoles[key]}
                      onClick={() => {
                        setSpecialRoles(current => ({ ...current, [key]: !current[key] }));
                      }}
                      className={`rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-30 ${specialRoles[key] ? 'border-lime-300/35 bg-lime-300/[0.07]' : 'border-white/[0.07] bg-black/10'}`}
                    >
                      <div className="flex items-center justify-between">
                        <img src={getRoleDefinition(key).image} alt="" className="h-12 w-12 border border-[var(--line)] bg-[var(--surface-inset)] object-contain" />
                        {specialRoles[key] && <Check className="h-3.5 w-3.5 text-lime-300" />}
                      </div>
                      <p className="mt-3 text-xs font-bold text-stone-100">{name}</p>
                      <p className="mt-1 text-[9px] font-mono uppercase text-stone-600">{team}</p>
                      <p className="mt-2 text-[10px] leading-4 text-stone-500">{copy}</p>
                    </button>
                    );
                  })}
                  </div>
                  {eliminationsPerVote === 2 && playerNames.length < 9 && (
                    <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-[10px] leading-4 text-amber-200">For 7–8 players, Double Elimination disables the Wild Card to prevent an overly volatile opening vote.</p>
                  )}
                  {eliminationsPerVote === 2 && decoyCount === 2 && (
                    <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-[10px] leading-4 text-rose-200">High-chaos setup: two Decoy Citizens plus two eliminations can swing the match very quickly.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-7 animate-fadeIn">
            <div>
              <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-stone-50">Choose the language of play.</h1>
              <p className="mt-3 text-sm leading-6 text-stone-500">Difficulty measures how closely related the pair is, not how obscure the words are.</p>
            </div>

            <ChoiceGroup
              label="Audience"
              options={[
                { id: 'family', title: 'Family', copy: 'Kid-friendly and immediately familiar.' },
                { id: 'barkada', title: 'Barkada', copy: 'Filipino daily life and playful references.' },
                { id: 'mixed', title: 'Mixed', copy: 'Philippine and global categories together.' }
              ]}
              value={audience}
              onChange={value => setAudience(value as WordAudience)}
              columns={3}
            />

            <div>
              <p className="cipher-kicker mb-3">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'standard', 'tricky'] as WordDifficulty[]).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`rounded-xl border p-3 text-left capitalize ${difficulty === level ? 'border-[#ff6846] bg-[#ff6846]/10 text-stone-100' : 'border-white/[0.08] text-stone-500'}`}
                  >
                    <span className="text-xs font-bold">{level}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">{difficultyCopy[difficulty]}</p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="cipher-kicker">Category</p>
                <button type="button" onClick={onOpenCustomModal} className="flex items-center gap-1.5 text-[10px] font-bold text-[#ff8065]">
                  <BookOpen className="h-3.5 w-3.5" /> Custom pack
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                <CategoryButton
                  active={selectedCategoryId === 'random'}
                  title={`Daily Deck · ${getDailyDeckLabel()}`}
                  copy={`${getWordPoolStatus(getDailyDeck(categories.flatMap(category => category.pairs))).freshPairs} fresh pairs · rotates daily in Philippine time`}
                  onClick={() => setSelectedCategoryId('random')}
                />
                {categories.map(category => (
                  <CategoryButton
                    key={category.id}
                    active={selectedCategoryId === category.id}
                    title={category.name}
                    copy={`${getWordPoolStatus(category.pairs).freshPairs} fresh of ${category.pairs.length} · ${category.description}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  />
                ))}
              </div>
              <p className={`mt-3 text-xs font-bold ${selectedDeckStatus.freshPairs >= 20 ? 'text-emerald-400' : 'text-[var(--coral)]'}`}>
                {selectedDeckStatus.freshPairs >= 20
                  ? `${selectedDeckStatus.freshPairs} fresh pairs. Ready for a long game night.`
                  : `Only ${selectedDeckStatus.freshPairs} fresh pairs remain. Choose Variety Deck for a 20-game sitting.`}
              </p>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6 animate-fadeIn">
            <div>
              <p className="cipher-kicker">Final check</p>
              <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-stone-50 mt-2">Ready the room.</h1>
              <p className="mt-3 text-sm leading-6 text-stone-500">The exact word pair and every role stay hidden until the private pass.</p>
            </div>

            <div className="cipher-panel overflow-hidden">
              <ReviewRow label="Players" value={`${playerNames.length} around the table`} />
              <ReviewRow label="Game" value={`${mode === 'decoy' ? 'Decoy word' : 'Blind phantom'} · ${votingStyle === 'open' ? 'Open vote' : 'Silent ballot'} · ${eliminationsPerVote === 2 ? 'Double elimination' : 'Single elimination'}`} />
              <ReviewRow label="Voting" value={`${ejectionReveal === 'confirm' ? 'Confirmation on' : 'Identity classified'} · ${allowSkip ? 'Skip allowed' : 'Vote required'}`} />
              <ReviewRow label="Cast" value={`${impostersCount} Imposter${impostersCount > 1 ? 's' : ''} · ${decoyCount} Decoy${decoyCount === 1 ? '' : 's'} · ${Object.values(specialRoles).filter(Boolean).length} special roles`} />
              <ReviewRow label="Words" value={`${audience} · ${difficulty} · ${selectedCategoryId === 'random' ? 'Variety Deck' : categories.find(category => category.id === selectedCategoryId)?.name || 'Pinoy Everyday'}`} />
            </div>

            <div className="rounded-2xl border border-[#ff6846]/20 bg-[#ff6846]/[0.05] p-4 flex gap-3">
              <WandSparkles className="h-5 w-5 shrink-0 text-[#ff8065]" />
              <p className="text-xs leading-5 text-stone-400">After the match, Cipher will award Match Points, update each player's local standings, and generate shareable result cards.</p>
            </div>
          </section>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-xl border border-[#ff6846]/25 bg-[#ff6846]/10 px-3 py-2 text-xs text-[#ff9a84]">{errorMessage}</p>
        )}
      </main>

      <SelfieCaptureModal
        playerName={selfiePlayerIndex === null ? null : playerNames[selfiePlayerIndex]}
        onClose={() => setSelfiePlayerIndex(null)}
        onCapture={photo => {
          if (selfiePlayerIndex === null) return;
          setPlayerPhotos(current => current.map((value, index) => index === selfiePlayerIndex ? photo : value));
          setSelfiePlayerIndex(null);
          setErrorMessage('');
        }}
      />

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#0b0b09]/92 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(current => current - 1)} className="cipher-button-secondary px-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canContinue} onClick={continueSetup} className="cipher-button-primary flex-1 disabled:opacity-30 disabled:cursor-not-allowed">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={isLaunching} onClick={() => void launch()} className="cipher-button-primary flex-1 disabled:opacity-50">
              {isLaunching ? 'Preparing fresh words…' : 'Deal roles'} <Sparkles className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

const PresetButton = ({ active, title, copy, onClick }: { active: boolean; title: string; copy: string; onClick: () => void }) => (
  <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-24 border-2 p-3 text-left transition-transform hover:-translate-y-0.5 ${active ? 'border-[var(--ink)] bg-[var(--coral)] text-white' : 'border-[var(--line)] bg-[var(--paper)]'}`}>
    <span className="flex items-center justify-between text-sm font-black">{title}{active && <Check className="h-4 w-4" />}</span>
    <span className={`mt-2 block text-[10px] leading-4 ${active ? 'text-white/85' : 'text-stone-500'}`}>{copy}</span>
  </button>
);

const ChoiceGroup = ({
  label, options, value, onChange, columns = 2
}: {
  label: string;
  options: { id: string; title: string; copy: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) => (
  <div>
    <p className="cipher-kicker mb-3">{label}</p>
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map(option => (
        <button key={option.id} type="button" onClick={() => onChange(option.id)} className={`rounded-2xl border p-4 text-left transition-all ${value === option.id ? 'border-[#ff6846] bg-[#ff6846]/10' : 'border-white/[0.08] bg-white/[0.025]'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-black text-stone-100">{option.title}</span>
            {value === option.id ? <Check className="h-4 w-4 text-[#ff8065]" /> : <ChevronRight className="h-4 w-4 text-stone-700" />}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">{option.copy}</p>
        </button>
      ))}
    </div>
  </div>
);

const ToggleRow = ({ label, copy, checked, onChange }: { label: string; copy: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left">
    <div>
      <p className="text-sm font-bold text-stone-200">{label}</p>
      <p className="mt-1 text-[11px] leading-5 text-stone-500">{copy}</p>
    </div>
    <span className={`h-6 w-11 shrink-0 rounded-full p-1 transition-colors ${checked ? 'bg-[#ff6846]' : 'bg-stone-800'}`}>
      <span className={`block h-4 w-4 rounded-full bg-stone-950 transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </span>
  </button>
);

const CategoryButton = ({ active, title, copy, onClick }: { active: boolean; title: string; copy: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${active ? 'border-[#ff6846] bg-[#ff6846]/10' : 'border-white/[0.07] bg-white/[0.02]'}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-stone-200">{title}</p>
        <p className="mt-1 line-clamp-1 text-[10px] text-stone-600">{copy}</p>
      </div>
      {active && <Check className="h-4 w-4 shrink-0 text-[#ff8065]" />}
    </div>
  </button>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4 last:border-0">
    <span className="cipher-kicker">{label}</span>
    <span className="max-w-[68%] text-right text-xs font-bold capitalize text-stone-200">{value}</span>
  </div>
);
