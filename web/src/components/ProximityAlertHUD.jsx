import React from 'react';
import { AlertTriangle, Volume2, VolumeX, ShieldAlert, Navigation2, Check } from 'lucide-react';

export default function ProximityAlertHUD({
  alert,
  onDismiss,
  isMuted,
  onToggleMute,
}) {
  if (!alert) return null;

  const isSevere = alert.severity === 'high';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2500] w-[calc(100vw-32px)] max-w-lg animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
      <div
        className={`rounded-3xl p-4 shadow-2xl border-2 backdrop-blur-xl flex items-center justify-between gap-4 ${
          isSevere
            ? 'bg-red-950/90 border-red-500 shadow-red-500/30'
            : 'bg-amber-950/90 border-amber-500 shadow-amber-500/30'
        }`}
      >
        {/* Pulsing Radar Alert Badge */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border relative ${
            isSevere
              ? 'bg-red-600/30 border-red-400 text-red-400'
              : 'bg-amber-600/30 border-amber-400 text-amber-400'
          }`}
        >
          <span
            className={`absolute inset-0 rounded-2xl animate-ping ${
              isSevere ? 'bg-red-500/40' : 'bg-amber-500/40'
            }`}
          />
          <AlertTriangle className="w-6 h-6 animate-bounce" />
        </div>

        {/* Hazard Information & Distance Meter */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isSevere
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-900'
              }`}
            >
              {isSevere ? 'CRATER RADAR WARNING' : 'ROAD DIP WARNING'}
            </span>
            <span className="text-xs font-mono font-black text-white">
              {alert.distance}m AHEAD
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white truncate mt-1">
            {alert.title}
          </h3>

          <p className="text-[11px] text-slate-300 truncate">
            {isSevere
              ? 'High rim and suspension damage hazard in center lane!'
              : 'Uneven asphalt dip. Reduce speed.'}
          </p>
        </div>

        {/* Controls: Mute & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            title={isMuted ? 'Unmute Radar Alert' : 'Mute Radar Alert'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onDismiss}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 transition-colors flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Passed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
