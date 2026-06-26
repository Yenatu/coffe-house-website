import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, OrderStatus } from '../types';
import {
  Store,
  Clock,
  CheckCircle2,
  Play,
  Coffee,
  Check,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MerchantDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time order updates from Firestore
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        fetchedOrders.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Order);
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update order status in Firestore
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        active: newStatus !== 'picked_up'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Helper to trigger dummy seeding to test the real-time database immediately
  const handleSeedMockOrders = async () => {
    try {
      const batch = writeBatch(db);
      const mockIds = [`order-seed-1`, `order-seed-2`];
      
      const seed1: any = {
        id: mockIds[0],
        shopId: "rustic-grind",
        shopName: "The Rustic Grind",
        shopAddress: "124 Oakwood Ave",
        items: [
          {
            cartId: "item-1",
            menuItem: {
              id: "item-latte",
              name: "Signature Draft Latte",
              description: "Cold-pressed espresso charged with sweet oat milk",
              price: 5.50,
              category: "iced_cold"
            },
            customization: {
              size: "Grande",
              milk: "Oat Milk",
              sweetener: "Vanilla Syrup",
              sweetenerPumps: 2,
              shots: 2
            },
            quantity: 1,
            unitPrice: 5.50,
            totalPrice: 5.50
          }
        ],
        subtotal: 5.50,
        tax: 0.45,
        tip: 1.00,
        total: 6.95,
        status: "received",
        pickupTime: "ASAP (5-8 Mins)",
        pickupCode: "CUP-731",
        orderDate: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
        active: true
      };

      const seed2: any = {
        id: mockIds[1],
        shopId: "neon-wave",
        shopName: "Neon Wave Coffee",
        shopAddress: "882 Broadway Blvd",
        items: [
          {
            cartId: "item-2",
            menuItem: {
              id: "item-croissant",
              name: "Warm Almond Croissant",
              description: "Flaky twice-baked butter pastry with frangipane fill",
              price: 4.75,
              category: "bakery"
            },
            customization: {
              size: "None",
              milk: "None",
              sweetener: "None",
              sweetenerPumps: 0,
              shots: 0
            },
            quantity: 2,
            unitPrice: 4.75,
            totalPrice: 9.50
          }
        ],
        subtotal: 9.50,
        tax: 0.78,
        tip: 2.00,
        total: 12.28,
        status: "brewing",
        pickupTime: "In 15 Mins",
        pickupCode: "CUP-249",
        orderDate: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
        active: true
      };

      batch.set(doc(db, 'orders', mockIds[0]), seed1);
      batch.set(doc(db, 'orders', mockIds[1]), seed2);
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    }
  };

  // Filtered list
  const filteredOrders = selectedShopFilter === 'all'
    ? orders
    : orders.filter(o => o.shopId === selectedShopFilter);

  // Stats calculators
  const pendingOrders = orders.filter(o => o.active).length;
  const completedOrdersCount = orders.filter(o => o.status === 'picked_up').length;
  const totalRevenue = orders
    .filter(o => o.status === 'picked_up')
    .reduce((sum, o) => sum + o.total, 0);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'brewing': return 'bg-blue-100 text-blue-950 border-blue-200';
      case 'ready': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'picked_up': return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'Received / Queue';
      case 'brewing': return 'Active Brewing';
      case 'ready': return 'Ready on Counter';
      case 'picked_up': return 'Completed & Picked Up';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Intro and Seeder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-950 text-stone-100 p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold tracking-widest uppercase mb-1">
            <Briefcase className="w-4 h-4 animate-pulse" />
            <span>Real-time Shop Portal</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Barista & Merchant Live Console</h2>
          <p className="text-stone-300 text-xs mt-1 max-w-xl">
            This dashboard displays incoming coffee orders from Firestore database in real-time. Move orders through brewing phases to update customers instantly!
          </p>
        </div>
        <button
          onClick={handleSeedMockOrders}
          className="relative px-4 py-2 bg-amber-900/80 hover:bg-amber-900 border border-amber-800 text-amber-200 hover:text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
        >
          Seed Demo Orders
        </button>
      </div>

      {/* Real-time statistics counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-900 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Live Pending Queue</span>
            <span className="text-2xl font-mono font-black text-stone-900">{pendingOrders} Orders</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Completed Today</span>
            <span className="text-2xl font-mono font-black text-stone-900">{completedOrdersCount} Cups</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-700 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Live Session Revenue</span>
            <span className="text-2xl font-mono font-black text-stone-900">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filters and Queue Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Live Order Streams</h3>
          <p className="text-xs text-stone-500">Connected to Firestore instance in real-time</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Cafe Filter:</span>
          <select
            value={selectedShopFilter}
            onChange={(e) => setSelectedShopFilter(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-900/20 shadow-sm"
          >
            <option value="all">All Shops</option>
            <option value="rustic-grind">The Rustic Grind</option>
            <option value="neon-wave">Neon Wave Coffee</option>
            <option value="velvet-bean">Velvet Bean Atelier</option>
          </select>
        </div>
      </div>

      {/* Orders List / Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Listening to Live Database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 border-dashed rounded-3xl p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
          <div>
            <h4 className="font-serif font-bold text-stone-900">No Orders in Queue</h4>
            <p className="text-stone-500 text-xs mt-1">
              Place an order from the "Explore Cafes" screen or click "Seed Demo Orders" above to populate!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between ${
                  !order.active ? 'opacity-70 bg-stone-50/50' : 'hover:shadow-md transition-shadow'
                }`}
              >
                {/* Order Meta Header */}
                <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-900" />
                      <span className="font-serif font-black text-sm text-stone-950">{order.shopName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-500 font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-stone-300">•</span>
                      <span>{order.pickupTime}</span>
                    </div>
                  </div>

                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>

                {/* Cart Items */}
                <div className="p-4 flex-1 space-y-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={item.cartId || i} className="flex justify-between items-start text-stone-900 border-b border-stone-50 pb-2 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <span className="bg-stone-200 text-stone-800 rounded px-1.5 py-0.2 text-[10px] font-mono">
                            x{item.quantity}
                          </span>
                          <span>{item.menuItem.name}</span>
                        </div>
                        {item.customization && (
                          <div className="text-[10px] text-stone-500 font-medium pl-8 space-y-0.5 leading-tight">
                            {item.customization.size && item.customization.size !== 'None' && (
                              <span>• Size: {item.customization.size}</span>
                            )}
                            {item.customization.milk && item.customization.milk !== 'None' && item.customization.milk !== 'No Milk' && (
                              <span> • {item.customization.milk}</span>
                            )}
                            {item.customization.sweetener && item.customization.sweetener !== 'None' && (
                              <span> • {item.customization.sweetener} ({item.customization.sweetenerPumps} Pumps)</span>
                            )}
                            {item.customization.shots > 0 && (
                              <span> • {item.customization.shots} Shots</span>
                            )}
                            {item.customization.specialInstructions && (
                              <p className="italic text-amber-900 mt-0.5">"{item.customization.specialInstructions}"</p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-stone-600">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing summary & Quick action controllers */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Passcode & Total</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-amber-900 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded">
                        {order.pickupCode}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-stone-700">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions mapping order workflow steps */}
                  <div className="flex gap-1.5">
                    {order.status === 'received' && (
                      <button
                        onClick={() => updateStatus(order.id, 'brewing')}
                        className="bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Brew Cup</span>
                      </button>
                    )}

                    {order.status === 'brewing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Coffee className="w-3 h-3" />
                        <span>Ready Shelf</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(order.id, 'picked_up')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pick Up</span>
                      </button>
                    )}

                    {order.status === 'picked_up' && (
                      <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Closed</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
