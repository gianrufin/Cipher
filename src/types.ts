export type RoleType = 'citizen' | 'imposter' | 'accomplice';

export type GameMode = 'decoy' | 'blind';

export type VotingStyle = 'open' | 'blind';

export interface Player {
  id: string;
  name: string;
  role: RoleType;
  secretWord: string;
  isDecoyWord: boolean;
  isDoubleAgentDecoy?: boolean;
  isEliminated: boolean;
  avatarSeed: number;
  votesAgainst: number;
}

export interface WordPair {
  wordA: string;
  wordB: string;
  hint?: string;
}

export interface WordCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  pairs: WordPair[];
}

export interface SessionStats {
  gamesPlayed: number;
  citizenWins: number;
  imposterWins: number;
  totalRoundsPlayed: number;
  totalImpostersCaught: number;
  lastStandHeists: number;
}

export interface MatchSummary {
  roundsPlayed: number;
  impostersCaughtThisMatch: number;
  totalImposters: number;
  winner: 'citizens' | 'imposters';
  winReason: string;
}

export type GamePhase =
  | 'onboarding'
  | 'setup'
  | 'pass_prompt'
  | 'secret_reveal'
  | 'clue_round'
  | 'discussion'
  | 'voting'
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
