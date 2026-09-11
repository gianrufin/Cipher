import { WordCategory, RoundModifier } from '../types';

export const BUILT_IN_CATEGORIES: WordCategory[] = [
  {
    id: 'food_beverage',
    name: 'Food & Flavors',
    iconName: 'Utensils',
    description: 'Delectable dishes, snacks, and daily cravings.',
    pairs: [
      { wordA: 'Espresso', wordB: 'Americano', hint: 'Coffee drinks' },
      { wordA: 'Pizza', wordB: 'Calzone', hint: 'Baked Italian dough' },
      { wordA: 'Pancake', wordB: 'Waffle', hint: 'Breakfast batter treats' },
      { wordA: 'Sushi', wordB: 'Sashimi', hint: 'Japanese seafood' },
      { wordA: 'Chocolate', wordB: 'Caramel', hint: 'Sweet confectionery' },
      { wordA: 'Taco', wordB: 'Burrito', hint: 'Mexican favorites' },
      { wordA: 'Smoothie', wordB: 'Milkshake', hint: 'Blended cold drinks' },
      { wordA: 'French Fries', wordB: 'Onion Rings', hint: 'Crispy deep-fried sides' },
      { wordA: 'Croissant', wordB: 'Bagel', hint: 'Morning bakery items' },
      { wordA: 'Soup', wordB: 'Stew', hint: 'Warm savory bowls' },
      { wordA: 'Ketchup', wordB: 'Mustard', hint: 'Classic table condiments' }
    ]
  },
  {
    id: 'places_travel',
    name: 'Travel & Locations',
    iconName: 'Compass',
    description: 'Destinations, transport, and landmarks.',
    pairs: [
      { wordA: 'Subway', wordB: 'Train', hint: 'Rail passenger transport' },
      { wordA: 'Airport', wordB: 'Train Station', hint: 'Transit hubs' },
      { wordA: 'Hotel', wordB: 'Resort', hint: 'Vacation accommodations' },
      { wordA: 'Beach', wordB: 'Lakeside', hint: 'Waterfront recreation' },
      { wordA: 'Cinema', wordB: 'Theater', hint: 'Venues with stages and screens' },
      { wordA: 'Castle', wordB: 'Palace', hint: 'Historic royal dwellings' },
      { wordA: 'Museum', wordB: 'Art Gallery', hint: 'Cultural exhibitions' },
      { wordA: 'Cruise Ship', wordB: 'Yacht', hint: 'Ocean vessels' },
      { wordA: 'Desert', wordB: 'Canyon', hint: 'Arid landscapes' },
      { wordA: 'Library', wordB: 'Bookstore', hint: 'Rooms full of literature' }
    ]
  },
  {
    id: 'roles_heists',
    name: 'Roles & Professions',
    iconName: 'ShieldAlert',
    description: 'Occupations, secret agents, and thrilling personas.',
    pairs: [
      { wordA: 'Spy', wordB: 'Detective', hint: 'Covert investigators' },
      { wordA: 'Doctor', wordB: 'Surgeon', hint: 'Medical practitioners' },
      { wordA: 'Pilot', wordB: 'Astronaut', hint: 'Cockpit navigators' },
      { wordA: 'Chef', wordB: 'Baker', hint: 'Culinary masters' },
      { wordA: 'Magician', wordB: 'Hypnotist', hint: 'Stage illusionists' },
      { wordA: 'Firefighter', wordB: 'Paramedic', hint: 'Emergency first responders' },
      { wordA: 'Bank Robber', wordB: 'Art Thief', hint: 'High-stakes criminals' },
      { wordA: 'Judge', wordB: 'Lawyer', hint: 'Courtroom figures' },
      { wordA: 'DJ', wordB: 'Music Producer', hint: 'Audio creators' },
      { wordA: 'Architect', wordB: 'Interior Designer', hint: 'Spatial planners' }
    ]
  },
  {
    id: 'objects_tech',
    name: 'Everyday & Tech',
    iconName: 'Smartphone',
    description: 'Gadgets, household objects, and modern tools.',
    pairs: [
      { wordA: 'Mirror', wordB: 'Window', hint: 'Reflective and clear glass' },
      { wordA: 'Microwave', wordB: 'Toaster Oven', hint: 'Quick heat appliances' },
      { wordA: 'Guitar', wordB: 'Violin', hint: 'Wooden string instruments' },
      { wordA: 'Headphones', wordB: 'Earbuds', hint: 'Personal audio gear' },
      { wordA: 'Flashlight', wordB: 'Lantern', hint: 'Portable illumination' },
      { wordA: 'Watch', wordB: 'Clock', hint: 'Timekeeping instruments' },
      { wordA: 'Umbrella', wordB: 'Raincoat', hint: 'Storm protection' },
      { wordA: 'Tablet', wordB: 'Laptop', hint: 'Portable screens' },
      { wordA: 'Candle', wordB: 'Campfire', hint: 'Gentle flames' },
      { wordA: 'Painting', wordB: 'Photograph', hint: 'Framed visual artwork' }
    ]
  },
  {
    id: 'creatures_nature',
    name: 'Creatures & Nature',
    iconName: 'PawPrint',
    description: 'Wild animals, natural phenomena, and beasts.',
    pairs: [
      { wordA: 'Lion', wordB: 'Tiger', hint: 'Apex big cats' },
      { wordA: 'Dolphin', wordB: 'Whale', hint: 'Marine mammals' },
      { wordA: 'Vampire', wordB: 'Zombie', hint: 'Classic undead legends' },
      { wordA: 'Dragon', wordB: 'Dinosaur', hint: 'Giant reptilian legends' },
      { wordA: 'Tornado', wordB: 'Hurricane', hint: 'Fierce wind storms' },
      { wordA: 'Snow', wordB: 'Ice', hint: 'Frozen water' },
      { wordA: 'Bee', wordB: 'Wasp', hint: 'Flying striped insects' },
      { wordA: 'Owl', wordB: 'Bat', hint: 'Nocturnal flyers' },
      { wordA: 'Volcano', wordB: 'Earthquake', hint: 'Geological eruptions' },
      { wordA: 'Moon', wordB: 'Sun', hint: 'Celestial bodies' }
    ]
  },
  {
    id: 'popculture_fun',
    name: 'Party & Pop Culture',
    iconName: 'PartyPopper',
    description: 'Games, entertainment, and social thrills.',
    pairs: [
      { wordA: 'Karaoke', wordB: 'Concert', hint: 'Singing events' },
      { wordA: 'Rollercoaster', wordB: 'Ferris Wheel', hint: 'Amusement park rides' },
      { wordA: 'Board Game', wordB: 'Card Game', hint: 'Tabletop play' },
      { wordA: 'Superhero', wordB: 'Supervillain', hint: 'Comic book legends' },
      { wordA: 'Fireworks', wordB: 'Bonfire', hint: 'Night sky celebrations' },
      { wordA: 'Escape Room', wordB: 'Haunted House', hint: 'Immersive group rooms' },
      { wordA: 'Trivia Night', wordB: 'Spelling Bee', hint: 'Competitive knowledge games' },
      { wordA: 'Comic Book', wordB: 'Manga', hint: 'Illustrated storylines' }
    ]
  }
];

