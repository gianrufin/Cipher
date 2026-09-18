import { WordCategory, RoundModifier } from '../types';
import { PINOY_TAGALOG_PAIRS } from './pinoyWords';
import {
  EXPANDED_FOOD_BEVERAGE,
  EXPANDED_PLACES_TRAVEL,
  EXPANDED_ROLES_HEISTS,
  EXPANDED_OBJECTS_TECH,
  EXPANDED_CREATURES_NATURE,
  EXPANDED_POPCULTURE,
  EXPANDED_SPORTS_HOBBIES
} from './expandedCategoryWords';

export const BUILT_IN_CATEGORIES: WordCategory[] = [
  {
    id: 'pinoy_everyday',
    name: 'Pinoy Everyday',
    iconName: 'Sun',
    description: 'Tunay na salitang Tagalog at pamumuhay: pagkain, tradisyon, kagamitan, at komunidad.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: PINOY_TAGALOG_PAIRS
  },
  {
    id: 'food_beverage',
    name: 'Food & Drinks',
    iconName: 'Utensils',
    description: 'Common meals, snacks, pastries, dishes, and refreshing drinks.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_FOOD_BEVERAGE
  },
  {
    id: 'places_travel',
    name: 'Places & Travel',
    iconName: 'Compass',
    description: 'Places people visit at home, in town, or on journeys.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_PLACES_TRAVEL
  },
  {
    id: 'roles_heists',
    name: 'People & Jobs',
    iconName: 'ShieldAlert',
    description: 'Familiar professions, community workers, and clandestine characters.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_ROLES_HEISTS
  },
  {
    id: 'objects_tech',
    name: 'Things & Gadgets',
    iconName: 'Smartphone',
    description: 'Everyday tools, household items, hardware, and modern technology.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_OBJECTS_TECH
  },
  {
    id: 'creatures_nature',
    name: 'Animals & Nature',
    iconName: 'PawPrint',
    description: 'Wildlife, pets, weather elements, flora, and natural landscapes.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_CREATURES_NATURE
  },
  {
    id: 'popculture_entertainment',
    name: 'Shows & Games',
    iconName: 'Clapperboard',
    description: 'Movies, streaming, music, gaming, and entertainment culture.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_POPCULTURE
  },
  {
    id: 'sports_hobbies',
    name: 'Sports & Hobbies',
    iconName: 'Trophy',
    description: 'Athletics, competitive games, creative crafts, and leisure pastimes.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: EXPANDED_SPORTS_HOBBIES
  }
];

export const ROUND_MODIFIERS: RoundModifier[] = [
  { id: 'mod_one_word', title: 'One-Word Only', rule: 'Every player may only say one word on their turn. No explanations.', icon: 'Sparkles' },
  { id: 'mod_metaphor', title: 'Creative Clue', rule: 'Give a creative clue without saying the secret word.', icon: 'Feather' },
  { id: 'mod_opposite', title: 'Opposite Clue', rule: 'Name something your secret word is definitely not.', icon: 'Repeat' },
  { id: 'mod_sensory', title: 'Use Your Senses', rule: 'Describe how the word smells, sounds, feels, or tastes.', icon: 'Flame' },
  { id: 'mod_rapid', title: 'Speed Clue', rule: 'Each player has only four seconds to give a clue.', icon: 'Timer' }
];

export const INTERROGATION_QUESTIONS = [
  'Would this be cheap or expensive?',
  'Where would you normally find this?',
  'Could you hold it with one hand?',
  'What color or texture comes to mind?',
  'Can it move on its own?',
  'Would people notice if it disappeared?',
  'Does it make a sound when used?'
];
