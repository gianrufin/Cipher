import { WordCategory, WordPair } from '../types';

const HISTORY_STORAGE_KEY = 'cipher_played_pairs_history_v2';
const LEGACY_HISTORY_STORAGE_KEY = 'cipher_played_pairs_history';
const RECENT_WORDS_STORAGE_KEY = 'cipher_recent_words_history';
const CREW_CODE_STORAGE_KEY = 'cipher_crew_code';
const CREW_NAME_STORAGE_KEY = 'cipher_crew_name';
const RECENT_WORD_LIMIT = 80;

const normalizeWord = (word: string) => word.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

const stableId = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export function getPairKey(pair: WordPair): string {
  return `pair_${stableId([normalizeWord(pair.wordA), normalizeWord(pair.wordB)].sort().join('|'))}`;
}

export function getPairWords(pair: WordPair): string[] {
  return [normalizeWord(pair.wordA), normalizeWord(pair.wordB)].map(word => `word_${stableId(word)}`);
}

function safeList(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function getPlayedPairKeys(): Set<string> {
  const current = safeList(HISTORY_STORAGE_KEY);
  if (current.length) return new Set(current);
  return new Set(safeList(LEGACY_HISTORY_STORAGE_KEY));
}

export function getRecentWordKeys(): Set<string> {
  return new Set(safeList(RECENT_WORDS_STORAGE_KEY));
}

export function recordPlayedPair(pair: WordPair): void {
  try {
    const played = getPlayedPairKeys();
    played.add(getPairKey(pair));
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([...played]));

    const recent = safeList(RECENT_WORDS_STORAGE_KEY);
    getPairWords(pair).forEach(word => {
      const existing = recent.indexOf(word);
      if (existing >= 0) recent.splice(existing, 1);
      recent.push(word);
    });
    localStorage.setItem(RECENT_WORDS_STORAGE_KEY, JSON.stringify(recent.slice(-RECENT_WORD_LIMIT)));
    window.dispatchEvent(new CustomEvent('cipher-history-change'));
  } catch {
    // A game can still continue when browser storage is unavailable.
  }
}

export function mergePlayedHistory(pairKeys: string[], wordKeys: string[] = []): void {
  try {
    const played = new Set([...getPlayedPairKeys(), ...pairKeys]);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([...played]));
    const recent = [...new Set([...safeList(RECENT_WORDS_STORAGE_KEY), ...wordKeys])].slice(-RECENT_WORD_LIMIT);
    localStorage.setItem(RECENT_WORDS_STORAGE_KEY, JSON.stringify(recent));
    window.dispatchEvent(new CustomEvent('cipher-history-change'));
  } catch {
    // Ignore storage restrictions.
  }
}

function randomIndex(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) return Math.floor(Math.random() * maxExclusive);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const value = new Uint32Array(1);
  do cryptoObject.getRandomValues(value); while (value[0] >= limit);
  return value[0] % maxExclusive;
}

export function secureShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = randomIndex(index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

export interface WordPoolStatus {
  total: number;
  freshPairs: number;
  freshWords: number;
  exhausted: boolean;
}

export function getWordPoolStatus(pairs: WordPair[]): WordPoolStatus {
  const played = getPlayedPairKeys();
  const recentWords = getRecentWordKeys();
  const freshPairs = pairs.filter(pair => !played.has(getPairKey(pair)));
  const fullyFresh = freshPairs.filter(pair => getPairWords(pair).every(word => !recentWords.has(word)));
  return {
    total: pairs.length,
    freshPairs: freshPairs.length,
    freshWords: fullyFresh.length,
    exhausted: freshPairs.length === 0
  };
}

/** Selects an unused pair. It never silently clears history. */
export function selectNoRepeatPair(category: WordCategory): WordPair {
  if (!category.pairs.length) throw new Error(`${category.name} has no word pairs.`);

  const played = getPlayedPairKeys();
  const recentWords = getRecentWordKeys();
  const unplayed = category.pairs.filter(pair => !played.has(getPairKey(pair)));
  if (!unplayed.length) {
    throw new Error(`Every pair in ${category.name} has been played. Choose a broader deck or reset its history in Settings.`);
  }

  const withoutRecentWords = unplayed.filter(pair => getPairWords(pair).every(word => !recentWords.has(word)));
  const pair = secureShuffle(withoutRecentWords.length ? withoutRecentWords : unplayed)[0];
  recordPlayedPair(pair);
  return pair;
}

export function resetPlayedPairsHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
    localStorage.removeItem(RECENT_WORDS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cipher-history-change'));
  } catch {
    // Ignore storage restrictions.
  }
}

export function getCrewProfile(): { code: string; name: string } {
  try {
    return {
      code: localStorage.getItem(CREW_CODE_STORAGE_KEY) || '',
      name: localStorage.getItem(CREW_NAME_STORAGE_KEY) || ''
    };
  } catch {
    return { code: '', name: '' };
  }
}

export function saveCrewProfile(code: string, name: string): void {
  try {
    localStorage.setItem(CREW_CODE_STORAGE_KEY, code.trim().toUpperCase());
    localStorage.setItem(CREW_NAME_STORAGE_KEY, name.trim());
  } catch {
    // Crew sync remains optional.
  }
}

export function createCrewCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[randomIndex(alphabet.length)]).join('');
}

export function getVaultStats(categories: WordCategory[], customPairs: WordPair[] = []) {
  const pairs = [...categories.flatMap(category => category.pairs), ...customPairs];
  const status = getWordPoolStatus(pairs);
  return {
    totalWords: pairs.length * 2,
    totalPairs: pairs.length,
    playedCount: Math.max(0, pairs.length - status.freshPairs),
    remainingCount: status.freshPairs,
    weeklyInfo: { weekKey: 'continuous', weekNumber: 0, year: new Date().getFullYear(), daysUntilNextWeek: 0, label: 'Continuous crew deck' }
  };
}
