import { MenuItem, DrinkCustomization, CartItem } from '../types';
import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, ShieldAlert, Heart, Plus, Minus, Info } from 'lucide-react';

interface CustomizeModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: Omit<CartItem, 'cartId'>) => void;
}

const SIZES: { name: 'Short' | 'Tall' | 'Grande' | 'Venti'; label: string; priceDiff: number }[] = [
  { name: 'Short', label: 'Short (8oz)', priceDiff: -0.40 },
  { name: 'Tall', label: 'Tall (12oz)', priceDiff: 0 },
  { name: 'Grande', label: 'Grande (16oz)', priceDiff: 0.50 },
  { name: 'Venti', label: 'Venti (20oz)', priceDiff: 0.90 }
];

const MILKS = [
  { name: 'Whole Milk', label: 'Whole Milk', priceDiff: 0 },
  { name: 'Oat Milk', label: 'Barista Oat Milk', priceDiff: 0.65 },
  { name: 'Almond Milk', label: 'Almond Milk', priceDiff: 0.65 },
  { name: 'Coconut Milk', label: 'Organic Coconut Milk', priceDiff: 0.65 },
  { name: 'No Milk', label: 'No Milk', priceDiff: 0 }
];

const SYRUPS = [
  { name: 'None', label: 'No Syrup', priceDiff: 0 },
  { name: 'Sugar Raw', label: 'Raw Sugar Cane', priceDiff: 0 },
  { name: 'Simple Syrup', label: 'Organic Simple Syrup', priceDiff: 0 },
  { name: 'Vanilla Syrup', label: 'Madagascar Vanilla Syrup', priceDiff: 0.50 },
  { name: 'Caramel Syrup', label: 'Rich Caramel Drizzle Syrup', priceDiff: 0.50 },
  { name: 'Hazelnut Syrup', label: 'Roasted Hazelnut Syrup', priceDiff: 0.50 }
];

