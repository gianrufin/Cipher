import { CrewDefaults, CrewProfile, CrewMember } from '../types';
import { createCrewCode, saveCrewProfile } from './wordHistory';

const CREWS_KEY = 'cipher_crews_v1';
const ACTIVE_CREW_KEY = 'cipher_active_crew_id';

export const DEFAULT_CREW_SETTINGS: CrewDefaults = {
  preset: 'classic', timerSeconds: 20, preTimerEverySpeaker: true,
  votingStyle: 'open', audience: 'family', difficulty: 'easy'
};

const id = () => globalThis.crypto?.randomUUID?.() || `crew-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function readCrews(): CrewProfile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CREWS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveCrews(crews: CrewProfile[]): void {
  localStorage.setItem(CREWS_KEY, JSON.stringify(crews));
  window.dispatchEvent(new CustomEvent('cipher-crews-change'));
}

export function createCrew(name: string, memberNames: string[]): CrewProfile {
  const crew: CrewProfile = {
    id: id(), code: createCrewCode(), name: name.trim() || 'My Crew',
    members: memberNames.filter(Boolean).map((memberName): CrewMember => ({ id: id(), name: memberName.trim(), active: true })),
    defaults: DEFAULT_CREW_SETTINGS
  };
  saveCrews([...readCrews(), crew]);
  setActiveCrew(crew);
  return crew;
}

export function updateCrew(crew: CrewProfile): void {
  saveCrews(readCrews().map(item => item.id === crew.id ? crew : item));
  if (getActiveCrew()?.id === crew.id) setActiveCrew(crew);
}

export function removeCrew(crewId: string): void {
  saveCrews(readCrews().filter(item => item.id !== crewId));
  if (localStorage.getItem(ACTIVE_CREW_KEY) === crewId) localStorage.removeItem(ACTIVE_CREW_KEY);
}

export function setActiveCrew(crew?: CrewProfile): void {
  if (!crew) { localStorage.removeItem(ACTIVE_CREW_KEY); saveCrewProfile('', ''); return; }
  localStorage.setItem(ACTIVE_CREW_KEY, crew.id);
  saveCrewProfile(crew.code, crew.name);
}

export function getActiveCrew(): CrewProfile | undefined {
  const activeId = localStorage.getItem(ACTIVE_CREW_KEY);
  return readCrews().find(crew => crew.id === activeId);
}

export function markCrewPlayed(crewId: string, starterId?: string): void {
  const crew = readCrews().find(item => item.id === crewId);
  if (!crew) return;
  updateCrew({ ...crew, lastPlayedAt: new Date().toISOString(), lastStarterId: starterId || crew.lastStarterId });
}
