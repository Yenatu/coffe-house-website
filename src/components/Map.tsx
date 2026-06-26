import { motion } from 'motion/react';
import { Shop } from '../types';
import { MapPin, Navigation, Coffee } from 'lucide-react';
import { useState } from 'react';

interface MapProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
}

export default function Map({ shops, selectedShop, onSelectShop }: MapProps) {
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);

  // User coordinate on the map
  const userCoords = { x: 50, y: 55 };

  return (
    <div id="cafe-neighborhood-map" className="relative w-full h-[320px] md:h-[400px] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200/80 shadow-inner">
      {/* Absolute Header Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/50 shadow-sm flex items-center gap-1.5">
        <Navigation className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
        <span className="text-xs font-semibold text-stone-700 tracking-tight">Active Neighborhood Radar</span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200/50 shadow-sm flex flex-col gap-1 text-[10px] font-medium text-stone-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm block animate-ping absolute"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm block relative"></span>
          <span>You (Your Location)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-white flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-white"></span>
          </div>
          <span>Active Coffee Shop</span>
        </div>
      </div>

      {/* SVG Vector Map Layer */}
      <svg
        className="w-full h-full select-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Background / Base Ground */}
        <rect width="100" height="100" fill="#f5f2eb" />

        {/* Central Park Area */}
        <motion.path
          d="M 40 45 L 60 45 L 60 70 L 40 70 Z"
          fill="#e4ecd7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 1 }}
        />
        <text x="50" y="58" fill="#7d9568" fontSize="2" fontWeight="bold" textAnchor="middle" className="font-sans">
          Greenwood Park
        </text>

        {/* River */}
        <motion.path
          d="M -10 90 Q 20 85 40 93 T 90 85 T 110 92"
          fill="none"
          stroke="#d2e3f0"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <text x="80" y="93" fill="#80a0c0" fontSize="1.8" fontStyle="italic" textAnchor="middle" className="font-sans">
          Brewers River
        </text>

        {/* Streets Grid */}
        <g stroke="#e2dcd0" strokeWidth="1.2" strokeLinecap="round">
          {/* Horizontal Streets */}
          <line x1="0" y1="20" x2="100" y2="20" />
          <line x1="0" y1="48" x2="40" y2="48" />
          <line x1="60" y1="48" x2="100" y2="48" />
          <line x1="0" y1="78" x2="100" y2="78" />

          {/* Vertical Streets */}
          <line x1="25" y1="0" x2="25" y2="100" />
          <line x1="55" y1="0" x2="55" y2="45" />
          <line x1="55" y1="70" x2="55" y2="100" />
          <line x1="82" y1="0" x2="82" y2="100" />
        </g>

        {/* Street Name Labels */}
        <g fill="#a69e90" fontSize="1.5" fontWeight="bold" opacity="0.75" className="font-sans font-mono tracking-tight">
          <text x="12" y="19" textAnchor="middle">Broadway Ave</text>
          <text x="75" y="77" textAnchor="middle">Oak Street</text>
          <text x="24" y="10" transform="rotate(-90, 24, 10)" textAnchor="middle">Pine Road</text>
          <text x="81" y="90" transform="rotate(-90, 81, 90)" textAnchor="middle">Lakeside Blvd</text>
        </g>
      </svg>

      {/* USER Location Indicator Overlay */}
      <div
        className="absolute transition-all duration-500"
        style={{ left: `${userCoords.x}%`, top: `${userCoords.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-40 animate-ping"></span>
          <div className="relative h-4 w-4 bg-blue-500 border-2 border-white rounded-full shadow-md flex items-center justify-center">
            <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* COFFEE SHOP Marker Overlay */}
      {shops.map((shop) => {
        const isSelected = selectedShop?.id === shop.id;
        const isHovered = hoveredShop === shop.id;

        return (
          <div
            key={shop.id}
            className="absolute z-20 cursor-pointer"
            style={{ left: `${shop.coords.x}%`, top: `${shop.coords.y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHoveredShop(shop.id)}
            onMouseLeave={() => setHoveredShop(null)}
            onClick={() => onSelectShop(shop)}
          >
            <div className="relative flex flex-col items-center">
              {/* Custom Marker Icon */}
              <motion.div
                className={`relative p-2 rounded-full border-2 shadow-lg transition-all duration-300 ${
                  isSelected
                    ? 'bg-amber-800 border-amber-200 text-white scale-125'
                    : 'bg-white border-amber-800 text-amber-900 hover:scale-115 hover:bg-amber-50'
                }`}
                whileHover={{ scale: 1.25 }}
                animate={isSelected ? { y: [0, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Coffee className="w-4 h-4" />
                
                {/* Glowing Aura if Busy Status is low or Selected */}
                {shop.busyStatus === 'low' && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </motion.div>

              {/* Shop Title Tag (Visible always or on hover) */}
              <div
                className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm whitespace-nowrap transition-all duration-300 border ${
                  isSelected
                    ? 'bg-amber-950 text-amber-100 border-amber-800/80'
                    : 'bg-stone-900 text-white border-stone-800/50 opacity-80'
                } ${isHovered || isSelected ? 'scale-105 opacity-100' : 'scale-95'}`}
              >
                {shop.name}
              </div>

              {/* Custom Mini Tooltip on Hover */}
              {isHovered && !isSelected && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white p-2.5 rounded-xl border border-stone-800 shadow-xl z-50 w-44 pointer-events-none flex flex-col gap-0.5">
                  <div className="font-bold text-xs text-stone-100">{shop.name}</div>
                  <div className="text-[10px] text-stone-400">{shop.address}</div>
                  <div className="h-px bg-stone-800 my-1"></div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-400 font-semibold">{shop.distance} miles away</span>
                    <span className={`font-semibold ${shop.busyStatus === 'low' ? 'text-emerald-400' : shop.busyStatus === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {shop.waitTimeMinutes}m wait
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
