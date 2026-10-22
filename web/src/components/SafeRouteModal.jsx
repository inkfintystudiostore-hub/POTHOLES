import React, { useState } from 'react';
import { X, Navigation, ShieldCheck, AlertTriangle, ArrowRight, Sparkles, Check, Car, Compass } from 'lucide-react';

const PRESET_DESTINATIONS = [
  {
    name: 'City Commercial Hub',
    lat: 28.6380,
    lng: 77.2285,
  },
  {
    name: 'Airport Expressway Terminal',
    lat: 28.5562,
    lng: 77.1000,
  },
  {
    name: 'Cyber City Tech Park',
    lat: 28.4950,
    lng: 77.0890,
  },
];

export default function SafeRouteModal({
  isOpen,
  onClose,
  onCalculateRoutes,
  routes,
  selectedRouteId,
  onSelectRoute,
  userLocation,
}) {
  const [destination, setDestination] = useState(PRESET_DESTINATIONS[0]);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleScan = async (dest) => {
    setIsScanning(true);
    const startLoc = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 28.6139, lng: 77.2090 };

    await onCalculateRoutes(startLoc, dest);
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl border-2 border-slate-700/80 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Safe Route & Road Quality Scanner</h3>
              <p className="text-[11px] text-slate-400">Pothole avoidance & suspension protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Origin & Destination Selector */}
        <div className="mt-4 p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-slate-400 font-semibold w-12">Start:</span>
            <span className="text-white font-bold truncate">
              {userLocation ? 'Your Current GPS Location' : 'Central Urban Sector'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-400 font-semibold w-12">Target:</span>
            <span className="text-white font-bold truncate">{destination.name}</span>
          </div>
        </div>

        {/* Preset Destination Pills */}
        <div className="mt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            SAMPLE COMMUTE DESTINATIONS:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_DESTINATIONS.map((dest) => (
              <button
                key={dest.name}
                type="button"
                onClick={() => {
                  setDestination(dest);
                  handleScan(dest);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  destination.name === dest.name
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Button (if not yet scanned) */}
        {(!routes || routes.length === 0) && (
          <button
            onClick={() => handleScan(destination)}
            disabled={isScanning}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            {isScanning ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scan Road Quality Between Routes</span>
              </>
            )}
          </button>
        )}

        {/* Route A vs Route B Comparison Cards */}
        {routes && routes.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>ROUTE ALTERNATIVES COMPARED:</span>
              <span className="text-[11px] text-emerald-400 mono">Pothole scan verified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {routes.map((r) => {
                const isSelected = selectedRouteId === r.id;
                const isSafe = r.isRecommended;

                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectRoute(r.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? isSafe
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/20'
                          : 'bg-red-950/40 border-red-500 shadow-xl shadow-red-500/20'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Recommended Badge */}
                    {isSafe && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Recommended</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">{r.name}</span>
                      <span
                        className={`text-xs font-black mono px-2 py-0.5 rounded-lg ${
                          isSafe
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {r.smoothnessScore}% Smooth
                      </span>
                    </div>

                    {/* Stats Metric Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Distance & Time</div>
                        <div className="text-xs font-bold text-white mono mt-0.5">
                          {r.distanceKm} km • {r.durationMin}m
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Road Hazards</div>
                        <div
                          className={`text-xs font-bold mono mt-0.5 ${
                            r.highHazards > 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {r.highHazards > 0 ? `${r.highHazards} Craters` : '0 Craters'}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                      {isSafe
                        ? '🟢 Clean asphalt corridor. Smooth ride, zero high-impact craters.'
                        : '🔴 Contains 3 deep axle-breaking craters. High risk of rim and tire damage.'}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoute(r.id);
                        onClose();
                      }}
                      className={`mt-3 w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        isSafe
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Active Route Selected' : 'Navigate This Route'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
