import { WordCategory, WordDifficulty, WordPair } from '../types';

const pairs = (difficulty: WordDifficulty, rows: Array<[string,string,string]>): WordPair[] => rows.map(([wordA,wordB,hint])=>({wordA,wordB,hint,difficulty}));

export const DAILY_VAULT_CATEGORY: WordCategory = {
  id:'daily_vault', name:'Daily Vault', iconName:'CalendarDays',
  description:'A broad reserve of familiar pairs for long-running Crew game nights.',
  audiences:['family','barkada','mixed'],
  pairs:[
    ...pairs('easy',[
      ['Breakfast','Dinner','Meals'],['Chocolate','Vanilla','Flavors'],['Hotdog','Sandwich','Handheld food'],['Water','Soda','Drinks'],['Salt','Sugar','Kitchen staples'],
      ['Onion','Garlic','Cooking ingredients'],['Carrot','Potato','Vegetables'],['Donut','Brownie','Sweet treats'],['Cereal','Oatmeal','Breakfast bowls'],['Honey','Jam','Sweet spreads'],
      ['Train','Airplane','Transport'],['Bicycle','Motorcycle','Two-wheel vehicles'],['Taxi','Ambulance','Road vehicles'],['Boat','Helicopter','Ways to travel'],['Road','Railway','Travel paths'],
      ['Cinema','Museum','Places to visit'],['Church','City Hall','Community buildings'],['Bedroom','Kitchen','Rooms'],['Balcony','Backyard','Parts of a home'],['Elevator','Escalator','Ways between floors'],
      ['Pillow','Mattress','Bedroom items'],['Mirror','Picture Frame','Wall items'],['Soap','Shampoo','Bathroom items'],['Plate','Bowl','Tableware'],['Refrigerator','Oven','Kitchen appliances'],
      ['Mouse','Keyboard','Computer tools'],['Camera','Speaker','Electronics'],['Charger','Battery','Sources of power'],['Website','Mobile App','Digital products'],['Text Message','Phone Call','Communication'],
      ['Rabbit','Hamster','Small pets'],['Elephant','Giraffe','Large animals'],['Ant','Spider','Tiny creatures'],['Whale','Octopus','Sea creatures'],['Eagle','Owl','Birds'],
      ['Rose','Sunflower','Flowers'],['Grass','Moss','Green ground cover'],['Thunder','Lightning','Storm'],['Snow','Hail','Frozen weather'],['Desert','Waterfall','Natural places'],
      ['Baseball','Golf','Ball sports'],['Boxing','Wrestling','Combat sports'],['Surfing','Skating','Board sports'],['Yoga','Weightlifting','Exercise'],['Photography','Gardening','Hobbies'],
      ['Guitar','Piano','Instruments'],['Drums','Violin','Musical instruments'],['Podcast','Radio','Audio shows'],['Novel','Magazine','Reading material'],['Puzzle','Quiz','Brain games'],
      ['King','Queen','Royalty'],['Pirate','Cowboy','Story characters'],['Robot','Alien','Science fiction'],['Wizard','Knight','Fantasy characters'],['Ghost','Monster','Scary characters'],
      ['Wedding','Birthday','Celebrations'],['Vacation','Weekend','Time off'],['Morning','Midnight','Times of day'],['Summer','Winter','Seasons'],['Monday','Friday','Weekdays'],
      ['Baby','Grandparent','Family ages'],['Friend','Neighbor','People nearby'],['Student','Employee','Everyday roles'],['Customer','Seller','Shopping roles'],['Tourist','Guide','Travel roles'],
      ['Laughing','Crying','Emotional reactions'],['Whispering','Shouting','Ways of speaking'],['Sleeping','Dreaming','Rest'],['Walking','Driving','Movement'],['Cleaning','Cooking','Household tasks'],
      ['Circle','Square','Shapes'],['Gold','Silver','Metals'],['Paper','Plastic','Materials'],['Fire','Ice','Opposites'],['Light','Shadow','Visibility'],
      ['Big','Small','Size'],['Fast','Slow','Speed'],['Soft','Hard','Texture'],['Old','New','Age'],['Lucky','Unlucky','Chance'],
      ['Barangay','Subdivision','Neighborhoods'],['Bangka','Ferry','Water transport'],['Halo-halo','Fruit Salad','Cold desserts'],['Calamansi','Lemon','Citrus'],['Pandesal','Ensaymada','Bakery food'],
      ['Boodle Fight','Buffet','Shared meals'],['Basketball Court','Covered Court','Community venues'],['Videoke','Concert','Singing events'],['Pasalubong','Souvenir','Travel gifts'],['Payong','Kapote','Rain gear'],
      ['ATM','Cashier','Money stops'],['Coin','Paper Bill','Money'],['Receipt','Ticket','Printed slips'],['Wallet','Coin Purse','Money holders'],['Gift','Prize','Things received'],
      ['Clockwise','Counterclockwise','Directions'],['Entrance','Exit','Doorways'],['Question','Answer','Conversation'],['Secret','Rumor','Hidden information'],['Clue','Evidence','Things that reveal']
    ]),
    ...pairs('standard',[
      ['Espresso','Americano','Coffee drinks'],['Sundae','Milkshake','Cold sweets'],['Nachos','Popcorn','Movie snacks'],['Sushi','Dumpling','Bite-sized food'],['Gravy','Soup','Savory liquids'],
      ['Dormitory','Hostel','Shared lodging'],['Port','Airport','Travel gateways'],['Alley','Hallway','Narrow passages'],['Stadium','Arena','Event venues'],['Bakery','Cafe','Food shops'],
      ['Tablet','E-reader','Portable screens'],['Microphone','Megaphone','Voice tools'],['Password','PIN','Access codes'],['Folder','Envelope','Things that hold documents'],['Calendar','Planner','Scheduling tools'],
      ['Crocodile','Alligator','Large reptiles'],['Goat','Sheep','Farm animals'],['Crow','Raven','Dark birds'],['Turtle','Snail','Slow animals'],['Cactus','Aloe Vera','Succulents'],
      ['Volcano','Geyser','Earth eruptions'],['Lake','Lagoon','Still water'],['Cave','Mine','Underground places'],['Sunrise','Sunset','Sky events'],['Breeze','Draft','Moving air'],
      ['Sprint','Marathon','Running races'],['Bowling','Billiards','Precision games'],['Kayaking','Rafting','River activities'],['Karaoke','Open Mic','Public performance'],['Sketching','Doodling','Quick drawing']
    ]),
    ...pairs('tricky',[
      ['Cup','Mug','Drink containers'],['Curtain','Blinds','Window covers'],['Stairs','Ladder','Ways to climb'],['Cabinet','Drawer','Storage furniture'],['Porch','Patio','Outdoor home areas'],
      ['Stream','Creek','Small waterways'],['Hill','Dune','Raised land'],['Mist','Steam','Water in air'],['Twig','Branch','Parts of a tree'],['Pebble','Gravel','Small stones'],
      ['Receipt','Invoice','Purchase records'],['Coupon','Voucher','Discount documents'],['Password','Passcode','Digital secrets'],['Screenshot','Photograph','Captured images'],['Notification','Alarm','Attention signals'],
      ['Joke','Prank','Playful tricks'],['Debate','Argument','Disagreement'],['Hint','Clue','Helpful information'],['Promise','Oath','Commitments'],['Guess','Prediction','Uncertain answers']
    ])
  ]
};
