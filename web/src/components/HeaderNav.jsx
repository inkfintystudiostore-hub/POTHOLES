import React from 'react';
import { Radio, LocateFixed, Menu, SlidersHorizontal, Flame, Sparkles } from 'lucide-react';
import LocationSearch from './LocationSearch';

export default function HeaderNav({
  stats,
  activeFilter,
  onFilterChange,
  onSelectLocation,
  onLocateMe,
  userLocation,
  isLiveConnected,
  onOpenDrawer,
}) {
  return (
    <header className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pointer-events-none">
      
      {/* Left: Brand + Search */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Brand Pill */}
        <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              RoadWatch
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                LIVE
              </span>
            </h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-semibold text-emerald-400 tracking-wider">
                {isLiveConnected ? 'CLOUD SYNC ON' : 'ROAD RADAR'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Autocomplete Location Search */}
        <div className="flex-1 sm:w-64">
          <LocationSearch onSelectLocation={onSelectLocation} />
        </div>
      </div>

      {/* Right: Filters + Re-center + Features Menu */}
      <div className="glass-panel rounded-2xl px-2.5 py-1.5 pointer-events-auto flex items-center justify-between md:justify-end gap-1.5 shadow-xl">
        
        {/* Severity Filters */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'high', label: `🔴 (${stats.high})` },
            { id: 'medium', label: `🟠 (${stats.medium})` },
            { id: 'fixed', label: `🟢 (${stats.fixed || 0})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === item.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-700/60 mx-1 hidden sm:block" />

        {/* Locate Me Button */}
        <button
          onClick={onLocateMe}
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Center on My Location"
        >
          <LocateFixed className="w-4 h-4" />
        </button>

        {/* Open Features Slide-Out Drawer */}
        <button
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold shadow transition"
          title="Open Features & Tools Menu"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Features</span>
          {isLiveConnected && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          )}
        </button>

      </div>
    </header>
  );
}
