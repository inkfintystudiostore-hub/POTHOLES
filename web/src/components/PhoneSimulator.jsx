import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Navigation, ThumbsUp, X, RefreshCw, Radio, Check, ChevronRight, ShieldAlert, Sparkles, Cpu, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const PRESET_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
    title: 'Deep Rim-Bender Crater',
    severity: 'high',
    confidence: '96.4%',
    depthCm: '14.2 cm',
    damageType: 'Base Course Collapse',
    severityLabel: 'HIGH SEVERITY',
  },
  {
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
    title: 'Sunken Asphalt Dip',
    severity: 'medium',
    confidence: '92.1%',
    depthCm: '6.5 cm',
    damageType: 'Sub-grade Settlement',
    severityLabel: 'MODERATE DIP',
  },
  {
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    title: 'Surface Alligator Cracks',
    severity: 'low',
    confidence: '88.7%',
    depthCm: '2.1 cm',
    damageType: 'Thermal Surface Wear',
    severityLabel: 'MINOR WEAR',
  },
];

export default function PhoneSimulator({
  potholes,
  onUploadPothole,
  isOpen,
  onToggle,
  onSelectPothole,
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'map' or 'camera'
  const [severity, setSeverity] = useState('high');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 28.6189, lng: 77.2140 });
  const [useWebcam, setUseWebcam] = useState(false);
  const [aiOverlayActive, setAiOverlayActive] = useState(true); // AI Vision HUD enabled by default
  const videoRef = useRef(null);

  const activePreset = PRESET_PHOTOS[selectedPhotoIndex];

  // Randomize GPS location
  const randomizeGPS = () => {
    const latOffset = (Math.random() - 0.5) * 0.035;
    const lngOffset = (Math.random() - 0.5) * 0.035;
    setUserCoords({
      lat: +(28.6139 + latOffset).toFixed(5),
      lng: +(77.2090 + lngOffset).toFixed(5),
    });
  };

  // Webcam stream management
  useEffect(() => {
    let stream = null;
    if (useWebcam && activeTab === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Webcam permission not granted:', err);
          setUseWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam, activeTab]);

  const handleCaptureAndSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const activePhoto = PRESET_PHOTOS[selectedPhotoIndex];
      const newPothole = {
        id: `phone-pot-${Date.now()}`,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        severity,
        title: notes.trim() || activePhoto.title,
        description: `Verified by AI Vision (${activePhoto.confidence} conf, ${activePhoto.depthCm} depth). Geotagged at ${userCoords.lat}, ${userCoords.lng}.`,
        photoUrl: activePhoto.url,
        reportedAt: new Date().toISOString(),
        status: 'reported',
        upvotes: 1,
        confirmations: 1,
        address: `Road Segment at ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`,
        reportedBy: 'AI RoadWatch Inspector',
      };

      onUploadPothole(newPothole);
      setIsSubmitting(false);
      setNotes('');
      randomizeGPS();
      setActiveTab('map');
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-[1200] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-2xl shadow-blue-500/40 border border-blue-400/30 transition-transform active:scale-95"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span>📱 Open Mobile App Simulator</span>
      </button>
    );
  }

  return (
    <aside className="fixed top-20 left-4 bottom-4 z-[1200] w-[340px] sm:w-[380px] flex flex-col glass-panel rounded-[38px] p-3 border-2 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left duration-300">
      {/* Phone Top Notch / Dynamic Island */}
      <div className="relative pt-2 pb-2 px-4 flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-800">
        <span className="mono">09:41</span>
        <div className="w-24 h-4 rounded-full bg-black/90 flex items-center justify-center gap-1.5 border border-slate-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">ROADWATCH</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-mono">5G</span>
          <button
            onClick={onToggle}
            className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            title="Minimize Phone"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Internal Mobile Screen Body */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-[28px] mt-2 border border-slate-800">
        {/* Sub-Screen: Camera Viewfinder */}
        {activeTab === 'camera' ? (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-black/95 relative overflow-y-auto">
            {/* Live GPS & AI Status Header */}
            <div className="bg-slate-900/95 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between z-20 shadow-md">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>GPS LOCK (±3m) • AI SCANNER ACTIVE</span>
                </div>
                <div className="text-xs font-bold text-white mono mt-0.5">
                  {userCoords.lat.toFixed(5)}°, {userCoords.lng.toFixed(5)}°
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* AI HUD Toggle */}
                <button
                  onClick={() => setAiOverlayActive(!aiOverlayActive)}
                  className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                    aiOverlayActive
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle AI Vision HUD"
                >
                  <Cpu className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={randomizeGPS}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Shift GPS Location"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Viewfinder with Augmented Reality AI Overlays */}
            <div className="relative my-2 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border-2 border-slate-800 flex items-center justify-center group shadow-inner">
              {useWebcam ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <img
                  src={activePreset.url}
                  alt="Hazard Viewfinder"
                  className="w-full h-full object-cover"
                />
              )}

              {/* SMART AI VISION HUD OVERLAY */}
              {aiOverlayActive && (
                <>
                  {/* Vertical Laser Scanline */}
                  <div className="ai-scan-laser" />

                  {/* Augmented Bounding Box Locked on Pothole */}
                  <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-cyan-400/90 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                    {/* Bounding Box Corner Brackets */}
                    <div className="flex justify-between items-start">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 -mt-2 -ml-2" />
                      <div className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-400/50 text-[9px] font-black text-cyan-300 mono flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-spin" />
                        <span>POTHOLE IDENTIFIED ({activePreset.confidence})</span>
                      </div>
                      <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 -mt-2 -mr-2" />
                    </div>

                    {/* Depth & Severity Telemetry */}
                    <div className="flex justify-between items-end">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 -mb-2 -ml-2" />
                      <div className="px-2.5 py-1 rounded-lg bg-black/85 border border-cyan-400/40 text-[9px] font-mono text-white flex items-center gap-2 shadow-lg">
                        <span className="text-red-400 font-bold">DEPTH: ~{activePreset.depthCm}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-amber-300 font-bold">{activePreset.damageType}</span>
                      </div>
                      <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 -mb-2 -mr-2" />
                    </div>
                  </div>

                  {/* AUTOMATED PRIVACY SHIELD: BLURRED NUMBER PLATE */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/80 pointer-events-none flex items-center gap-1.5 shadow-md">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[8px] font-mono text-emerald-300 font-bold uppercase">
                      [BLURRED] PLATE #DL-3C-****
                    </span>
                  </div>

                  {/* PRIVACY SHIELD: BLURRED FACE OVERLAY */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/80 pointer-events-none flex items-center gap-1 text-[8px] font-mono text-emerald-300 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>[MASKED] BYSTANDER FACE</span>
                  </div>
                </>
              )}

              {/* Watermark GPS */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white mono flex items-center gap-1 pointer-events-none">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>{userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Preset Photo Selector */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>SELECT ROAD HAZARD PHOTO:</span>
                <button
                  onClick={() => setUseWebcam(!useWebcam)}
                  className="text-blue-400 hover:underline font-bold"
                >
                  {useWebcam ? 'Sample Images' : 'Live Webcam'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_PHOTOS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoIndex(idx);
                      setSeverity(item.severity);
                      setUseWebcam(false);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all ${
                      selectedPhotoIndex === idx && !useWebcam
                        ? 'border-blue-500 scale-102 shadow-md shadow-blue-500/30'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggested Severity Buttons */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>AI SUGGESTED SEVERITY:</span>
                <span className="text-cyan-400 font-mono text-[9px]">{activePreset.severityLabel}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'high', label: '🔴 Severe', border: 'border-red-500/80', bg: 'bg-red-500/20 text-red-300' },
                  { id: 'medium', label: '🟠 Moderate', border: 'border-amber-500/80', bg: 'bg-amber-500/20 text-amber-300' },
                  { id: 'low', label: '🟡 Minor', border: 'border-yellow-500/80', bg: 'bg-yellow-500/20 text-yellow-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSeverity(item.id)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                      severity === item.id
                        ? `${item.border} ${item.bg} shadow-md`
                        : 'border-slate-800 text-slate-400 bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shutter / Upload Button */}
            <button
              onClick={handleCaptureAndSubmit}
              disabled={isSubmitting}
              className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo & Geotag</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Sub-Screen: Mobile Road Map & Hazard List */
          <div className="flex-1 flex flex-col p-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-extrabold text-white">Active Road Hazards</span>
              <span className="text-[10px] text-slate-400 mono">{potholes.length} nearby</span>
            </div>

            <div className="mt-2 space-y-2 flex-1">
              {potholes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectPothole(item)}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 cursor-pointer transition-all flex items-center gap-2.5 group"
                >
                  <img
                    src={item.photoUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          item.status === 'fixed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.severity === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : item.severity === 'medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {item.status === 'fixed' ? 'FIXED (✓)' : item.severity.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-slate-400 mono">{item.upvotes || 0} upvotes</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate mt-1 group-hover:text-blue-400">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mono truncate">
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('camera')}
              className="mt-2 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Report Another Pothole</span>
            </button>
          </div>
        )}

        {/* Bottom Phone Tab Bar */}
        <div className="h-12 bg-black border-t border-slate-800 flex items-center justify-around px-4">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'map' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span className="text-[9px]">Road Map</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'camera' ? 'text-red-400 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white -mt-4 shadow-lg shadow-red-600/50 border-2 border-black">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[9px]">Camera HUD</span>
          </button>

          <button
            onClick={randomizeGPS}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-300"
            title="Randomize Location"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[9px]">Location</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
