import { PlayerCareerStats, RoleType, WordCategory, WordPair } from '../types';

export type OnlineProfile = { id: string; name: string; photo?: string; connected: boolean };
export type OnlineSettings = {
  imposters: 1 | 2 | 3;
  decoys: 0 | 1 | 2;
  ejectionReveal: 'confirm' | 'classified';
  allowSkip: boolean;
  eliminations: 1 | 2;
  categoryId: string;
};

export type OnlineAssignment = {
  role: RoleType;
  word: string;
  teammates: string[];
  intel?: string;
  trueWord?: string;
};

export type OnlinePlayerState = OnlineProfile & { eliminated: boolean; score: number };
export type OnlinePhase = 'lobby' | 'reveal' | 'clues' | 'voting' | 'ejection' | 'bodyguard' | 'counterplay' | 'results';

export type OnlinePublicState = {
  phase: OnlinePhase;
  round: number;
  categoryName: string;
  players: OnlinePlayerState[];
  speakerIndex: number;
  readyIds: string[];
  votedIds: string[];
  runoffCandidateIds?: string[];
  allowSkip: boolean;
  ejectedId?: string;
  ejectionText?: string;
  winner?: 'citizens' | 'imposters' | 'anarchist';
  winReason?: string;
};

export type OnlineRoomMessage =
  | { type: 'profile'; profile: OnlineProfile }
  | { type: 'roster'; roster: OnlineProfile[] }
  | { type: 'match-state'; state: OnlinePublicState }
  | { type: 'private-assignment'; assignment: OnlineAssignment }
  | { type: 'ready'; playerId: string }
  | { type: 'clue-done'; playerId: string }
  | { type: 'vote'; voterId: string; targetId?: string }
  | { type: 'bodyguard-choice'; playerId: string; targetId: string; pardon: boolean }
  | { type: 'counter-inspector'; playerId: string; targetId: string }
  | { type: 'counter-word'; playerId: string; word: string }
  | { type: 'private-prompt'; prompt: 'bodyguard' | 'inspector' | 'word'; targetId?: string }
  | { type: 'room-closed' };

const shuffled = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

export const createOnlineAssignments = (
  profiles: OnlineProfile[],
  settings: OnlineSettings,
  category: WordCategory,
  pair: WordPair
) => {
  const ordered = shuffled(profiles);
  const flip = Math.random() > 0.5;
  const citizenWord = flip ? pair.wordA : pair.wordB;
  const alternateWord = flip ? pair.wordB : pair.wordA;
  const roles = new Map<string, RoleType>();
  ordered.slice(0, settings.imposters).forEach(profile => roles.set(profile.id, 'imposter'));
  let cursor = settings.imposters;
  if (profiles.length >= 7) roles.set(ordered[cursor++].id, 'inspector');
  if (profiles.length >= 9) roles.set(ordered[cursor++].id, 'bodyguard');
  if (profiles.length >= 10) roles.set(ordered[cursor++].id, 'sleeper');
  if (profiles.length >= 11) roles.set(ordered[cursor++].id, 'anarchist');
  for (let count = 0; count < settings.decoys && cursor < ordered.length; count += 1) roles.set(ordered[cursor++].id, 'decoy');

  const imposterNames = profiles.filter(profile => roles.get(profile.id) === 'imposter').map(profile => profile.name);
  const imposterSeats = profiles.map((profile, index) => roles.get(profile.id) === 'imposter' ? index + 1 : 0).filter(Boolean);
  const assignments = new Map<string, OnlineAssignment>();
  profiles.forEach(profile => {
    const role = roles.get(profile.id) || 'citizen';
    const word = role === 'imposter' || role === 'decoy' ? alternateWord : citizenWord;
    assignments.set(profile.id, {
      role,
      word,
      trueWord: role === 'imposter' ? citizenWord : undefined,
      teammates: role === 'imposter' ? imposterNames.filter(name => name !== profile.name) : [],
      intel: role === 'inspector' ? `At least one Imposter is in seat ${imposterSeats.slice(0, 1).join(' or ')}.` : undefined
    });
  });

  return { assignments, citizenWord, alternateWord, categoryName: category.name };
};

export const buildInitialOnlineState = (profiles: OnlineProfile[], categoryName: string, allowSkip: boolean): OnlinePublicState => ({
  phase: 'reveal', round: 1, categoryName, speakerIndex: 0, readyIds: [], votedIds: [],
  allowSkip,
  players: profiles.map(profile => ({ ...profile, eliminated: false, score: 0 }))
});

export const onlineScoreboard = (state: OnlinePublicState, assignments: Map<string, OnlineAssignment>) => {
  const citizenWin = state.winner === 'citizens';
  return state.players.map(player => {
    const role = assignments.get(player.id)?.role || 'citizen';
    const won = state.winner === 'anarchist' ? role === 'anarchist' : citizenWin ? ['citizen', 'decoy', 'inspector', 'bodyguard'].includes(role) : ['imposter', 'sleeper'].includes(role);
    return { ...player, score: (won ? 5 : 0) + (!player.eliminated ? 2 : 0) };
  });
};

export type OnlineCareerSnapshot = Record<string, PlayerCareerStats>;
