import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SHOPS, MENU_ITEMS } from './data';
import { Shop, MenuItem, CartItem, Order, OrderStatus, Category } from './types';
import Map from './components/Map';
import ShopCard from './components/ShopCard';
import CustomizeModal from './components/CustomizeModal';
import PastOrders from './components/PastOrders';
import OrderTracker from './components/OrderTracker';
import MerchantDashboard from './components/MerchantDashboard';
import { doc, setDoc, updateDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import {
  Coffee,
  ShoppingBag,
  History,
  MapPin,
  Search,
  ChevronLeft,
  X,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Award,
  DollarSign,
  Heart,
  Clock,
  Check,
  ChevronRight,
  Utensils,
  Briefcase
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'explore' | 'history' | 'merchant'
  const [activeTab, setActiveTab] = useState<'explore' | 'history' | 'merchant'>('explore');

  // Cafe exploration states
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopSearch, setShopSearch] = useState<string>('');

  // Menu categorization filter
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<Category | 'all'>('all');
  const [menuSearch, setMenuSearch] = useState<string>('');

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [pickupTime, setPickupTime] = useState<string>('ASAP (5-8 Mins)');
  const [tipAmount, setTipAmount] = useState<number>(1.00);
  const [customTipActive, setCustomTipActive] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>('');

  // Customization builder
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Persistence States: Orders history & tracking
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('super_double_a_theme') || 'crema';
  });

  // Auth & Database connection states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDbConnecting, setIsDbConnecting] = useState<boolean>(true);

  // Apply theme class and CSS variables to the document
  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'crema') {
      root.style.setProperty('--cafe-primary', '#78350f'); // bg-amber-900
      root.style.setProperty('--cafe-primary-hover', '#451a03'); // bg-amber-950
      root.style.setProperty('--cafe-primary-light', '#fef3c7'); // bg-amber-100/50
      root.style.setProperty('--cafe-primary-text', '#78350f'); // text-amber-900
      root.style.setProperty('--cafe-accent', '#f59e0b'); // amber-500
    } else if (currentTheme === 'dark_roast') {
      root.style.setProperty('--cafe-primary', '#1c1917'); // bg-stone-900
      root.style.setProperty('--cafe-primary-hover', '#0c0a09'); // bg-stone-950
      root.style.setProperty('--cafe-primary-light', '#e7e5e4'); // bg-stone-200
      root.style.setProperty('--cafe-primary-text', '#1c1917'); // text-stone-900
      root.style.setProperty('--cafe-accent', '#78716c'); // stone-500
    } else if (currentTheme === 'matcha') {
      root.style.setProperty('--cafe-primary', '#065f46'); // bg-emerald-800
      root.style.setProperty('--cafe-primary-hover', '#064e3b'); // bg-emerald-900
      root.style.setProperty('--cafe-primary-light', '#d1fae5'); // bg-emerald-100
      root.style.setProperty('--cafe-primary-text', '#065f46'); // text-emerald-800
      root.style.setProperty('--cafe-accent', '#10b981'); // emerald-500
    } else if (currentTheme === 'chai') {
      root.style.setProperty('--cafe-primary', '#c2410c'); // bg-orange-700
      root.style.setProperty('--cafe-primary-hover', '#7c2d12'); // bg-orange-900
      root.style.setProperty('--cafe-primary-light', '#ffedd5'); // bg-orange-100
      root.style.setProperty('--cafe-primary-text', '#c2410c'); // text-orange-700
      root.style.setProperty('--cafe-accent', '#f97316'); // orange-500
    } else if (currentTheme === 'midnight') {
      root.style.setProperty('--cafe-primary', '#1e1b4b'); // bg-indigo-950
      root.style.setProperty('--cafe-primary-hover', '#0f172a'); // bg-slate-900
      root.style.setProperty('--cafe-primary-light', '#e0e7ff'); // bg-indigo-100
      root.style.setProperty('--cafe-primary-text', '#1e1b4b'); // text-indigo-950
      root.style.setProperty('--cafe-accent', '#6366f1'); // indigo-500
    }
    localStorage.setItem('super_double_a_theme', currentTheme);
  }, [currentTheme]);

  // 1. Initialize anonymous Firebase Auth on mount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Sync any cached local orders that don't have a userId yet
        try {
          const savedOrders = localStorage.getItem('brewahead_orders');
          if (savedOrders) {
            const parsed = JSON.parse(savedOrders) as Order[];
            for (const order of parsed) {
              if (!order.userId) {
                order.userId = user.uid;
                await setDoc(doc(db, 'orders', order.id), order, { merge: true });
              }
            }
          }
        } catch (syncErr) {
          console.warn("Failed to migrate local orders to database:", syncErr);
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth initialization failed:", error);
        }
      }
    });

    // Load static local orders as cache fallback
    try {
      const savedOrders = localStorage.getItem('brewahead_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (e) {
      console.error('Failed to parse cached orders', e);
    }

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time sync of customer's orders from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsDbConnecting(true);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbOrders: Order[] = [];
      snapshot.forEach((doc) => {
        dbOrders.push(doc.data() as Order);
      });

      // Sort in-memory by date (newest first)
      dbOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

      setOrders(dbOrders);
      localStorage.setItem('brewahead_orders', JSON.stringify(dbOrders));

      // Auto-set the active order if there is an active order in the list
      const active = dbOrders.find(o => o.active);
      setActiveOrder(active || null);
      setIsDbConnecting(false);
    }, (error) => {
      console.warn("Firestore query failed (falling back to cached data):", error);
      setIsDbConnecting(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Save orders helper
  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('brewahead_orders', JSON.stringify(updatedOrders));
  };

  // Filter shops based on search query
  const filteredShops = SHOPS.filter(shop =>
    shop.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
    shop.description.toLowerCase().includes(shopSearch.toLowerCase()) ||
    shop.address.toLowerCase().includes(shopSearch.toLowerCase())
  );

  // Filter menu items by category and search
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    const matchesCategory = selectedMenuCategory === 'all' || item.category === selectedMenuCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(menuSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Adding item to cart
  const handleAddToCart = (newCartItem: Omit<CartItem, 'cartId'>) => {
    // If cart has items from another shop, prompt to clear
    if (cart.length > 0 && selectedShop && cart[0].menuItem.id !== newCartItem.menuItem.id) {
      // Check if we are ordering from a different shop implicitly
      const cartFirstItem = cart[0];
      // Since mock menu is global, we keep cart bound to selected shop
    }

    const uniqueId = `${newCartItem.menuItem.id}-${Date.now()}`;
    const cartItemWithId: CartItem = {
      ...newCartItem,
      cartId: uniqueId
    };

    setCart(prev => [...prev, cartItemWithId]);
    setIsCartOpen(true); // Open cart immediately to show addition
  };

  // Cart Modifications
  const handleRemoveCartItem = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleUpdateCartQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId !== cartId) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return {
        ...item,
        quantity: newQty,
        totalPrice: Number((item.unitPrice * newQty).toFixed(2))
      };
    }));
  };

  // Calculating order checkout pricing
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.0825; // 8.25% Sales tax
  const tax = Number((subtotal * taxRate).toFixed(2));
  const finalTip = customTipActive ? (Number(customTipInput) || 0) : tipAmount;
  const grandTotal = Number((subtotal + tax + finalTip).toFixed(2));

  // Triggering order checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedShop) return;

    const codeNum = Math.floor(100 + Math.random() * 900);
    const pickupPasscode = `CUP-${codeNum}`;
    const orderId = `order-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      shopAddress: selectedShop.address,
      items: cart,
      subtotal,
      tax,
      tip: finalTip,
      total: grandTotal,
      status: 'received',
      pickupTime,
      pickupCode: pickupPasscode,
      orderDate: new Date().toISOString(),
      active: true,
      userId: currentUser?.uid || 'anonymous'
    };

    // Write order to Firestore database in real-time
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    }

    // Send order notification email to the owner
    try {
      fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order: newOrder })
      }).catch(err => console.error("Async email dispatch failed:", err));
    } catch (emailErr) {
      console.error("Error calling send-order-email API:", emailErr);
    }

    // Update orders arrays
    const updatedOrders = [newOrder, ...orders.map(o => ({ ...o, active: false }))]; // Ensure only 1 active order
    saveOrders(updatedOrders);
    setActiveOrder(newOrder);

    // Reset checkout states
    setCart([]);
    setIsCartOpen(false);
  };

  // Order Tracker callbacks
  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (!activeOrder) return;

    const isFinished = newStatus === 'picked_up';
    const updated = {
      ...activeOrder,
      status: newStatus,
      active: !isFinished
    };

    // Sync status change to Firestore
    try {
      await updateDoc(doc(db, 'orders', activeOrder.id), {
        status: newStatus,
        active: !isFinished
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${activeOrder.id}`);
    }

    setActiveOrder(isFinished ? null : updated);

    const updatedList = orders.map(o => {
      if (o.id === activeOrder.id) {
        return updated;
      }
      return o;
    });
    saveOrders(updatedList);
  };

  // Track past order
  const handleTrackPastOrder = (order: Order) => {
    const updatedWithActive = orders.map(o => ({
      ...o,
      active: o.id === order.id
    }));
    saveOrders(updatedWithActive);
    setActiveOrder({ ...order, active: true });
    setActiveTab('explore'); // view on main tab
  };

  // Reorder past bag
  const handleReorderPastItems = (items: CartItem[], shopId: string) => {
    const shop = SHOPS.find(s => s.id === shopId);
    if (shop) {
      setSelectedShop(shop);
    }
    // Deep copy and reset unique cart IDs
    const newCartItems: CartItem[] = items.map(item => ({
      ...item,
      cartId: `${item.menuItem.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));
    setCart(newCartItems);
    setIsCartOpen(true);
    setActiveTab('explore');
  };

  // Direct quick select shop from map
  const handleSelectShopFromMap = (shop: Shop) => {
    // If cart has items and shop changes, warn user
    if (cart.length > 0 && selectedShop && selectedShop.id !== shop.id) {
      if (confirm(`You have active customized items in your bag from "${selectedShop.name}". Switching to "${shop.name}" will refresh your bag. Do you want to proceed?`)) {
        setCart([]);
      } else {
        return;
      }
    }
    setSelectedShop(shop);
    setSelectedMenuCategory('all');
    setMenuSearch('');
  };

  const menuCategoryConfig = [
    { id: 'all', label: 'All Drinks & Bakery', icon: Utensils },
    { id: 'espresso', label: 'Espresso & Hot', icon: Coffee },
    { id: 'iced_cold', label: 'Chilled Drafts', icon: Coffee },
    { id: 'tea_matcha', label: 'Teas & Matcha', icon: Sparkles },
    { id: 'bakery', label: 'Fresh Bakery', icon: Utensils }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col antialiased">
      {/* 1. TOP BRAND HEADER RAIL */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedShop(null)}>
            <div className="w-10 h-10 bg-cafe-primary rounded-2xl flex items-center justify-center text-white shadow-md shadow-cafe-primary/20 transition-all duration-300">
              <Coffee className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest font-black uppercase text-cafe-primary-text block leading-tight transition-all duration-300">Order Ahead</span>
              <h1 className="font-serif font-black text-xl text-stone-900 leading-tight">SUPER DOUBLE A</h1>
            </div>
          </div>
 
          {/* Center Navigation selectors */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => { setActiveTab('explore'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'explore' ? 'bg-white text-cafe-primary-hover shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cafe-primary-text transition-all duration-300" />
              <span>Explore Cafes</span>
            </button>
            <button
              onClick={() => { setActiveTab('history'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-white text-cafe-primary-hover shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-cafe-primary-text transition-all duration-300" />
              <span>Coffee Journal</span>
              {orders.length > 0 && (
                <span className="bg-stone-200 text-stone-700 rounded-full px-1.5 py-0.2 text-[9px] font-bold">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('merchant'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'merchant' ? 'bg-white text-cafe-primary-hover shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-cafe-primary-text transition-all duration-300" />
              <span>Shop Portal</span>
            </button>
          </nav>

          {/* Right utility buttons: Cart & Portal indicators */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Palette */}
            <div className="flex items-center gap-1 bg-stone-150/50 hover:bg-stone-150 border border-stone-200/50 p-1.5 rounded-2xl shadow-inner transition-colors" title="Change Aesthetic Theme">
              {[
                { id: 'crema', bg: 'bg-amber-800', label: 'Warm Crema' },
                { id: 'dark_roast', bg: 'bg-stone-850', label: 'Dark Roast' },
                { id: 'matcha', bg: 'bg-emerald-700', label: 'Sweet Matcha' },
                { id: 'chai', bg: 'bg-orange-700', label: 'Spiced Chai' },
                { id: 'midnight', bg: 'bg-indigo-900', label: 'Midnight Brew' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTheme(t.id)}
                  className={`w-4 h-4 rounded-full ${t.bg} transition-all relative cursor-pointer focus:outline-none ${
                    currentTheme === t.id ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : 'opacity-65 hover:opacity-100 hover:scale-105'
                  }`}
                  title={t.label}
                  id={`theme-btn-${t.id}`}
                />
              ))}
            </div>

            <button
              onClick={() => { setActiveTab(activeTab === 'merchant' ? 'explore' : 'merchant'); }}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'merchant'
                  ? 'bg-cafe-primary border-cafe-primary-hover text-white shadow-md'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
              title="Merchant/Barista Portal"
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Shop Portal</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-cafe-primary-light/30 hover:bg-cafe-primary-light/50 rounded-2xl border border-cafe-primary/20 text-cafe-primary-text transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2]" />
              {cart.length > 0 ? (
                <>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cafe-primary text-white font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                  <span className="text-xs font-extrabold hidden sm:inline">${subtotal.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-xs font-bold text-cafe-primary-text/80 hidden sm:inline">Bag Empty</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:px-6">
        
        {/* If user is actively tracking an order, show tracker at very top */}
        {activeOrder && activeTab === 'explore' && (
          <div className="mb-8">
            <OrderTracker
              order={activeOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              onDismiss={() => handleUpdateOrderStatus('picked_up')}
            />
          </div>
        )}

        {activeTab === 'history' ? (
          // COFFEE JOURNAL / HISTORY VIEW
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800">Your Brewing History</span>
              <h2 className="text-2xl font-serif font-bold text-stone-950 mt-1">The Coffee Journal</h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Review past checkout codes, revisit signature customizations, and instantly trigger reorders from your favorite neighborhood baristas.
              </p>
            </div>
            
            <PastOrders
              orders={orders}
              onReorder={handleReorderPastItems}
              onTrackOrder={handleTrackPastOrder}
            />
          </div>
        ) : activeTab === 'merchant' ? (
          // MERCHANT LIVE CONSOLE VIEW
          <MerchantDashboard />
        ) : (
          // PRIMARY WORKFLOWS: Explore Shops OR Menu Selection
          <AnimatePresence mode="wait">
            {!selectedShop ? (
              // STEP 1: EXPLORE NEIGHBORHOOD CAFES
              <motion.div
                key="explore-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Side: Interactive Neighborhood Vector Map */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-black text-stone-950 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-850" />
                      <span>Neighborhood Hub Radar</span>
                    </h2>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                      Explore specialty coffee bars near you. Hover or click markers to inspect wait times, single-origin menus, and barista queue density.
                    </p>
                  </div>

                  <Map
                    shops={SHOPS}
                    selectedShop={selectedShop}
                    onSelectShop={handleSelectShopFromMap}
                  />
                </div>

                {/* Right Side: Coffee Shops Directory List */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Search filter for coffee shops */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search shop name, beans, or neighborhood..."
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      className="w-full text-xs py-3.5 pl-11 pr-4 rounded-2xl border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-900/10 focus:border-amber-900 transition-all placeholder:text-stone-400"
                    />
                    {shopSearch && (
                      <button
                        onClick={() => setShopSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Available Specialty Roasters ({filteredShops.length})
                    </span>
                    
                    {filteredShops.length > 0 ? (
                      filteredShops.map((shop) => (
                        <ShopCard
                          key={shop.id}
                          shop={shop}
                          isSelected={selectedShop?.id === shop.id}
                          onSelect={() => handleSelectShopFromMap(shop)}
                        />
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white border border-stone-150 rounded-2xl text-stone-400 text-xs font-semibold">
                        No local roasters match your search. Try "Rustic" or "Cyber".
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              // STEP 2: ACTIVE CAFE DRINK MENU
              <motion.div
                key="menu-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Back Link / Shop banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-250">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => setSelectedShop(null)}
                      className="p-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition-all cursor-pointer shadow-xs shrink-0"
                      title="Back to Roasters Map"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-250/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          Active Roast Laboratory
                        </span>
                        <span className="text-xs font-bold text-stone-400">Open • {selectedShop.hours}</span>
                      </div>
                      <h2 className="text-2xl font-serif font-black text-stone-950 mt-1">
                        {selectedShop.name}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs bg-stone-100/50 border border-stone-200 p-2.5 rounded-xl sm:self-start">
                    <div className="text-center px-2 border-r border-stone-200 shrink-0">
                      <span className="text-[9px] text-stone-400 font-bold uppercase block">Wait Queue</span>
                      <span className="font-bold text-stone-800 text-xs">{selectedShop.waitTimeMinutes} mins</span>
                    </div>
                    <div className="text-center px-2 border-r border-stone-200 shrink-0">
                      <span className="text-[9px] text-stone-400 font-bold uppercase block">Distance</span>
                      <span className="font-bold text-stone-800 text-xs">{selectedShop.distance} mi</span>
                    </div>
                    <div className="text-center px-2 shrink-0">
                      <span className="text-[9px] text-stone-400 font-bold uppercase block">Dial-In</span>
                      <span className="font-mono text-[10px] text-amber-900 font-bold">{selectedShop.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Categories Badge Menu Selector & Inner Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Categorized scrolls */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
                    {menuCategoryConfig.map((cat) => {
                      const isActive = selectedMenuCategory === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedMenuCategory(cat.id as any)}
                          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                            isActive
                              ? 'bg-amber-900 border-amber-950 text-white shadow-sm'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Drink Item Search */}
                  <div className="relative md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search menu (e.g. Lavender, Scone)..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full text-xs py-2 pl-9 pr-8 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900/10 focus:border-amber-900 transition-all placeholder:text-stone-400"
                    />
                    {menuSearch && (
                      <button
                        onClick={() => setMenuSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of Coffee Cups & Bakery Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                      >
                        {/* Upper image & tag banner */}
                        <div className="relative h-44 bg-stone-100 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          {/* Floating Tags */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            {item.tags.map(t => (
                              <span key={t} className="bg-black/65 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Mid Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-sans font-bold text-stone-900 text-sm group-hover:text-amber-900 transition-colors">
                                {item.name}
                              </h4>
                              <span className="font-mono font-bold text-amber-900 text-sm">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                              {item.category === 'bakery' ? 'Gourmet Pastry' : 'Beverage Builder'}
                            </span>

                            <button
                              onClick={() => setCustomizingItem(item)}
                              className="px-3.5 py-1.5 bg-stone-900 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <span>Customize & Add</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full p-12 text-center bg-white border border-stone-150 rounded-2xl text-stone-400 text-xs font-semibold">
                      No menu matches found. Adjust your search parameters or select a different category.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* 3. SLIDE-OVER COFFEE BAG (CART DRAWER) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
              />

              {/* Slide panel */}
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className="pointer-events-auto w-screen max-w-md"
                >
                  <div className="flex h-full flex-col bg-white shadow-2xl overflow-hidden border-l border-stone-200">
                    {/* Header */}
                    <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-amber-900" />
                        <h3 className="font-sans font-bold text-base text-stone-950">Your Brewing Bag</h3>
                        <span className="bg-amber-900/10 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
                        </span>
                      </div>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Cart list body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {cart.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-stone-50 border border-stone-200/50 rounded-full flex items-center justify-center text-stone-300 mb-3">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-stone-500 font-bold">Your bag is currently empty.</p>
                          <p className="text-[11px] text-stone-400 max-w-xs mt-1">Navigate to any specialty roaster above and start custom building your beverage!</p>
                          <button
                            onClick={() => setIsCartOpen(false)}
                            className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors cursor-pointer"
                          >
                            Explore Menu Items
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Shop header indicator */}
                          <div className="p-3 bg-amber-50/40 border border-amber-200/40 rounded-xl flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                            <span className="text-[11px] font-semibold text-amber-950 leading-relaxed">
                              Order for quick pickup at: <strong className="font-bold">{selectedShop?.name || 'Local Shop'}</strong>
                            </span>
                          </div>

                          {/* Items array */}
                          <div className="divide-y divide-stone-100">
                            {cart.map((item) => {
                              const isBakery = item.menuItem.category === 'bakery';
                              return (
                                <div key={item.cartId} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                                  <img
                                    src={item.menuItem.imageUrl}
                                    alt={item.menuItem.name}
                                    className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="text-xs font-bold text-stone-900 leading-snug">{item.menuItem.name}</h4>
                                      <span className="text-xs font-mono font-bold text-stone-900">${item.totalPrice.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Small customized options tagline */}
                                    {!isBakery && (
                                      <p className="text-[10px] text-stone-400 mt-1 leading-relaxed font-medium">
                                        {[
                                          item.customization.size,
                                          item.customization.milk !== 'None' ? item.customization.milk : null,
                                          item.customization.shots > 0 ? `${item.customization.shots} Shots` : null,
                                          item.customization.sweetener !== 'None' ? `${item.customization.sweetenerPumps}p ${item.customization.sweetener}` : null,
                                          item.customization.extraHot ? 'Extra Hot' : null,
                                          item.customization.extraIce ? 'Extra Ice' : null,
                                          item.customization.whippedCream ? 'Whip Foam' : null
                                        ].filter(Boolean).join(' • ')}
                                      </p>
                                    )}

                                    {item.customization.specialInstructions && (
                                      <p className="text-[9px] bg-stone-50 border border-stone-100 p-1.5 rounded text-stone-500 mt-1.5 italic font-medium">
                                        "{item.customization.specialInstructions}"
                                      </p>
                                    )}

                                    {/* Modifier Quantities and Delete */}
                                    <div className="flex items-center justify-between mt-3">
                                      <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/50 px-2.5 py-1 rounded-xl">
                                        <button
                                          onClick={() => handleUpdateCartQty(item.cartId, -1)}
                                          className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-xs font-bold text-stone-800 w-4 text-center">{item.quantity}</span>
                                        <button
                                          onClick={() => handleUpdateCartQty(item.cartId, 1)}
                                          className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleRemoveCartItem(item.cartId)}
                                        className="text-stone-400 hover:text-red-600 transition-colors p-1"
                                        title="Remove beverage"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order summary pricing inputs & Checkout */}
                    {cart.length > 0 && (
                      <div className="border-t border-stone-200 bg-stone-50 p-5 space-y-4 shrink-0">
                        {/* A. Pickup Time Scheduler */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                            Set Pickup Timer
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full text-xs bg-white p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-cafe-primary focus:border-cafe-primary"
                          >
                            <option value="ASAP (5-8 Mins)">ASAP (Ready in {selectedShop?.waitTimeMinutes || 5} mins)</option>
                            <option value="In 15 Minutes">In 15 Minutes</option>
                            <option value="In 30 Minutes">In 30 Minutes</option>
                            <option value="In 1 Hour">In 1 Hour</option>
                          </select>
                        </div>
 
                        {/* B. Tip the baristas */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                            Support Local Baristas (Tip)
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[0, 1.00, 2.00, 3.00].map((amt) => {
                              const isActive = !customTipActive && tipAmount === amt;
                              return (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => {
                                    setCustomTipActive(false);
                                    setTipAmount(amt);
                                  }}
                                  className={`py-1.5 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-cafe-primary border-cafe-primary-hover text-white'
                                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                                  }`}
                                >
                                  {amt === 0 ? 'No Tip' : `$${amt.toFixed(0)}`}
                                </button>
                              );
                            })}
                          </div>
 
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setCustomTipActive(!customTipActive)}
                              className={`text-[10px] font-bold underline cursor-pointer ${customTipActive ? 'text-cafe-primary-text' : 'text-stone-400 hover:text-stone-700'}`}
                            >
                              {customTipActive ? 'Choose Standard Tip' : '+ Custom Barista Tip'}
                            </button>
                            
                            {customTipActive && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1.5 relative"
                              >
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">$</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={customTipInput}
                                  onChange={(e) => setCustomTipInput(e.target.value)}
                                  className="w-full text-xs pl-6 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cafe-primary focus:border-cafe-primary"
                                />
                              </motion.div>
                            )}
                          </div>
                        </div>
 
                        {/* C. Prices breakdown */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-200/60 text-xs text-stone-600 font-medium">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Local Sales Tax (8.25%)</span>
                            <span className="font-mono">${tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Barista Support (Tip)</span>
                            <span className="font-mono">${finalTip.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-stone-950 font-bold pt-2 border-t border-stone-200 text-sm">
                            <span>Grand Total</span>
                            <span className="font-mono text-cafe-primary-text font-black">${grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
 
                        {/* D. Instant checkout button */}
                        <button
                          onClick={handleCheckout}
                          className="w-full bg-cafe-primary hover:bg-cafe-primary-hover text-white font-sans font-extrabold text-sm py-3 px-6 rounded-2xl shadow-md shadow-cafe-primary/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-1"
                        >
                          <Coffee className="w-4 h-4 fill-white" />
                          <span>Place Pickup Order Ahead</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL DRAWER DRINK CUSTOMIZER */}
      <CustomizeModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* FOOTER METADATA COFFEE LABELS */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 px-4 border-t border-stone-800 shrink-0 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-900/30 border border-amber-900/45 rounded-xl flex items-center justify-center text-amber-400">
              <Coffee className="w-4 h-4" />
            </div>
            <p className="font-serif font-bold text-stone-200">SUPER DOUBLE A neighborhood orders</p>
          </div>
          <p className="text-[10px] text-stone-500 font-mono text-center md:text-right">
            Designed to connect local artisan roasters with busy neighborhood coffee fans. Secure sandbox environment.
          </p>
        </div>
      </footer>
    </div>
  );
}
