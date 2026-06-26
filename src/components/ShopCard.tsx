import React from 'react';
import { Shop } from '../types';
import { Star, Clock, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ShopCardProps {
  key?: string;
  shop: Shop;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ShopCard({ shop, isSelected, onSelect }: ShopCardProps) {
  const busyConfig = {
    low: { label: 'Quick Pickup', color: 'bg-emerald-50 text-emerald-800 border-emerald-200/60' },
    medium: { label: 'Moderate Wait', color: 'bg-amber-50 text-amber-800 border-amber-200/60' },
    high: { label: 'Very Busy Counter', color: 'bg-rose-50 text-rose-800 border-rose-200/60' }
  };

  const selectedClass = isSelected
    ? 'border-amber-700 bg-amber-50/40 shadow-md ring-2 ring-amber-700/10'
    : 'border-stone-200 hover:border-amber-800/40 hover:bg-stone-50/50 shadow-sm';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border p-4 flex gap-4 transition-all duration-300 ${selectedClass}`}
    >
      {/* Shop Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-200/60">
        <img
          src={shop.imageUrl}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Distance Badge */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <MapPin className="w-2.5 h-2.5 text-amber-400" />
          <span>{shop.distance} mi</span>
        </div>
      </div>

      {/* Shop Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-sans font-bold text-base text-stone-900 group-hover:text-amber-900 transition-colors duration-200">
              {shop.name}
            </h3>
            {isSelected && (
              <span className="shrink-0 bg-amber-700 text-white rounded-full p-0.5" title="Selected Shop">
                <CheckCircle className="w-4 h-4 fill-amber-700 stroke-white" />
              </span>
            )}
          </div>
          
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {shop.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-stone-100">
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
            <span className="text-xs font-bold text-stone-800">{shop.rating}</span>
            <span className="text-[10px] text-stone-400 font-medium">({shop.reviewCount})</span>
          </div>

          {/* Time Estimate */}
          <div className="flex items-center gap-1 text-stone-700">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-bold">{shop.waitTimeMinutes} mins</span>
          </div>

          {/* Busy Status */}
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${busyConfig[shop.busyStatus].color}`}>
            {busyConfig[shop.busyStatus].label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
