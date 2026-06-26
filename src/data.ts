import { Shop, MenuItem } from './types';

export const SHOPS: Shop[] = [
  {
    id: 'rustic-grind',
    name: 'The Rustic Grind',
    description: 'A cozy sanctuary for serious coffee purists. Specializing in single-origin hand-poured coffees, custom light roasts, and buttery wood-fired pastries.',
    address: '428 Timberline Dr, Downtown',
    distance: 0.4,
    rating: 4.8,
    reviewCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
    coords: { x: 35, y: 40 },
    busyStatus: 'medium',
    waitTimeMinutes: 7,
    hours: '6:30 AM - 4:00 PM',
    phone: '(555) 234-5678'
  },
  {
    id: 'neon-wave',
    name: 'Neon Wave Espresso',
    description: 'Vibrant, fast-paced modern coffee lab. Known for high-energy synth music, state-of-the-art cold brew draft taps, and creative fusion lattes.',
    address: '109 Cyber Plaza, Tech District',
    distance: 1.2,
    rating: 4.6,
    reviewCount: 184,
    imageUrl: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=600',
    coords: { x: 70, y: 25 },
    busyStatus: 'low',
    waitTimeMinutes: 4,
    hours: '7:00 AM - 8:00 PM',
    phone: '(555) 876-5432'
  },
  {
    id: 'velvet-cup',
    name: 'The Velvet Cup Lounge',
    description: 'A botanical haven. Elegant pastel palettes, velvet seating, and beautifully decorated lattes with organic flower petals and lavender notes.',
    address: '89 Rosewood Ave, Garden District',
    distance: 2.1,
    rating: 4.9,
    reviewCount: 425,
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600',
    coords: { x: 20, y: 75 },
    busyStatus: 'high',
    waitTimeMinutes: 12,
    hours: '8:00 AM - 6:00 PM',
    phone: '(555) 456-7890'
  }
];

