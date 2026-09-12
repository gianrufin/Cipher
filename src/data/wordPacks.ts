import { WordCategory, RoundModifier } from '../types';

// Difficulty describes how similar the two words are, never how obscure they are.
// Every built-in word should be understandable without explaining vocabulary first.
export const BUILT_IN_CATEGORIES: WordCategory[] = [
  {
    id: 'pinoy_everyday', name: 'Pinoy Everyday', iconName: 'Sun',
    description: 'Food, places, celebrations, and daily life familiar to Filipino groups.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Mango', wordB: 'Banana', hint: 'Fruits', difficulty: 'easy' },
      { wordA: 'Jeepney', wordB: 'Bus', hint: 'Public transport', difficulty: 'easy' },
      { wordA: 'Rice', wordB: 'Bread', hint: 'Everyday food', difficulty: 'easy' },
      { wordA: 'Beach', wordB: 'Swimming Pool', hint: 'Places to swim', difficulty: 'easy' },
      { wordA: 'School', wordB: 'Mall', hint: 'Familiar places', difficulty: 'easy' },
      { wordA: 'Adobo', wordB: 'Sinigang', hint: 'Filipino dishes', difficulty: 'standard' },
      { wordA: 'Tricycle', wordB: 'Jeepney', hint: 'Local transport', difficulty: 'standard' },
      { wordA: 'Palengke', wordB: 'Sari-sari Store', hint: 'Places to shop', difficulty: 'standard' },
      { wordA: 'Fiesta', wordB: 'Christmas', hint: 'Celebrations', difficulty: 'standard' },
      { wordA: 'Karaoke', wordB: 'Dance Party', hint: 'Group activities', difficulty: 'standard' },
      { wordA: 'Lumpia', wordB: 'Turon', hint: 'Rolled snacks', difficulty: 'tricky' },
      { wordA: 'Tocino', wordB: 'Longganisa', hint: 'Breakfast food', difficulty: 'tricky' },
      { wordA: 'Taho', wordB: 'Champorado', hint: 'Breakfast or merienda', difficulty: 'tricky' },
      { wordA: 'Puto', wordB: 'Bibingka', hint: 'Rice cakes', difficulty: 'tricky' },
      { wordA: 'Manila', wordB: 'Cebu', hint: 'Philippine cities', difficulty: 'tricky' }
    ]
  },
  {
    id: 'food_beverage', name: 'Food & Drinks', iconName: 'Utensils',
    description: 'Common meals, snacks, fruits, and drinks.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Pizza', wordB: 'Burger', hint: 'Fast food', difficulty: 'easy' },
      { wordA: 'Coffee', wordB: 'Tea', hint: 'Hot drinks', difficulty: 'easy' },
      { wordA: 'Cake', wordB: 'Ice Cream', hint: 'Desserts', difficulty: 'easy' },
      { wordA: 'Apple', wordB: 'Orange', hint: 'Fruits', difficulty: 'easy' },
      { wordA: 'Chicken', wordB: 'Fish', hint: 'Main dishes', difficulty: 'easy' },
      { wordA: 'Pancake', wordB: 'Waffle', hint: 'Breakfast food', difficulty: 'standard' },
      { wordA: 'French Fries', wordB: 'Potato Chips', hint: 'Potato snacks', difficulty: 'standard' },
      { wordA: 'Spaghetti', wordB: 'Noodles', hint: 'Long pasta', difficulty: 'standard' },
      { wordA: 'Ketchup', wordB: 'Mayonnaise', hint: 'Sauces', difficulty: 'standard' },
      { wordA: 'Milk', wordB: 'Juice', hint: 'Cold drinks', difficulty: 'standard' },
      { wordA: 'Cupcake', wordB: 'Muffin', hint: 'Small baked treats', difficulty: 'tricky' },
      { wordA: 'Soup', wordB: 'Stew', hint: 'Food served in a bowl', difficulty: 'tricky' },
      { wordA: 'Juice', wordB: 'Milkshake', hint: 'Sweet drinks', difficulty: 'tricky' },
      { wordA: 'Cookie', wordB: 'Biscuit', hint: 'Baked snacks', difficulty: 'tricky' },
      { wordA: 'Fried Chicken', wordB: 'Roast Chicken', hint: 'Chicken dishes', difficulty: 'tricky' }
    ]
  },
  {
    id: 'places_travel', name: 'Places & Travel', iconName: 'Compass',
    description: 'Places people visit at home, in town, or on vacation.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'School', wordB: 'Hospital', hint: 'Public places', difficulty: 'easy' },
      { wordA: 'Beach', wordB: 'Park', hint: 'Places to relax', difficulty: 'easy' },
      { wordA: 'Mall', wordB: 'Market', hint: 'Places to shop', difficulty: 'easy' },
      { wordA: 'House', wordB: 'Hotel', hint: 'Places to sleep', difficulty: 'easy' },
      { wordA: 'Mountain', wordB: 'Island', hint: 'Natural places', difficulty: 'easy' },
      { wordA: 'Hotel', wordB: 'Resort', hint: 'Vacation stays', difficulty: 'standard' },
      { wordA: 'Library', wordB: 'Bookstore', hint: 'Places with books', difficulty: 'standard' },
      { wordA: 'Airport', wordB: 'Bus Terminal', hint: 'Travel stations', difficulty: 'standard' },
      { wordA: 'Zoo', wordB: 'Aquarium', hint: 'Places with animals', difficulty: 'standard' },
      { wordA: 'Playground', wordB: 'Amusement Park', hint: 'Places for fun', difficulty: 'standard' },
      { wordA: 'Cafe', wordB: 'Restaurant', hint: 'Places to eat', difficulty: 'tricky' },
      { wordA: 'Beach', wordB: 'Island', hint: 'Places near the sea', difficulty: 'tricky' },
      { wordA: 'Bridge', wordB: 'Tunnel', hint: 'Ways across or through', difficulty: 'tricky' },
      { wordA: 'Farm', wordB: 'Garden', hint: 'Places where plants grow', difficulty: 'tricky' },
      { wordA: 'Clinic', wordB: 'Hospital', hint: 'Places for medical care', difficulty: 'tricky' }
    ]
  },
  {
    id: 'roles_heists', name: 'People & Jobs', iconName: 'ShieldAlert',
    description: 'Familiar jobs and characters from stories and daily life.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Doctor', wordB: 'Teacher', hint: 'Community jobs', difficulty: 'easy' },
      { wordA: 'Chef', wordB: 'Driver', hint: 'Common jobs', difficulty: 'easy' },
      { wordA: 'Police Officer', wordB: 'Firefighter', hint: 'Emergency workers', difficulty: 'easy' },
      { wordA: 'Singer', wordB: 'Dancer', hint: 'Performers', difficulty: 'easy' },
      { wordA: 'Farmer', wordB: 'Fisherman', hint: 'Food producers', difficulty: 'easy' },
      { wordA: 'Chef', wordB: 'Baker', hint: 'Kitchen jobs', difficulty: 'standard' },
      { wordA: 'Pilot', wordB: 'Driver', hint: 'People who operate vehicles', difficulty: 'standard' },
      { wordA: 'Actor', wordB: 'Singer', hint: 'Famous performers', difficulty: 'standard' },
      { wordA: 'Doctor', wordB: 'Nurse', hint: 'Medical workers', difficulty: 'standard' },
      { wordA: 'Spy', wordB: 'Detective', hint: 'People who find secrets', difficulty: 'standard' },
      { wordA: 'Teacher', wordB: 'Principal', hint: 'People at school', difficulty: 'tricky' },
      { wordA: 'Photographer', wordB: 'Cameraman', hint: 'People using cameras', difficulty: 'tricky' },
      { wordA: 'Guard', wordB: 'Police Officer', hint: 'People who protect', difficulty: 'tricky' },
      { wordA: 'Waiter', wordB: 'Chef', hint: 'Restaurant workers', difficulty: 'tricky' },
      { wordA: 'Coach', wordB: 'Referee', hint: 'People in sports', difficulty: 'tricky' }
    ]
  },
  {
    id: 'objects_tech', name: 'Things & Gadgets', iconName: 'Smartphone',
    description: 'Everyday objects, home items, and simple technology.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Phone', wordB: 'Laptop', hint: 'Gadgets', difficulty: 'easy' },
      { wordA: 'Spoon', wordB: 'Fork', hint: 'Eating tools', difficulty: 'easy' },
      { wordA: 'Chair', wordB: 'Table', hint: 'Furniture', difficulty: 'easy' },
      { wordA: 'Shoes', wordB: 'Slippers', hint: 'Footwear', difficulty: 'easy' },
      { wordA: 'Pencil', wordB: 'Pen', hint: 'Writing tools', difficulty: 'easy' },
      { wordA: 'Television', wordB: 'Computer', hint: 'Screens', difficulty: 'standard' },
      { wordA: 'Backpack', wordB: 'Suitcase', hint: 'Bags', difficulty: 'standard' },
      { wordA: 'Umbrella', wordB: 'Raincoat', hint: 'Rain protection', difficulty: 'standard' },
      { wordA: 'Clock', wordB: 'Watch', hint: 'Things that tell time', difficulty: 'standard' },
      { wordA: 'Flashlight', wordB: 'Candle', hint: 'Sources of light', difficulty: 'standard' },
      { wordA: 'Headphones', wordB: 'Earphones', hint: 'Personal audio', difficulty: 'tricky' },
      { wordA: 'Door', wordB: 'Window', hint: 'Parts of a room', difficulty: 'tricky' },
      { wordA: 'Blanket', wordB: 'Towel', hint: 'Large pieces of cloth', difficulty: 'tricky' },
      { wordA: 'Cup', wordB: 'Glass', hint: 'Drink containers', difficulty: 'tricky' },
      { wordA: 'Fan', wordB: 'Air Conditioner', hint: 'Things that cool a room', difficulty: 'tricky' }
    ]
  },
  {
    id: 'creatures_nature', name: 'Animals & Nature', iconName: 'PawPrint',
    description: 'Common animals, weather, plants, and outdoor things.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Dog', wordB: 'Cat', hint: 'Pets', difficulty: 'easy' },
      { wordA: 'Bird', wordB: 'Fish', hint: 'Animals', difficulty: 'easy' },
      { wordA: 'Sun', wordB: 'Moon', hint: 'Things in the sky', difficulty: 'easy' },
      { wordA: 'Tree', wordB: 'Flower', hint: 'Plants', difficulty: 'easy' },
      { wordA: 'Rain', wordB: 'Wind', hint: 'Weather', difficulty: 'easy' },
      { wordA: 'Lion', wordB: 'Tiger', hint: 'Big cats', difficulty: 'standard' },
      { wordA: 'Frog', wordB: 'Lizard', hint: 'Small animals', difficulty: 'standard' },
      { wordA: 'River', wordB: 'Ocean', hint: 'Bodies of water', difficulty: 'standard' },
      { wordA: 'Horse', wordB: 'Cow', hint: 'Farm animals', difficulty: 'standard' },
      { wordA: 'Butterfly', wordB: 'Bee', hint: 'Flying insects', difficulty: 'standard' },
      { wordA: 'Duck', wordB: 'Chicken', hint: 'Farm birds', difficulty: 'tricky' },
      { wordA: 'Shark', wordB: 'Dolphin', hint: 'Sea animals', difficulty: 'tricky' },
      { wordA: 'Cloud', wordB: 'Fog', hint: 'Water in the air', difficulty: 'tricky' },
      { wordA: 'Forest', wordB: 'Jungle', hint: 'Places with many trees', difficulty: 'tricky' },
      { wordA: 'Rock', wordB: 'Shell', hint: 'Things found outdoors', difficulty: 'tricky' }
    ]
  },
  {
    id: 'popculture_entertainment', name: 'Shows & Games', iconName: 'Clapperboard',
    description: 'Common entertainment, characters, and ways to have fun.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Movie', wordB: 'TV Show', hint: 'Things to watch', difficulty: 'easy' },
      { wordA: 'Superhero', wordB: 'Villain', hint: 'Story characters', difficulty: 'easy' },
      { wordA: 'Cartoon', wordB: 'Anime', hint: 'Animated shows', difficulty: 'easy' },
      { wordA: 'Video Game', wordB: 'Board Game', hint: 'Games', difficulty: 'easy' },
      { wordA: 'YouTube', wordB: 'TikTok', hint: 'Video apps', difficulty: 'easy' },
      { wordA: 'Batman', wordB: 'Superman', hint: 'Superheroes', difficulty: 'standard' },
      { wordA: 'Mario', wordB: 'Sonic', hint: 'Video game characters', difficulty: 'standard' },
      { wordA: 'Movie Theater', wordB: 'Concert', hint: 'Places for entertainment', difficulty: 'standard' },
      { wordA: 'Comedy', wordB: 'Horror', hint: 'Movie types', difficulty: 'standard' },
      { wordA: 'Book', wordB: 'Comic Book', hint: 'Things to read', difficulty: 'standard' },
      { wordA: 'Hero', wordB: 'Main Character', hint: 'Important characters', difficulty: 'tricky' },
      { wordA: 'Sequel', wordB: 'Remake', hint: 'New versions of stories', difficulty: 'tricky' },
      { wordA: 'Contest', wordB: 'Game Show', hint: 'Competitive entertainment', difficulty: 'tricky' },
      { wordA: 'Magic', wordB: 'Superpower', hint: 'Special abilities', difficulty: 'tricky' },
      { wordA: 'Song', wordB: 'Music Video', hint: 'Music entertainment', difficulty: 'tricky' }
    ]
  },
  {
    id: 'sports_hobbies', name: 'Sports & Hobbies', iconName: 'Trophy',
    description: 'Popular sports and activities people do for fun.',
    audiences: ['family', 'barkada', 'mixed'],
    pairs: [
      { wordA: 'Basketball', wordB: 'Volleyball', hint: 'Ball sports', difficulty: 'easy' },
      { wordA: 'Running', wordB: 'Swimming', hint: 'Exercise', difficulty: 'easy' },
      { wordA: 'Singing', wordB: 'Dancing', hint: 'Performance hobbies', difficulty: 'easy' },
      { wordA: 'Drawing', wordB: 'Painting', hint: 'Art hobbies', difficulty: 'easy' },
      { wordA: 'Reading', wordB: 'Watching TV', hint: 'Quiet activities', difficulty: 'easy' },
      { wordA: 'Basketball', wordB: 'Football', hint: 'Team sports', difficulty: 'standard' },
      { wordA: 'Badminton', wordB: 'Tennis', hint: 'Racket sports', difficulty: 'standard' },
      { wordA: 'Camping', wordB: 'Hiking', hint: 'Outdoor activities', difficulty: 'standard' },
      { wordA: 'Cycling', wordB: 'Running', hint: 'Road exercise', difficulty: 'standard' },
      { wordA: 'Cooking', wordB: 'Baking', hint: 'Kitchen hobbies', difficulty: 'standard' },
      { wordA: 'Soccer', wordB: 'Football', hint: 'Goal sports', difficulty: 'tricky' },
      { wordA: 'Jogging', wordB: 'Running', hint: 'Moving on foot', difficulty: 'tricky' },
      { wordA: 'Dancing', wordB: 'Exercise', hint: 'Moving your body', difficulty: 'tricky' },
      { wordA: 'Chess', wordB: 'Checkers', hint: 'Board games', difficulty: 'tricky' },
      { wordA: 'Fishing', wordB: 'Swimming', hint: 'Water activities', difficulty: 'tricky' }
    ]
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
