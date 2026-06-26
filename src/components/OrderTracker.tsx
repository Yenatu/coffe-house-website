import { Order, OrderStatus } from '../types';
import { motion } from 'motion/react';
import { Coffee, MapPin, Check, Sparkles, Clock, Phone, Navigation, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OrderTrackerProps {
  order: Order;
  onUpdateStatus: (status: OrderStatus) => void;
  onDismiss: () => void;
}

export default function OrderTracker({ order, onUpdateStatus, onDismiss }: OrderTrackerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes count down in seconds

  // Simulating order transition from 'received' -> 'brewing' -> 'ready'
  useEffect(() => {
    // 1. received -> brewing after 10 seconds
    const timer1 = setTimeout(() => {
      if (order.status === 'received') {
        onUpdateStatus('brewing');
      }
    }, 10000);

    // 2. brewing -> ready after 35 seconds total
    const timer2 = setTimeout(() => {
      if (order.status === 'brewing' || order.status === 'received') {
        onUpdateStatus('ready');
      }
    }, 45000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [order.id, order.status, onUpdateStatus]);

  // Handle countdown timer ticker
  useEffect(() => {
    if (order.status === 'ready' || order.status === 'picked_up') {
      setTimeLeft(0);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const stages: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'received', label: 'Order Sent', desc: 'Received & queued by cashiers' },
    { status: 'brewing', label: 'Barista Brewing', desc: 'Crafting espresso & steaming milk' },
    { status: 'ready', label: 'Ready for Pickup', desc: 'Waiting in thermal cabinet Slot B-4' },
    { status: 'picked_up', label: 'Enjoy!', desc: 'Order picked up' }
  ];

  const getStageIndex = (current: OrderStatus) => {
    if (current === 'received') return 0;
    if (current === 'brewing') return 1;
    if (current === 'ready') return 2;
    return 3;
  };

  const currentIndex = getStageIndex(order.status);

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Visual Header / Glowing bar */}
      <div className="bg-stone-900 text-white p-6 relative overflow-hidden">
        {/* Abstract background glowing circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-700/10 rounded-full blur-2xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold tracking-widest uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Brewing Radar</span>
            </div>
            <h3 className="text-xl font-sans font-extrabold tracking-tight">
              Order at {order.shopName}
            </h3>
            <p className="text-stone-400 text-xs mt-0.5 font-medium">{order.shopAddress}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-stone-800 border border-stone-700 rounded-2xl p-3">
            <div className="text-right">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Pickup Passcode</span>
              <span className="text-sm font-mono font-bold text-amber-400 tracking-wider">{order.pickupCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Status Timer & Custom Liquid Animation */}
      <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row items-center gap-6 bg-stone-50/50">
        {/* Animated Barista graphic */}
        <div className="w-32 h-32 shrink-0 bg-white border border-stone-150 rounded-2xl flex flex-col items-center justify-center relative shadow-sm overflow-hidden">
          {/* Steam ripples */}
          {order.status === 'brewing' && (
            <div className="absolute top-4 flex gap-1">
              <motion.span
                animate={{ y: [0, -10, 0], opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, delay: 0 }}
                className="w-1 h-3 bg-amber-200/50 rounded-full"
              ></motion.span>
              <motion.span
                animate={{ y: [0, -12, 0], opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
                className="w-1 h-4 bg-amber-300/40 rounded-full"
              ></motion.span>
              <motion.span
                animate={{ y: [0, -10, 0], opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, delay: 0.8 }}
                className="w-1 h-3 bg-amber-200/50 rounded-full"
              ></motion.span>
            </div>
          )}

          {/* Coffee Cup outline */}
          <div className="w-14 h-12 border-2 border-stone-800 rounded-b-xl relative mt-4">
            {/* Handle */}
            <div className="w-3 h-6 border-2 border-l-0 border-stone-800 rounded-r-lg absolute top-2 left-full"></div>

            {/* Brew Liquid fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-cafe-primary rounded-b-lg transition-all duration-500"
              initial={{ height: '10%' }}
              animate={
                order.status === 'received'
                  ? { height: '15%' }
                  : order.status === 'brewing'
                  ? { height: ['15%', '85%', '85%'] }
                  : { height: '95%' }
              }
              transition={{ repeat: order.status === 'brewing' ? Infinity : 0, duration: 6, ease: 'easeInOut' }}
            />
          </div>

          <span className="text-[10px] font-bold text-stone-400 mt-3 uppercase tracking-wider">
            {order.status === 'received' ? 'Preparing' : order.status === 'brewing' ? 'Infusing' : 'Finished'}
          </span>
        </div>

        {/* Status texts & Timer countdown */}
        <div className="flex-1 text-center md:text-left space-y-2">
          {order.status === 'ready' ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Ready on Shelf B-4</span>
              </div>
              <h4 className="text-xl font-sans font-bold text-stone-900 mt-2">Your Cup is Hot & Waiting!</h4>
              <p className="text-xs text-stone-500 leading-relaxed mt-1">
                Head into the cafe, scan for **Shelf B-4** near the pick-up counter, and show checkout code **{order.pickupCode}** if requested.
              </p>
            </div>
          ) : order.status === 'picked_up' ? (
            <div>
              <h4 className="text-xl font-sans font-bold text-stone-900">Brews Completed!</h4>
              <p className="text-xs text-stone-500 leading-relaxed mt-1">
                Hope your beverage is absolutely perfect. Have a spectacular morning and see you for your next espresso adventure.
              </p>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1 text-xs text-stone-400 font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>Est. Pickup wait time</span>
              </div>
              <h4 className="text-2xl font-sans font-extrabold text-stone-900 mt-1">{formatTime(timeLeft)}</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Our baristas are actively handcrafting your order ahead. Please travel to the shop coordinates securely.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Stepper Roadmap */}
      <div className="p-6 md:p-8 space-y-6 bg-white">
        <div className="relative">
          {/* Timeline Vertical connector road line */}
          <div className="absolute top-3 bottom-3 left-3 w-0.5 bg-stone-100"></div>

          {/* Stepper items */}
          <div className="space-y-6">
            {stages.map((stage, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;

              return (
                <div key={stage.status} className="flex items-start gap-4 relative">
                  {/* Circle Indicator */}
                  <div className="relative shrink-0">
                    {isPast ? (
                      <div className="w-6.5 h-6.5 rounded-full bg-cafe-primary border border-cafe-primary-hover flex items-center justify-center text-white shadow-sm transition-all">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6.5 h-6.5 rounded-full bg-white border-2 border-cafe-primary flex items-center justify-center shadow-md relative transition-all">
                        <span className="w-2.5 h-2.5 rounded-full bg-cafe-primary animate-pulse"></span>
                      </div>
                    ) : (
                      <div className="w-6.5 h-6.5 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>
                      </div>
                    )}
                  </div>

                  {/* Stage description texts */}
                  <div className="flex-1 pt-0.5">
                    <h5 className={`text-xs font-bold ${isCurrent ? 'text-stone-950 text-sm' : isPast ? 'text-stone-600' : 'text-stone-400'}`}>
                      {stage.label}
                    </h5>
                    <p className={`text-[11px] mt-0.5 ${isCurrent ? 'text-stone-500 font-medium' : 'text-stone-400'}`}>
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Simulation Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-stone-100">
          {order.status === 'ready' && (
            <button
              onClick={() => onUpdateStatus('picked_up')}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>I Have Picked Up My Cup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {order.status === 'picked_up' && (
            <button
              onClick={onDismiss}
              className="w-full bg-stone-900 hover:bg-black text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Return to Cafe Explorer
            </button>
          )}

          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <a
              href={`tel:${order.id === 'rustic-grind' ? '(555) 234-5678' : order.id === 'neon-wave' ? '(555) 876-5432' : '(555) 456-7890'}`}
              className="flex-1 sm:flex-initial p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all border border-stone-200"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Shop</span>
            </a>
            <button
              onClick={() => alert(`Navigating via map directions to ${order.shopAddress}...`)}
              className="flex-1 sm:flex-initial p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all border border-stone-200"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