export const MENU_ITEMS: MenuItem[] = [
  // --- ESPRESSO & HOT ---
  {
    id: 'pour-over',
    name: 'Single-Origin Pour Over',
    description: 'Slow-dripped Ethiopian Yirgacheffe with bright notes of jasmine, lemon blossom, and black tea.',
    price: 4.75,
    category: 'espresso',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
    tags: ['Artisanal', 'Light Roast', 'Organic'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'No Milk',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 1,
      extraHot: false
    }
  },
  {
    id: 'flat-white',
    name: 'Artisan Flat White',
    description: 'Two ristretto espresso shots blended perfectly under a velvety thin layer of microfoamed milk.',
    price: 4.50,
    category: 'espresso',
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=400',
    tags: ['Classic', 'Rich'],
    customizable: true,
    defaults: {
      size: 'Tall',
      milk: 'Whole Milk',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 2,
      extraHot: false
    }
  },
  {
    id: 'lavender-latte',
    name: 'Velvet Lavender Honey Latte',
    description: 'Espresso combined with wild organic lavender essence and raw local honey syrup, topped with edible flower dust.',
    price: 5.75,
    category: 'espresso',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    tags: ['Sweet', 'Floral', 'Signature'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'Oat Milk',
      sweetener: 'Simple Syrup',
      sweetenerPumps: 2,
      shots: 2,
      extraHot: false
    }
  },
  {
    id: 'charcoal-mocha',
    name: 'Activated Charcoal Mocha',
    description: 'Rich dark espresso blended with food-grade black active charcoal and velvety sweet Dutch cocoa powder.',
    price: 5.50,
    category: 'espresso',
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=400',
    tags: ['Signature', 'Decadent'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'Whole Milk',
      sweetener: 'Vanilla Syrup',
      sweetenerPumps: 2,
      shots: 2,
      extraHot: false
    }
  },

  // --- ICED & COLD ---
  {
    id: 'sea-salt-coldbrew',
    name: 'Sea Salt Caramel Cold Brew',
    description: 'Slow-steeped 24-hour house cold brew topped with a rich, velvety pink Himalayan sea salt cold foam.',
    price: 5.25,
    category: 'iced_cold',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400',
    tags: ['Cold Foam', 'Iced', 'Sweet'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'None',
      sweetener: 'Caramel Syrup',
      sweetenerPumps: 2,
      shots: 0,
      extraIce: false
    }
  },
  {
    id: 'neon-matcha',
    name: 'Nitro Matcha Cold Brew Tonic',
    description: 'Chilled nitrogenated green tea layered cleanly over bitter-sweet tonic water and a splash of lime juice.',
    price: 5.95,
    category: 'iced_cold',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    tags: ['Refreshing', 'Iced', 'Vegan'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'No Milk',
      sweetener: 'Simple Syrup',
      sweetenerPumps: 1,
      shots: 0,
      extraIce: false
    }
  },
  {
    id: 'iced-oat-latte',
    name: 'Iced Vanilla Bean Oat Latte',
    description: 'Espresso poured over creamy organic barista-edition oat milk, cold-brewed Madagascar vanilla bean pod infusion, and ice cubes.',
    price: 5.50,
    category: 'iced_cold',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400',
    tags: ['Classic', 'Iced', 'Vegan'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'Oat Milk',
      sweetener: 'Vanilla Syrup',
      sweetenerPumps: 2,
      shots: 2,
      extraIce: false
    }
  },

  // --- TEA & MATCHA ---
  {
    id: 'chai-latte',
    name: 'Masala Spiced Chai Latte',
    description: 'A fiery, warming blend of stone-ground black tea spices, organic honey, and your choice of warm milk.',
    price: 4.95,
    category: 'tea_matcha',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
    tags: ['Spiced', 'Warming'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'Whole Milk',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 0,
      extraHot: false
    }
  },
  {
    id: 'matcha-latte',
    name: 'Ceremonial Matcha Latte',
    description: 'Stone-ground green tea leaves from Uji, Japan, whisked traditionally and poured with light velvety milk.',
    price: 5.50,
    category: 'tea_matcha',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    tags: ['Organic', 'Antioxidant', 'Japanese'],
    customizable: true,
    defaults: {
      size: 'Grande',
      milk: 'Oat Milk',
      sweetener: 'Simple Syrup',
      sweetenerPumps: 1,
      shots: 0,
      extraHot: false
    }
  },

  // --- BAKERY ---
  {
    id: 'croissant',
    name: 'Flaky Almond Butter Croissant',
    description: 'Hand-rolled, triple-layered French croissant filled with house-made honey almond butter and dusted with toasted almond flakes.',
    price: 3.95,
    category: 'bakery',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400',
    tags: ['Buttery', 'Contains Nuts'],
    customizable: false,
    defaults: {
      size: 'None',
      milk: 'None',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 0
    }
  },
  {
    id: 'cardamom-bun',
    name: 'Gluten-Free Cardamom Swedish Bun',
    description: 'Soft, aromatic braided cardamon dough sprinkled with organic Swedish pearl sugar. Baked fresh hourly.',
    price: 4.25,
    category: 'bakery',
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=400',
    tags: ['Gluten-Free', 'Baked Fresh'],
    customizable: false,
    defaults: {
      size: 'None',
      milk: 'None',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 0
    }
  },
  {
    id: 'vegan-cruffin',
    name: 'Cinnamon Swirl Cruffin',
    description: 'The ultimate muffin-croissant hybrid, swirled with organic Saigon cinnamon, dark cane sugar, and a hints of orange zest.',
    price: 4.50,
    category: 'bakery',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    tags: ['Vegan', 'House Favorite'],
    customizable: false,
    defaults: {
      size: 'None',
      milk: 'None',
      sweetener: 'None',
      sweetenerPumps: 0,
      shots: 0
    }
  }
];
