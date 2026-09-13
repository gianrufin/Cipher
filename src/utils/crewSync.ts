import { CrewProfile, WordCategory, WordPair } from '../types';
import {
  getCrewProfile, getPairKey, getPairWords, getPlayedPairKeys, getRecentWordKeys,
  mergePlayedHistory, recordPlayedPair, secureShuffle, selectNoRepeatPair, isPairBlocked
} from './wordHistory';

const endpoint = String(import.meta.env.VITE_SIGNALING_URL || '').replace(/\/$/, '');

export type CrewSyncState = 'disabled' | 'syncing' | 'synced' | 'offline' | 'error';

export async function syncCrewDefinition(crew: CrewProfile): Promise<CrewSyncState> {
  if (!endpoint || !crew.code) return 'disabled';
  if (!navigator.onLine) return 'offline';
  try {
    const response = await fetch(`${endpoint}/crew/${encodeURIComponent(crew.code)}/profile`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(crew) });
    return response.ok ? 'synced' : 'error';
  } catch { return 'offline'; }
}

export async function loadCrewDefinition(code: string): Promise<CrewProfile | undefined> {
  if (!endpoint || !code) return undefined;
  try { const response=await fetch(`${endpoint}/crew/${encodeURIComponent(code.toUpperCase())}/profile`); return response.ok ? await response.json() as CrewProfile : undefined; }
  catch { return undefined; }
}

export async function syncCrewHistory(): Promise<CrewSyncState> {
  const { code } = getCrewProfile();
  if (!code || !endpoint) return 'disabled';
  if (!navigator.onLine) return 'offline';
  try {
    const response = await fetch(`${endpoint}/crew/${encodeURIComponent(code)}/history`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pairKeys: [...getPlayedPairKeys()],
        wordKeys: [...getRecentWordKeys()]
      })
    });
    if (!response.ok) return 'error';
    const history = await response.json() as { pairKeys?: string[]; wordKeys?: string[] };
    mergePlayedHistory(history.pairKeys || [], history.wordKeys || []);
    return 'synced';
  } catch {
    return navigator.onLine ? 'error' : 'offline';
  }
}

export async function publishCrewHistory(): Promise<CrewSyncState> {
  return syncCrewHistory();
}

export async function selectCrewPair(category: WordCategory): Promise<WordPair> {
  const { code } = getCrewProfile();
  if (!code || !endpoint || !navigator.onLine) return selectNoRepeatPair(category);
  await syncCrewHistory();
  const played = getPlayedPairKeys();
  const candidates = secureShuffle(category.pairs.filter(pair => !played.has(getPairKey(pair)) && !isPairBlocked(pair)));
  if (!candidates.length) return selectNoRepeatPair(category);
  try {
    const response = await fetch(`${endpoint}/crew/${encodeURIComponent(code)}/reserve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidates: candidates.map(pair => ({ id: getPairKey(pair), wordIds: getPairWords(pair) }))
      })
    });
    if (response.status === 409) {
      await syncCrewHistory();
      const exhausted = new Error(`Every pair in ${category.name} has been played by this crew. Choose a broader deck or reset crew history in Settings.`);
      exhausted.name = 'CrewPoolExhausted';
      throw exhausted;
    }
    if (!response.ok) return selectNoRepeatPair(category);
    const result = await response.json() as { id?: string; pairKeys?: string[]; wordKeys?: string[] };
    mergePlayedHistory(result.pairKeys || [], result.wordKeys || []);
    const selected = candidates.find(pair => getPairKey(pair) === result.id);
    if (!selected) return selectNoRepeatPair(category);
    recordPlayedPair(selected);
    return selected;
  } catch (error) {
    if (error instanceof Error && error.name === 'CrewPoolExhausted') throw error;
    return selectNoRepeatPair(category);
  }
}