export const ROUND_MODIFIERS: RoundModifier[] = [
  {
    id: 'mod_one_word',
    title: 'One-Word Only',
    rule: 'Every player may ONLY speak a single word on their turn. No explanations!',
    icon: 'Sparkles'
  },
  {
    id: 'mod_metaphor',
    title: 'Poetic Metaphor',
    rule: 'Your clue must sound like a riddle or poetic metaphor without stating physical traits.',
    icon: 'Feather'
  },
  {
    id: 'mod_opposite',
    title: 'Opposite Vibe',
    rule: 'Name something that is the direct opposite or what your word is definitely NOT.',
    icon: 'Repeat'
  },
  {
    id: 'mod_sensory',
    title: 'Sensory Detail',
    rule: 'Describe how your word smells, sounds, feels, or tastes (avoid sight/color!).',
    icon: 'Flame'
  },
  {
    id: 'mod_rapid',
    title: 'Speed Clue',
    rule: 'Each player has only 4 seconds to give their clue or forfeit their turn!',
    icon: 'Timer'
  }
];

export const INTERROGATION_QUESTIONS = [
  "If you had to pay for this, would it cost less than $20 or more than $20?",
  "Where in a typical house or city would you expect to find this?",
  "How heavy is your word? Could you hold it with one hand?",
  "What is the first color or texture that pops into your head?",
  "Can this thing move on its own, or does it require someone else?",
  "If this disappeared tomorrow, would civilization notice immediately?",
  "Does your word make a distinct sound when in use?"
];
