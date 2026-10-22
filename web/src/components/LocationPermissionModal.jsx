import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Shield, Compass, CheckCircle2, X } from 'lucide-react';

export default function LocationPermissionModal({
  onGrantPermission,
  onDenyPermission,
  userLocation,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [permissionChoice, setPermissionChoice] = useState('while_using'); // 'while_using' | 'always' | 'never'

  useEffect(() => {
    // Check if permission has already been handled in localStorage
    const saved = localStorage.getItem('roadwatch_location_pref');
    if (!saved && !userLocation) {
      // Show prompt after a short 500ms delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [userLocation]);

  const handleConfirm = () => {
    localStorage.setItem('roadwatch_location_pref', permissionChoice);
    setIsVisible(false);

    if (permissionChoice === 'never') {
      onDenyPermission?.();
    } else {
      // Trigger native browser / device geolocation fetch
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onGrantPermission({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              preference: permissionChoice,
            });
          },
          (err) => {
            console.warn('Browser geolocation denied or unavailable:', err.message);
            onDenyPermission?.();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        onDenyPermission?.();
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDenyPermission?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-slate-700/80 animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Location Access Permission</h3>
              <p className="text-[11px] text-slate-400">RoadWatch Road Quality & Hazard Monitor</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Value Proposition */}
        <div className="my-4 space-y-2">
          <p className="text-xs text-slate-200 leading-relaxed">
            To automatically open your <strong>local city map</strong>, display nearby road potholes, and enable 1-tap geotagging, please select your location preference:
          </p>

          {/* Three Options matching iOS / Android OS standards */}
          <div className="space-y-2 pt-2">
            {[
              {
                id: 'while_using',
                title: 'Allow While Using App / Website',
                desc: 'Only fetches GPS when app is active. Saves battery and centers on your local city.',
                recommended: true,
              },
              {
                id: 'always',
                title: 'Always Allow (Background Radar Alert)',
                desc: 'Alerts you of hazardous craters ahead even when screen is locked.',
              },
              {
                id: 'never',
                title: 'Don’t Allow / Search Manually',
                desc: 'Browse by manually typing cities, towns, or villages into the search bar.',
              },
            ].map((option) => (
              <label
                key={option.id}
                onClick={() => setPermissionChoice(option.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  permissionChoice === option.id
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="location_perm"
                  checked={permissionChoice === option.id}
                  onChange={() => setPermissionChoice(option.id)}
                  className="mt-0.5 accent-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{option.title}</span>
                    {option.recommended && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-800"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Confirm & Open Local Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}
