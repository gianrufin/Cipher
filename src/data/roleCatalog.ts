import { RoleType } from '../types';

export interface RoleDefinition {
  id: RoleType;
  name: string;
  alignment: 'Citizen' | 'Imposter team' | 'Independent';
  summary: string;
  knows: string;
  power: string;
  wins: string;
  recommended: string;
  complexity: 'Easy' | 'Medium' | 'Advanced';
  image: string;
}

const portrait = (name:string) => `${import.meta.env.BASE_URL}roles/${name}.webp`;

export const ROLE_CATALOG: RoleDefinition[] = [
  { id: 'citizen', name: 'Citizen', alignment: 'Citizen', summary: 'Knows the true word and helps expose every bluff.', knows: 'The true secret word.', power: 'Careful clues and table reads.', wins: 'The Citizen team catches every Imposter.', recommended: 'Every game', complexity: 'Easy', image: portrait('citizen') },
  { id: 'imposter', name: 'Imposter', alignment: 'Imposter team', summary: 'Blends in using a decoy word or only the category.', knows: 'A decoy word, or the category in Blind mode.', power: 'Bluff, redirect suspicion, and decode the true word.', wins: 'The Imposter bloc controls the table or steals the word.', recommended: 'Every game', complexity: 'Easy', image: portrait('imposter') },
  { id: 'decoy', name: 'Decoy', alignment: 'Citizen', summary: 'An innocent player who unknowingly receives the alternate word.', knows: 'A believable but different word.', power: 'None. Their honest clue creates uncertainty.', wins: 'The Citizen team catches every Imposter.', recommended: '6 or more players', complexity: 'Medium', image: portrait('decoy') },
  { id: 'inspector', name: 'Inspector', alignment: 'Citizen', summary: 'Gets one private Signal Sweep containing three seats and exactly one Imposter.', knows: 'The true word and a three-player suspect window.', power: 'Use the guaranteed one-in-three signal to read clues and steer suspicion without revealing your role.', wins: 'The Citizen team catches every Imposter.', recommended: '7 or more players', complexity: 'Medium', image: portrait('inspector') },
  { id: 'bodyguard', name: 'Bodyguard', alignment: 'Citizen', summary: 'May stop one innocent ejection during the match.', knows: 'The true word.', power: 'One private protection decision.', wins: 'The Citizen team catches every Imposter.', recommended: '9 or more players', complexity: 'Medium', image: portrait('bodyguard') },
  { id: 'sleeper', name: 'Sleeper', alignment: 'Imposter team', summary: 'Knows the true word but secretly protects the Imposters.', knows: 'The true word and their hidden allegiance.', power: 'Earn trust with a perfect clue, then redirect the vote.', wins: 'The Imposter team wins.', recommended: '10 or more players', complexity: 'Advanced', image: portrait('sleeper') },
  { id: 'anarchist', name: 'Wild Card', alignment: 'Independent', summary: 'Tries to look suspicious enough to be voted out first.', knows: 'The true word.', power: 'Create doubt without making the act too obvious.', wins: 'They rank first in an elimination vote.', recommended: '9 or more players', complexity: 'Advanced', image: portrait('wild-card') }
];

export const getRoleDefinition = (role: RoleType) => ROLE_CATALOG.find(item => item.id === role) || ROLE_CATALOG[0];
