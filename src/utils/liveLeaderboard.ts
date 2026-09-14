import { OnlinePublicState } from '../multiplayer/game';

const STORAGE_KEY = 'cipher_live_leaderboard_v1';
const MAX_MATCH_IDS = 100;

export type LiveLeaderboardEntry = {
  name: string;
  gamesPlayed: number;
  totalPoints: number;
  lastPlayedAt: string;
};

type StoredLeaderboard = {
  entries: Record<string, LiveLeaderboardEntry>;
  recordedMatchIds: string[];
};

const empty = (): StoredLeaderboard => ({ entries: {}, recordedMatchIds: [] });

const read = (): StoredLeaderboard => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as StoredLeaderboard | null;
    return parsed?.entries && Array.isArray(parsed.recordedMatchIds) ? parsed : empty();
  } catch {
    return empty();
  }
};

export const getLiveLeaderboard = () => Object.values(read().entries)
  .sort((a, b) => b.totalPoints - a.totalPoints || b.gamesPlayed - a.gamesPlayed || a.name.localeCompare(b.name));

export const recordLiveMatch = (state: OnlinePublicState) => {
  if (state.phase !== 'results' || !state.matchId) return getLiveLeaderboard();
  const stored = read();
  if (stored.recordedMatchIds.includes(state.matchId)) return Object.values(stored.entries).sort((a, b) => b.totalPoints - a.totalPoints);
  const playedAt = new Date().toISOString();
  for (const player of state.players) {
    const key = player.name.trim().toLocaleLowerCase();
    if (!key) continue;
    const previous = stored.entries[key] || { name: player.name.trim(), gamesPlayed: 0, totalPoints: 0, lastPlayedAt: playedAt };
    stored.entries[key] = { name: player.name.trim(), gamesPlayed: previous.gamesPlayed + 1, totalPoints: previous.totalPoints + player.score, lastPlayedAt: playedAt };
  }
  stored.recordedMatchIds = [...stored.recordedMatchIds, state.matchId].slice(-MAX_MATCH_IDS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* Keep the current results visible even if storage is full. */ }
  return Object.values(stored.entries).sort((a, b) => b.totalPoints - a.totalPoints || b.gamesPlayed - a.gamesPlayed || a.name.localeCompare(b.name));
};
