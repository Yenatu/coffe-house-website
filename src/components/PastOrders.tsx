import { Order, CartItem } from '../types';
import { Coffee, RotateCcw, Calendar, Check, HelpCircle, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface PastOrdersProps {
  orders: Order[];
  onReorder: (items: CartItem[], shopId: string) => void;
  onTrackOrder: (order: Order) => void;
}

export default function PastOrders({ orders, onReorder, onTrackOrder }: PastOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-150 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-stone-50 rounded-full border border-stone-200/50 flex items-center justify-center text-stone-300 mb-4 animate-bounce">
          <Coffee className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="font-sans font-bold text-lg text-stone-800">Your Coffee Diary is Empty</h3>
        <p className="text-stone-500 text-xs max-w-xs mt-1.5 leading-relaxed">
          Order your favorite artisan brews ahead. Your complete ordering history and tracking receipts will live here.
        </p>
      </div>
    );
  }

  // Helper to format custom settings into readable label
  const getCustomizationLabel = (item: CartItem) => {
    if (item.menuItem.category === 'bakery') return 'Standard Fresh Bakery';
    const parts = [
      item.customization.size,
      item.customization.milk !== 'None' ? item.customization.milk : null,
      item.customization.shots > 0 ? `${item.customization.shots} Shot${item.customization.shots > 1 ? 's' : ''}` : null,
      item.customization.sweetener !== 'None' ? `${item.customization.sweetenerPumps}p ${item.customization.sweetener}` : null,
      item.customization.extraHot ? 'Extra Hot' : null,
      item.customization.extraIce ? 'Extra Ice' : null,
      item.customization.whippedCream ? 'Whip Foam' : null
    ].filter(Boolean);
    return parts.join(' • ');
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-250 p-5 shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>{new Date(order.orderDate).toLocaleDateString()} at {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h4 className="font-sans font-bold text-sm text-stone-900 mt-1 flex items-center gap-1">
                <span>Ordered from</span>
                <span className="text-cafe-primary-text font-black">{order.shopName}</span>
              </h4>
            </div>

            {/* Order status pill / action */}
            <div className="flex items-center gap-2">
              {order.active ? (
                <button
                  onClick={() => onTrackOrder(order)}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-cafe-primary text-white border border-cafe-primary-hover hover:bg-cafe-primary-hover transition-all cursor-pointer"
                >
                  Track Order Live
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                  Pickup Completed
                </span>
              )}
            </div>
          </div>

          {/* List of ordered items */}
          <div className="py-3 space-y-2.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-100 text-stone-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-stone-800">{item.menuItem.name}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium ml-8 mt-0.5 leading-relaxed">
                    {getCustomizationLabel(item)}
                  </p>
                </div>
                <span className="font-semibold text-stone-800 shrink-0">
                  ${item.totalPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Summary & Quick Reorder */}
          <div className="pt-3.5 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-stone-400 font-semibold">Total Paid:</span>
              <span className="text-sm font-bold text-stone-900">${order.total.toFixed(2)}</span>
              <span className="text-[10px] text-stone-400 font-medium">({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
            </div>

            <button
              onClick={() => onReorder(order.items, order.shopId)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-cafe-primary-text border border-cafe-primary/20 rounded-xl bg-cafe-primary-light/10 hover:bg-cafe-primary-light/45 hover:border-cafe-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reorder Brewing Bag</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
