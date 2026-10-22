import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  Upload,
  AlertTriangle,
  ThumbsUp,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  SwitchCamera,
  Compass
} from 'lucide-react';
import { getDistanceInMeters } from '../utils/audioRadar';

const SAMPLE_CRATERS = [
  {
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
    title: 'Severe Rim-Bender Crater',
    severity: 'high'
  },
  {
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
    title: 'Sunken Asphalt Dip',
    severity: 'medium'
  },
  {
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    title: 'Surface Alligator Cracking',
    severity: 'low'
  }
];

export default function CameraReportModal({
  isOpen,
  onClose,
  userLocation,
  potholes = [],
  onUploadPothole,
  onUpvotePothole,
}) {
  const [severity, setSeverity] = useState('high');
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_CRATERS[0].url);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeCoords, setActiveCoords] = useState(null);
  const [bypassProximity, setBypassProximity] = useState(false);
  const [upvoteSuccess, setUpvoteSuccess] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize GPS Coordinates and check 10m proximity
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setBypassProximity(false);
      setUpvoteSuccess(false);
      return;
    }

    if (userLocation) {
      setActiveCoords(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setActiveCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 4),
          });
        },
        (err) => {
          console.warn('Geolocation lookup in modal failed, using fallback:', err);
          setActiveCoords({ lat: 28.6139, lng: 77.2090, accuracy: 5 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setActiveCoords({ lat: 28.6139, lng: 77.2090, accuracy: 5 });
    }
  }, [isOpen, userLocation]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!isOpen) return null;

  // 10-METER PROXIMITY CALCULATION (Anti-Spam & Deduplication)
  let nearbyPothole = null;
  let nearbyDistance = null;

  if (activeCoords && !bypassProximity) {
    for (const p of potholes) {
      if (p.status === 'fixed') continue;
      const dist = getDistanceInMeters(activeCoords.lat, activeCoords.lng, p.latitude, p.longitude);
      if (dist <= 10) { // 10-meter strict anti-spam radius
        if (!nearbyPothole || dist < nearbyDistance) {
          nearbyPothole = p;
          nearbyDistance = dist;
        }
      }
    }
  }

  // Camera stream controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      alert('Unable to access live camera stream. You can upload a photo file or select a sample image instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUri);
    setPhotoUrl(dataUri);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target?.result);
        setPhotoUrl(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpvoteExisting = () => {
    if (!nearbyPothole) return;
    onUpvotePothole(nearbyPothole.id);
    setUpvoteSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleSubmitNew = (e) => {
    e.preventDefault();
    if (!activeCoords) return;

    setIsSubmitting(true);

    const lat = activeCoords.lat;
    const lng = activeCoords.lng;

    const newReport = {
      id: `pothole-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      latitude: lat,
      longitude: lng,
      severity,
      title: `${severity.toUpperCase()} Road Crater Reported`,
      description: description.trim() || `Pothole detected via mobile camera geotag (precision: ±${activeCoords.accuracy || 3}m).`,
      photoUrl: photoUrl || SAMPLE_CRATERS[0].url,
      reportedAt: new Date().toISOString(),
      status: 'reported',
      upvotes: 1,
      confirmations: 1,
      address: `Near GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      reportedBy: 'Citizen Geotagger'
    };

    onUploadPothole(newReport);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Geotagged Pothole Report</h3>
              <p className="text-xs text-slate-400">Live GPS camera capture & deduplication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Coordinates HUD */}
        {activeCoords && (
          <div className="my-3.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
              <div>
                <span className="font-mono font-bold text-white">
                  {activeCoords.lat.toFixed(5)}, {activeCoords.lng.toFixed(5)}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">
                  (Precision: ±{activeCoords.accuracy || 3}m)
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] border border-emerald-500/30 flex items-center gap-1">
              <Compass className="w-2.5 h-2.5" /> GPS Locked
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENARIO 1: EXISTING POTHOLE FOUND WITHIN 10 METERS      */}
        {/* Anti-spam & community upvote flow                         */}
        {/* ======================================================== */}
        {nearbyPothole ? (
          <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-amber-300">
                  Hazard Already Reported Here (~{nearbyDistance}m away)!
                </h4>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Our anti-spam system found an existing active report within a 10-meter radius. To prevent duplicate clutter on the city map, please confirm this hazard with your vote to increase repair urgency!
                </p>
              </div>
            </div>

            {/* Existing Hazard Preview Card */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <img
                src={nearbyPothole.photoUrl}
                alt="Existing Crater"
                className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                      nearbyPothole.severity === 'high'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : nearbyPothole.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {nearbyPothole.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {nearbyPothole.address || 'Roadway'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate">{nearbyPothole.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirmed by <strong>{nearbyPothole.confirmations || 1} commuters</strong>
                </p>
              </div>
            </div>

            {/* Upvote Button or Success Message */}
            {upvoteSuccess ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! Hazard confirmed & upvoted (+1). Closing...</span>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={handleUpvoteExisting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Upvote & Confirm This Hazard (+1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBypassProximity(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline whitespace-nowrap px-2"
                >
                  Report distinct hazard
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* SCENARIO 2: NO POTHOLE WITHIN 10M - NEW REPORT FLOW      */
          /* ======================================================== */
          <form onSubmit={handleSubmitNew} className="space-y-4 my-3">
            
            {/* Camera Viewfinder / Photo Selector */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[16/10] flex items-center justify-center group">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshairs HUD */}
                  <div className="absolute inset-4 border border-rose-500/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between text-[10px] font-mono text-rose-400 bg-black/50 px-2 py-0.5 rounded backdrop-blur">
                      <span>AUTO-FOCUS</span>
                      <span>10M GEO-FENCE</span>
                    </div>
                    <div className="self-center w-8 h-8 border-2 border-rose-500/80 rounded-full animate-ping" />
                    <div className="text-center text-[10px] font-mono text-emerald-400 bg-black/50 py-0.5 rounded backdrop-blur">
                      AIM AT CRATER BASE
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="absolute bottom-3 py-1.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <Camera className="w-3.5 h-3.5" /> Snap Photo
                  </button>
                </>
              ) : (
                <>
                  <img
                    src={photoUrl}
                    alt="Road Hazard"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-slate-300 backdrop-blur">
                        GPS Timestamped
                      </span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1 transition"
                      >
                        <SwitchCamera className="w-3 h-3" /> Live Camera
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {SAMPLE_CRATERS.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setPhotoUrl(s.url);
                              setCapturedPhoto(null);
                              setSeverity(s.severity);
                            }}
                            className={`w-7 h-7 rounded-md border-2 overflow-hidden transition ${
                              photoUrl === s.url ? 'border-amber-400 scale-110' : 'border-slate-700 opacity-60'
                            }`}
                          >
                            <img src={s.url} alt="sample" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                      >
                        <Upload className="w-3 h-3" /> Upload
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Severity Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Severity Level:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'high', label: '🔴 Severe', desc: '> 10cm depth' },
                  { id: 'medium', label: '🟠 Moderate', desc: '4-10cm depth' },
                  { id: 'low', label: '🟡 Minor', desc: '< 4cm crack' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSeverity(item.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      severity === item.id
                        ? 'bg-slate-800 border-rose-500 text-white shadow-md'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Landmark / Notes */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Landmark / Note (Optional):
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Center lane right after the flyover"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Publish Geotagged Pothole</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
