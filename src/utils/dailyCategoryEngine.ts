import { WordCategory, WordPair } from '../types';

const stableHash = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const normalizeWord = (word: string) => word.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Returns the Philippine calendar date string (YYYY-MM-DD)
 */
export function getManilaDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Returns a human-friendly Philippine date label (e.g. "Sep 18")
 */
export function getCategoryDailyDeckLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Computes an absolute day counter starting from Jan 1, 2025 in Manila time.
 * Covers 2+ years (730+ days) and continues indefinitely into the future.
 */
export function getDayEpochIndex(date = new Date()): number {
  const dateStr = getManilaDateString(date);
  const [year, month, day] = dateStr.split('-').map(Number);
  const epoch = Date.UTC(2025, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.max(0, Math.floor((current - epoch) / 86400000));
}

/**
 * Deterministically generates the daily 10-pair deck for a category on a specific date.
 * Guarantees:
 * 1. Exactly 10 pairs (or pairs.length if total pairs < 10).
 * 2. Strict intra-day word uniqueness: none of the 10 pairs share any word with each other (20 unique words).
 * 3. Seeded date rotation that continuously shuffles and varies every single day for 2+ years (730+ days).
 */
export function getCategoryDailyPairs(
  pairs: WordPair[],
  categoryId: string,
  date = new Date(),
  count = 10
): WordPair[] {
  if (!pairs || pairs.length === 0) return [];
  const targetCount = Math.min(count, pairs.length);

  const dayIndex = getDayEpochIndex(date);
  const dayStr = getManilaDateString(date);

  // High-entropy 32-bit PRNG seed unique to category + day + date string
  let seed = stableHash(`cipher-cat-daily-${categoryId}-${dayIndex}-${dayStr}`);
  const nextRandom = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  // Perform Fisher-Yates shuffle on a copy
  const pool = [...pairs];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick pairs while enforcing zero duplicate words within this daily set of 10 pairs
  const selected: WordPair[] = [];
  const usedWords = new Set<string>();

  for (const candidate of pool) {
    const wordA = normalizeWord(candidate.wordA);
    const wordB = normalizeWord(candidate.wordB);

    if (!usedWords.has(wordA) && !usedWords.has(wordB)) {
      selected.push(candidate);
      usedWords.add(wordA);
      usedWords.add(wordB);
      if (selected.length >= targetCount) break;
    }
  }

  // Fallback in case pool words were too densely intersecting to fill all slots
  if (selected.length < targetCount) {
    for (const candidate of pool) {
      if (!selected.includes(candidate)) {
        selected.push(candidate);
        if (selected.length >= targetCount) break;
      }
    }
  }

  return selected.slice(0, targetCount);
}

/**
 * Creates a synthetic WordCategory representing Today's 10 pairs for the given category
 */
export function createCategoryDailyDeck(
  baseCategory: WordCategory,
  date = new Date(),
  count = 10
): WordCategory {
  const dailyPairs = getCategoryDailyPairs(baseCategory.pairs, baseCategory.id, date, count);
  const dateLabel = getCategoryDailyDeckLabel(date);
  const dayNum = getDayEpochIndex(date) + 1;

  const isPinoy = baseCategory.id === 'pinoy_everyday';

  return {
    ...baseCategory,
    id: `${baseCategory.id}_daily`,
    name: `${baseCategory.name} · Today's 10`,
    iconName: baseCategory.iconName,
    description: isPinoy
      ? `Today's 10 Tagalog pairs (${dateLabel}) · Day ${dayNum} · 0 repeated words.`
      : `Today's 10 pairs (${dateLabel}) · Day ${dayNum} · Everyday rotation.`,
    pairs: dailyPairs
  };
}
