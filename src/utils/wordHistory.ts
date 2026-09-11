import { WordCategory, WordPair } from '../types';

const HISTORY_STORAGE_KEY = 'cipher_played_pairs_history';

/**
 * Returns ISO week number for a given date
 */
export function getISOWeek(date: Date = new Date()): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Provides information about the current week's rotation cycle
 */
export function getWeeklyRotationInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = getISOWeek(now);
  
  // Calculate days remaining until Sunday midnight / Monday refresh
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
  const daysUntilNextWeek = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

  return {
    weekKey: `${year}-W${weekNumber}`,
    weekNumber,
    year,
    daysUntilNextWeek,
    label: `Week ${weekNumber} Rotation (${year})`
  };
}

/**
 * Deterministic pseudo-random number generator using a seed
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Rotates and shuffles a list of word pairs deterministically based on the current week seed.
 * This guarantees that every week has a unique, distinct ordering and priority of words!
 */
export function getWeeklyRotatedPairs(pairs: WordPair[], categoryId: string): WordPair[] {
  const { weekNumber, year } = getWeeklyRotationInfo();
  // Generate distinct seed per category & week
  let catSeed = 0;
  for (let i = 0; i < categoryId.length; i++) {
    catSeed += categoryId.charCodeAt(i) * (i + 1);
  }
  const baseSeed = year * 53 + weekNumber * 101 + catSeed;

  const array = [...pairs];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(baseSeed + i) * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns pair key identifier: "wordA|wordB"
 */
export function getPairKey(pair: WordPair): string {
  return `${pair.wordA.trim().toLowerCase()}|${pair.wordB.trim().toLowerCase()}`;
}

/**
 * Get all previously played pair keys from local storage
 */
export function getPlayedPairKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return new Set();
    const list: string[] = JSON.parse(raw);
    return new Set(list);
  } catch {
    return new Set();
  }
}

/**
 * Save a played pair into history to avoid repeats
 */
export function recordPlayedPair(pair: WordPair): void {
  try {
    const played = getPlayedPairKeys();
    played.add(getPairKey(pair));
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(Array.from(played)));
  } catch {
    // Ignore quota issues
  }
}

/**
 * Reset played history to start fresh
 */
export function resetPlayedPairsHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Select a word pair guaranteeing NO REPEATS and applying this week's rotation.
 * If all pairs in the category have been exhausted, it flushes that category's history
 * and starts a fresh cycle seamlessly.
 */
export function selectNoRepeatPair(category: WordCategory): WordPair {
  if (!category.pairs || category.pairs.length === 0) {
    throw new Error(`Category ${category.name} has no word pairs.`);
  }

  // 1. Get weekly rotated pairs
  const rotated = getWeeklyRotatedPairs(category.pairs, category.id);
  
  // 2. Filter out already played pairs
  const played = getPlayedPairKeys();
  const unplayed = rotated.filter(pair => !played.has(getPairKey(pair)));

  let chosenPair: WordPair;

  if (unplayed.length > 0) {
    // Pick the top unplayed pair from this week's rotated priority
    chosenPair = unplayed[0];
  } else {
    // All pairs in this category have been exhausted in current cycle!
    // Clean up only keys belonging to this category to recycle it
    const catKeys = new Set(category.pairs.map(getPairKey));
    const updatedPlayed = Array.from(played).filter(k => !catKeys.has(k));
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedPlayed));
    } catch {
      // Ignore
    }
    // Pick first rotated pair
    chosenPair = rotated[0];
  }

  // Record as played
  recordPlayedPair(chosenPair);
  return chosenPair;
}

/**
 * Computes pool statistics across all categories
 */
export function getVaultStats(categories: WordCategory[], customPairs: WordPair[] = []) {
  let totalPairs = 0;
  for (const cat of categories) {
    totalPairs += cat.pairs.length;
  }
  totalPairs += customPairs.length;

  const totalWords = totalPairs * 2;
  const played = getPlayedPairKeys();
  const playedCount = Math.min(played.size, totalPairs);
  const remainingCount = Math.max(0, totalPairs - playedCount);

  return {
    totalWords,
    totalPairs,
    playedCount,
    remainingCount,
    weeklyInfo: getWeeklyRotationInfo()
  };
}
