export type RoleType =
  | 'citizen'
  | 'decoy'
  | 'imposter'
  | 'anarchist'
  | 'inspector'
  | 'sleeper'
  | 'bodyguard';

export type SpecialRole = Exclude<RoleType, 'citizen' | 'imposter'>;

export interface SpecialRoleConfig {
  anarchist: boolean;
  inspector: boolean;
  sleeper: boolean;
  bodyguard: boolean;
}

export type GameMode = 'decoy' | 'blind';

export type VotingStyle = 'open' | 'blind';
export type EliminationsPerVote = 1 | 2;
export type EjectionReveal = 'confirm' | 'classified';
export type GameConnectionMode = 'local' | 'online';
export type WordDifficulty = 'easy' | 'standard' | 'tricky';
export type WordAudience = 'family' | 'barkada' | 'mixed';
export type GamePreset = 'classic' | 'expanded' | 'custom';

export interface CrewMember {
  id: string;
  name: string;
  active: boolean;
  temporary?: boolean;
}

export interface CrewDefaults {
  preset: GamePreset;
  timerSeconds: 5 | 10 | 20 | 30;
  preTimerEverySpeaker: boolean;
  votingStyle: VotingStyle;
  audience: WordAudience;
  difficulty: WordDifficulty;
}

export interface CrewProfile {
  id: string;
  code: string;
  name: string;
  members: CrewMember[];
  defaults: CrewDefaults;
  lastPlayedAt?: string;
  lastStarterId?: string;
}

export interface Player {
  id: string;
  name: string;
  avatarPhoto?: string;
  role: RoleType;
  secretWord: string;
  isDecoyWord: boolean;
  isEliminated: boolean;
  avatarSeed: number;
  votesAgainst: number;
  intel?: string;
  powerUsed?: boolean;
  roundsSurvived?: number;
  successfulActions?: number;
}

export interface WordPair {
  wordA: string;
  wordB: string;
  hint?: string;
  difficulty?: WordDifficulty;
}

export interface WordCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  pairs: WordPair[];
  audiences?: WordAudience[];
}

export interface PlayerMatchScore {
  playerId: string;
  name: string;
  role: RoleType;
  points: number;
  reasons: string[];
}

export interface PlayerCareerStats {
  name: string;
  gamesPlayed: number;
  wins: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  roleWins: Partial<Record<RoleType, number>>;
}

export interface SessionStats {
  gamesPlayed: number;
  citizenWins: number;
  imposterWins: number;
  anarchistWins: number;
  totalRoundsPlayed: number;
  totalImpostersCaught: number;
  lastStandHeists: number;
}

export interface MatchSummary {
  roundsPlayed: number;
  impostersCaughtThisMatch: number;
  totalImposters: number;
  winner: 'citizens' | 'imposters' | 'anarchist';
  winReason: string;
  specialWinnerName?: string;
  bonusPlayerId?: string;
  playerScores?: PlayerMatchScore[];
}

export type GamePhase =
  | 'onboarding'
  | 'mode_select'
  | 'crew_select'
  | 'online_room'
  | 'setup'
  | 'pass_prompt'
  | 'secret_reveal'
  | 'clue_round'
  | 'discussion'
  | 'voting'
  | 'bodyguard_decision'
  | 'elimination_reveal'
  | 'imposter_last_stand'
  | 'game_stats';

export interface RoundModifier {
  id: string;
  title: string;
  rule: string;
  icon: string;
}

export interface GameScoreboard {
  citizenWins: number;
  imposterWins: number;
  totalGames: number;
}
