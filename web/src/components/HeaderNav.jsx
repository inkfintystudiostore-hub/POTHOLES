import React from 'react';
import { Radio, Layers, Smartphone, PlusCircle, LocateFixed, Car, Volume2, VolumeX, Route } from 'lucide-react';
import LocationSearch from './LocationSearch';

export default function HeaderNav({
  stats,
  activeFilter,
  onFilterChange,
  mapStyle,
  onMapStyleChange,
  isPhoneOpen,
  onTogglePhone,
  onTriggerSimulation,
  onSelectLocation,
  onLocateMe,
  userLocation,
  isDriving,
  onToggleDrive,
  isMuted,
  onToggleMute,
  onOpenRouteScanner,
  hasActiveRoutes,
}) {
  return (
    <header className="absolute top-4 left-4 right-4 z-[1000] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Location Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        {/* Brand Chip */}
        <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                RoadWatch <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">RADAR</span>
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] font-semibold text-emerald-400 tracking-wider">
                  {isDriving ? 'DRIVE MODE RADAR ACTIVE' : 'LIVE ROAD RADAR'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Locate Button */}
          <button
            onClick={onLocateMe}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            title="Center on My Location"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>

        {/* Global Autocomplete Location Search */}
        <LocationSearch onSelectLocation={onSelectLocation} />
      </div>

      {/* Action Controls & Severity Filters */}
      <div className="glass-panel rounded-2xl px-3 py-1.5 pointer-events-auto flex items-center justify-between xl:justify-end gap-2 overflow-x-auto shadow-xl">
        {/* Safe Route Scanner Button */}
        <button
          onClick={onOpenRouteScanner}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md whitespace-nowrap ${
            hasActiveRoutes
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/30'
              : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-500/30'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>{hasActiveRoutes ? 'Routes Active (96% Safe)' : 'Safe Route Scanner'}</span>
        </button>

        {/* Drive Simulation Toggle */}
        <button
          onClick={onToggleDrive}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md whitespace-nowrap ${
            isDriving
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/30 animate-pulse'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>{isDriving ? 'Stop Drive' : 'Drive Radar'}</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title={isMuted ? 'Unmute Audio Warning' : 'Mute Audio Warning'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Map Layers */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
          {[
            { id: 'streets', label: 'Streets' },
            { id: 'dark', label: 'Dark' },
            { id: 'satellite', label: 'Satellite' },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => onMapStyleChange(style.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                mapStyle === style.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Severity & Status Filters */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'high', label: `🔴 (${stats.high})` },
            { id: 'medium', label: `🟠 (${stats.medium})` },
            { id: 'fixed', label: `🟢 Fixed (${stats.fixed || 0})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                activeFilter === item.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Toggle Mobile Phone */}
        <button
          onClick={onTogglePhone}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
            isPhoneOpen
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPhoneOpen ? 'Hide Phone' : 'Show Phone'}</span>
        </button>

        {/* Quick Report */}
        <button
          onClick={onTriggerSimulation}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-500/25 hover:from-red-500 hover:to-rose-500 transition-all active:scale-95 whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>
    </header>
  );
}
