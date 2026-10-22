import React from 'react';
import {
  X,
  Route,
  Car,
  Volume2,
  VolumeX,
  Layers,
  Flame,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';

export default function FeatureDrawer({
  isOpen,
  onClose,
  stats,
  mapStyle,
  onMapStyleChange,
  isDriving,
  onToggleDrive,
  isMuted,
  onToggleMute,
  onOpenRouteScanner,
  hasActiveRoutes,
  isLiveConnected,
  onOpenFirebaseSync,
  isPhoneOpen,
  onTogglePhone,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2200] flex justify-end pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[#0b1120] border-l border-slate-800 h-full p-6 text-white shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-250">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Features & Settings</span>
              </h2>
              <p className="text-xs text-slate-400">Road tools, navigation & cloud sync</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Road Health Stats Pill */}
          <div className="my-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>City Road Health</span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {stats.fixed} Repaired ({Math.round((stats.fixed / Math.max(stats.total, 1)) * 100)}%)
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-base font-black text-red-400">{stats.high}</div>
                <div className="text-[10px] text-slate-400 font-medium">Severe</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-base font-black text-amber-400">{stats.medium}</div>
                <div className="text-[10px] text-slate-400 font-medium">Moderate</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-base font-black text-emerald-400">{stats.fixed}</div>
                <div className="text-[10px] text-slate-400 font-medium">Patched</div>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Navigation & Detection Tools
            </p>

            {/* Safe Route Scanner */}
            <button
              onClick={() => {
                onOpenRouteScanner();
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    Safe Route Scanner
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {hasActiveRoutes ? '96% Clean Bypass Active' : 'Compare Route A vs B road quality'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Drive Mode Radar */}
            <button
              onClick={() => {
                onToggleDrive();
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                  isDriving
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                    {isDriving ? 'Stop Drive Radar' : 'Drive Radar Mode'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Proximity audio & vibration chimes within 120m
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Audio Warnings Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Audio Radar Warning</h4>
                  <p className="text-[11px] text-slate-400">{isMuted ? 'Muted' : 'Sound Synthesizer Active'}</p>
                </div>
              </div>
              <button
                onClick={onToggleMute}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isMuted ? 'Unmute' : 'Active'}
              </button>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 pt-3">
              Settings & Integrations
            </p>

            {/* Firebase Cloud Sync */}
            <button
              onClick={() => {
                onOpenFirebaseSync();
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                  isLiveConnected
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                    Cloud Real-Time Sync
                    {isLiveConnected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isLiveConnected ? 'Connected to Cloud Firestore' : 'Configure Firebase ($0 Spark)'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Map Style Theme */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Map Layer Theme:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {[
                  { id: 'streets', label: 'Streets' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'satellite', label: 'Satellite' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => onMapStyleChange(style.id)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      mapStyle === style.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Simulator Toggle */}
            <button
              onClick={() => {
                onTogglePhone();
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Embedded Mobile Phone</h4>
                  <p className="text-[11px] text-slate-400">
                    {isPhoneOpen ? 'Hide phone frame' : 'Show phone frame on screen'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>RoadWatch v2.0</span>
          <span>100% Free Open Platform</span>
        </div>

      </div>
    </div>
  );
}
