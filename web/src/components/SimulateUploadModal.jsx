import React, { useState } from 'react';
import { X, Smartphone, Camera, MapPin, Send, AlertCircle } from 'lucide-react';

export default function SimulateUploadModal({ isOpen, onClose, onSimulate }) {
  const [severity, setSeverity] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSimulate = (e) => {
    e.preventDefault();

    // Randomize nearby coordinates around city center
    const baseLat = 28.6139;
    const baseLng = 77.2090;
    const offsetLat = (Math.random() - 0.5) * 0.04;
    const offsetLng = (Math.random() - 0.5) * 0.04;

    const newReport = {
      id: `live-pot-${Date.now()}`,
      latitude: +(baseLat + offsetLat).toFixed(5),
      longitude: +(baseLng + offsetLng).toFixed(5),
      severity,
      title: title.trim() || `${severity.toUpperCase()} Road Crater Reported`,
      description: description.trim() || 'Simulated real-time upload from mobile phone with GPS geotag.',
      photoUrl:
        severity === 'high'
          ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80'
          : severity === 'medium'
          ? 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
      reportedAt: new Date().toISOString(),
      status: 'active',
      upvotes: 1,
      confirmations: 1,
      address: `Sector ${(Math.floor(Math.random() * 20) + 1)} Main Boulevard`,
      reportedBy: 'Mobile App User (Live)',
    };

    onSimulate(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Simulate Mobile Upload</h3>
              <p className="text-[11px] text-slate-400">Trigger live map fly-to & radar animation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSimulate} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Select Pothole Severity:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', label: '🔴 Severe', border: 'border-red-500/60', text: 'text-red-400' },
                { id: 'medium', label: '🟠 Moderate', border: 'border-amber-500/60', text: 'text-amber-400' },
                { id: 'low', label: '🟡 Minor', border: 'border-yellow-500/60', text: 'text-yellow-400' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSeverity(item.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all text-center ${
                    severity === item.id
                      ? `bg-slate-800 ${item.border} ${item.text} shadow-md`
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Title / Street Landmark:
            </label>
            <input
              type="text"
              placeholder="e.g. Broken culvert near Metro Pillar 142"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Description / Impact:
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deep hole formed after recent waterlogging."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-300 leading-relaxed">
              When triggered, the map will instantly pan across the city to the GPS location and fire the animated pulsing radar rings.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Upload</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