export default function CustomizeModal({ item, onClose, onAddToCart }: CustomizeModalProps) {
  if (!item) return null;

  const isBakery = item.category === 'bakery';

  // State initialized with defaults
  const [size, setSize] = useState<'Short' | 'Tall' | 'Grande' | 'Venti' | 'None'>(item.defaults.size);
  const [milk, setMilk] = useState<string>(item.defaults.milk);
  const [sweetener, setSweetener] = useState<string>(item.defaults.sweetener);
  const [pumps, setPumps] = useState<number>(item.defaults.sweetenerPumps);
  const [shots, setShots] = useState<number>(item.defaults.shots);
  const [extraHot, setExtraHot] = useState<boolean>(item.defaults.extraHot || false);
  const [extraIce, setExtraIce] = useState<boolean>(item.defaults.extraIce || false);
  const [whippedCream, setWhippedCream] = useState<boolean>(item.defaults.whippedCream || false);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(item.price);

  // Recalculate dynamic price when customization changes
  useEffect(() => {
    if (isBakery) {
      setCustomPrice(item.price);
      return;
    }

    let extraCost = 0;

    // Size pricing adjustment
    const sizeConfig = SIZES.find(s => s.name === size);
    if (sizeConfig) {
      extraCost += sizeConfig.priceDiff;
    }

    // Milk pricing
    const milkConfig = MILKS.find(m => m.name === milk);
    if (milkConfig) {
      extraCost += milkConfig.priceDiff;
    }

    // Syrup pricing (charged if not None and if pumps > 0)
    const syrupConfig = SYRUPS.find(s => s.name === sweetener);
    if (syrupConfig && sweetener !== 'None' && pumps > 0) {
      extraCost += syrupConfig.priceDiff;
    }

    // Extra Espresso Shots (charge $0.80 for shots over item defaults)
    const extraShotsCount = Math.max(0, shots - item.defaults.shots);
    extraCost += extraShotsCount * 0.85;

    // Whipped cream cost
    if (whippedCream) {
      extraCost += 0.50;
    }

    setCustomPrice(Math.max(2.0, item.price + extraCost));
  }, [size, milk, sweetener, pumps, shots, whippedCream, item, isBakery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const customization: DrinkCustomization = {
      size,
      milk: milk as any,
      sweetener: sweetener as any,
      sweetenerPumps: pumps,
      shots,
      extraHot,
      extraIce,
      whippedCream,
      specialInstructions
    };

    onAddToCart({
      menuItem: item,
      customization,
      quantity,
      unitPrice: Number(customPrice.toFixed(2)),
      totalPrice: Number((customPrice * quantity).toFixed(2))
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
        />

        {/* Modal Drawer container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative bg-white w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-stone-100 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800">Barista Lab Builder</span>
              <h2 className="text-xl font-sans font-bold text-stone-950 mt-0.5">{item.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Short Product Description & Image banner */}
            <div className="flex gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  {item.description}
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {item.tags.map(t => (
                    <span key={t} className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isBakery ? (
              // Bakery Items do not have barista liquid customization options
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2.5">
                <Info className="w-4.5 h-4.5 text-emerald-800 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  This gourmet bakery item is freshly baked in-house daily. It comes standard as is to guarantee crispness and warmth. Add notes below for any serving requests.
                </p>
              </div>
            ) : (
              // Coffee customization panel
              <form className="space-y-6">
                {/* 1. Size Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
                    Select Beverage Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SIZES.map((s) => {
                      const isActive = size === s.name;
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setSize(s.name)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all duration-200 text-center flex flex-col gap-0.5 items-center justify-center ${
                            isActive
                              ? 'bg-amber-900 border-amber-950 text-white shadow-sm ring-2 ring-amber-900/15'
                              : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span>{s.name}</span>
                          <span className={`text-[10px] font-medium ${isActive ? 'text-amber-200' : 'text-stone-400'}`}>
                            {s.priceDiff === 0 ? 'Base' : s.priceDiff > 0 ? `+$${s.priceDiff.toFixed(2)}` : `-$${Math.abs(s.priceDiff).toFixed(2)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Milk Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
                    Milk Selection
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MILKS.map((m) => {
                      const isActive = milk === m.name;
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => setMilk(m.name)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex justify-between items-center ${
                            isActive
                              ? 'bg-stone-900 border-stone-950 text-white shadow-sm'
                              : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span>{m.label}</span>
                          <span className={`text-[10px] ${isActive ? 'text-amber-300' : 'text-stone-400'}`}>
                            {m.priceDiff === 0 ? 'Free' : `+$${m.priceDiff.toFixed(2)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Espresso Shots Counter */}
                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-2xl">
                  <div>
                    <span className="text-sm font-bold text-stone-900">Espresso Shots</span>
                    <p className="text-[10px] text-stone-400 font-medium">Standard for {size}: {item.defaults.shots} shot{item.defaults.shots !== 1 && 's'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={shots <= 0}
                      onClick={() => setShots(Math.max(0, shots - 1))}
                      className="p-1 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-stone-900 text-sm">{shots}</span>
                    <button
                      type="button"
                      disabled={shots >= 5}
                      onClick={() => setShots(shots + 1)}
                      className="p-1 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4. Sweetener Syrups */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
                      Flavored Syrup Base
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SYRUPS.map((s) => {
                        const isActive = sweetener === s.name;
                        return (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => {
                              setSweetener(s.name);
                              if (s.name === 'None') setPumps(0);
                              else if (pumps === 0) setPumps(2);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex justify-between items-center ${
                              isActive
                                ? 'bg-stone-900 border-stone-950 text-white shadow-sm'
                                : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                            }`}
                          >
                            <span>{s.label}</span>
                            <span className={`text-[10px] ${isActive ? 'text-amber-300' : 'text-stone-400'}`}>
                              {s.priceDiff === 0 ? 'Free' : `+$${s.priceDiff.toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {sweetener !== 'None' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-2xl"
                    >
                      <div>
                        <span className="text-xs font-bold text-stone-800">Syrup Pumps</span>
                        <p className="text-[10px] text-stone-400 font-medium">Sweetness depth count</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={pumps <= 1}
                          onClick={() => setPumps(pumps - 1)}
                          className="p-1 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-bold text-stone-900 text-xs">{pumps} pump{pumps !== 1 && 's'}</span>
                        <button
                          type="button"
                          disabled={pumps >= 8}
                          onClick={() => setPumps(pumps + 1)}
                          className="p-1 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 5. Extra Toppings / Temperatures */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
                    Temperature & Toppings
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExtraHot(!extraHot);
                        if (extraIce) setExtraIce(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        extraHot
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Extra Hot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setExtraIce(!extraIce);
                        if (extraHot) setExtraHot(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        extraIce
                          ? 'bg-sky-50 border-sky-200 text-sky-800'
                          : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span>Extra Ice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWhippedCream(!whippedCream)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex justify-center items-center gap-1.5 ${
                        whippedCream
                          ? 'bg-amber-900 border-amber-950 text-white'
                          : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span>Whip Foam (+$0.50)</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Special Barista Requests
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Ex. 'Leave room for cream', 'Split cup', 'X-hot oat foam'..."
                className="w-full text-xs p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-900/10 focus:border-amber-900 transition-all placeholder:text-stone-400 h-18 resize-none"
              />
            </div>
          </div>

          {/* Footer controls: Quantity Selector & Add button */}
          <div className="p-5 border-t border-stone-100 bg-stone-50/80 backdrop-blur-md flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
            {/* Quantity Counter */}
            <div className="flex items-center gap-4 bg-white border border-stone-200/80 px-4 py-2 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-stone-500">Qty:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                  className="p-0.5 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-5 text-center font-bold text-stone-900 text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-0.5 text-stone-500 hover:text-stone-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Submit Add button */}
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto flex-1 bg-amber-900 hover:bg-amber-950 text-white font-sans font-bold text-sm py-3 px-6 rounded-2xl shadow-md shadow-amber-900/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Add to Coffee Bag</span>
              <span className="h-4 w-px bg-white/20"></span>
              <span>${(customPrice * quantity).toFixed(2)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
