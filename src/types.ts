export interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  distance: number; // in miles
  rating: number;
  reviewCount: number;
  imageUrl: string;
  coords: { x: number; y: number }; // Relative percentage coordinates for custom SVG Map
  busyStatus: 'low' | 'medium' | 'high';
  waitTimeMinutes: number;
  hours: string;
  phone: string;
}

export type Category = 'espresso' | 'iced_cold' | 'tea_matcha' | 'bakery';

export interface CustomizationOptions {
  sizes: string[];
  milks: string[];
  sweeteners: string[];
  shotsRange: number[]; // e.g., [1, 2, 3, 4]
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  tags: string[];
  customizable: boolean;
  defaults: DrinkCustomization;
}

export interface DrinkCustomization {
  size: 'Short' | 'Tall' | 'Grande' | 'Venti' | 'None'; // None for bakeries
  milk: 'Whole Milk' | 'Oat Milk' | 'Almond Milk' | 'Coconut Milk' | 'No Milk' | 'None';
  sweetener: 'None' | 'Sugar Raw' | 'Simple Syrup' | 'Vanilla Syrup' | 'Caramel Syrup' | 'Hazelnut Syrup';
  sweetenerPumps: number;
  shots: number;
  extraHot?: boolean;
  extraIce?: boolean;
  whippedCream?: boolean;
  specialInstructions?: string;
}

export interface CartItem {
  cartId: string;
  menuItem: MenuItem;
  customization: DrinkCustomization;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'received' | 'brewing' | 'ready' | 'picked_up';

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: OrderStatus;
  pickupTime: string; // "ASAP" or "In 15 mins" etc.
  pickupCode: string; // e.g. "COFFEE-482"
  orderDate: string;
  active: boolean;
  userId?: string;
}
