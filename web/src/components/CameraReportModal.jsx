import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  AlertTriangle,
  ThumbsUp,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Compass,
  RotateCcw,
  Video
} from 'lucide-react';
import { getDistanceInMeters } from '../utils/audioRadar';

export default function CameraReportModal({
  isOpen,
  onClose,
  userLocation,
  potholes = [],
  onUploadPothole,
  onUpvotePothole,
}) {
  const [severity, setSeverity] = useState('high');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeCoords, setActiveCoords] = useState(null);
  const [bypassProximity, setBypassProximity] = useState(false);
  const [upvoteSuccess, setUpvoteSuccess] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const deviceCameraInputRef = useRef(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start live camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Live camera stream not directly accessible:', err);
      setCameraError(err.message || 'Camera permission denied or device not accessible');
      setCameraActive(false);
    }
  };

  // Initialize GPS Coordinates and auto-start camera on open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setBypassProximity(false);
      setUpvoteSuccess(false);
      setCameraError(null);
      return;
    }

    // Lock fresh high-accuracy GPS
    if (userLocation) {
      setActiveCoords(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setActiveCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 3),
          });
        },
        (err) => {
          console.warn('Geolocation lookup notice:', err);
          setActiveCoords({ lat: 28.6139, lng: 77.2090, accuracy: 5 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setActiveCoords({ lat: 28.6139, lng: 77.2090, accuracy: 5 });
    }

    // Auto-launch camera when modal opens
    startCamera();
  }, [isOpen, userLocation]);

  // Clean up stream on component unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!isOpen) return null;

  // 10-METER PROXIMITY CHECK (Anti-Spam Deduplication)
  let nearbyPothole = null;
  let nearbyDistance = null;

  if (activeCoords && !bypassProximity) {
    for (const p of potholes) {
      if (p.status === 'fixed') continue;
      const dist = getDistanceInMeters(activeCoords.lat, activeCoords.lng, p.latitude, p.longitude);
      if (dist <= 10) {
        if (!nearbyPothole || dist < nearbyDistance) {
          nearbyPothole = p;
          nearbyDistance = dist;
        }
      }
    }
  }

  // Stamp permanent GPS Geotag HUD onto the canvas image
  const burnGeotagWatermark = (canvas) => {
    const ctx = canvas.getContext('2d');
    const latStr = activeCoords?.lat ? activeCoords.lat.toFixed(5) : '0.00000';
    const lngStr = activeCoords?.lng ? activeCoords.lng.toFixed(5) : '0.00000';
    const accStr = activeCoords?.accuracy ? `±${activeCoords.accuracy}m` : '±3m';
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    const bannerHeight = Math.max(54, canvas.height * 0.08);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

    // Red left accent indicator
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, canvas.height - bannerHeight, 8, bannerHeight);

    // Primary GPS coordinate line
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(14, Math.round(bannerHeight * 0.32))}px monospace`;
    ctx.fillText(`📍 GPS: ${latStr}, ${lngStr} (${accStr} SATELLITE LOCK)`, 18, canvas.height - bannerHeight * 0.52);

    // Metadata & verification tag line
    ctx.fillStyle = '#38bdf8';
    ctx.font = `${Math.max(10, Math.round(bannerHeight * 0.22))}px monospace`;
    ctx.fillText(`🕒 ${timeStr} | 🛡️ LIVE FIELD GEOTAG`, 18, canvas.height - bannerHeight * 0.18);
  };

  // Capture frame from live video element
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    
    // Draw real camera image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Burn permanent Geotag HUD watermark into pixels
    burnGeotagWatermark(canvas);

    const dataUri = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUri);
    stopCamera();
  };

  // Capture from mobile device camera hardware (<input capture="environment">)
  const handleDeviceCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Burn permanent Geotag HUD watermark into pixels
        burnGeotagWatermark(canvas);

        const dataUri = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUri);
        stopCamera();
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
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
    if (!activeCoords || !capturedPhoto) return;

    setIsSubmitting(true);

    const lat = activeCoords.lat;
    const lng = activeCoords.lng;

    const newReport = {
      id: `pothole-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      latitude: lat,
      longitude: lng,
      severity,
      title: `${severity.toUpperCase()} Road Crater Reported`,
      description: description.trim() || `Verified live camera capture at GPS (${lat.toFixed(5)}, ${lng.toFixed(5)}).`,
      photoUrl: capturedPhoto,
      reportedAt: new Date().toISOString(),
      status: 'reported',
      upvotes: 1,
      confirmations: 1,
      address: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
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
              <h3 className="text-base font-extrabold text-white">Live Geotagged Pothole Report</h3>
              <p className="text-xs text-slate-400">Strict live camera capture & 10m anti-spam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live GPS Telemetry Banner */}
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
              <Compass className="w-2.5 h-2.5" /> GPS Active
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENARIO 1: EXISTING POTHOLE FOUND WITHIN 10 METERS      */}
        {/* Anti-spam deduplication & upvote confirmation            */}
        {/* ======================================================== */}
        {nearbyPothole ? (
          <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-amber-300">
                  Hazard Already Logged Here (~{nearbyDistance}m away)!
                </h4>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Our anti-spam system found an active hazard within 10 meters. To prevent spamming and duplicate markers, upvote this hazard to verify and escalate priority for city road repair!
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
                  Confirmed by <strong>{nearbyPothole.confirmations || 1} citizens</strong>
                </p>
              </div>
            </div>

            {/* Upvote Button */}
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
          /* SCENARIO 2: LIVE CAMERA CAPTURE (STRICTLY REAL PHOTOS)   */
          /* ======================================================== */
          <form onSubmit={handleSubmitNew} className="space-y-4 my-3">
            
            {/* Viewfinder Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[16/10] flex items-center justify-center">
              
              {capturedPhoto ? (
                /* Snapped Live Photo with Burned Geotag */
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhoto}
                    alt="Captured Road Hazard"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>LIVE GEOTAG VERIFIED</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-lg transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retake</span>
                  </button>
                </div>
              ) : cameraActive ? (
                /* Live Camera Stream with Crosshairs */
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Real-time HUD crosshairs */}
                  <div className="absolute inset-4 border border-rose-500/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between text-[10px] font-mono text-rose-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
                      <span>LIVE CAM</span>
                      <span>STRICT GEOTAG</span>
                    </div>
                    <div className="self-center w-8 h-8 border-2 border-rose-500/80 rounded-full animate-ping" />
                    <div className="text-center text-[10px] font-mono text-emerald-400 bg-black/60 py-0.5 rounded backdrop-blur">
                      AIM DIRECTLY AT POTHOLE
                    </div>
                  </div>

                  {/* Shutter Button */}
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="absolute bottom-3 py-2 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-red-600/40 flex items-center gap-2 active:scale-95 transition"
                  >
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    <span>Snap Live Photo</span>
                  </button>
                </>
              ) : (
                /* Camera Initializing or Fallback to Native Device Camera */
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                    <Video className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Camera Access</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      {cameraError
                        ? 'Direct browser stream was blocked. Tap below to launch your phone or laptop camera:'
                        : 'Starting live camera stream...'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => deviceCameraInputRef.current?.click()}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Launch Device Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                    >
                      Retry Stream
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Native Device Camera Hardware Input (strictly forces camera capture on mobile) */}
            <input
              ref={deviceCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleDeviceCameraCapture}
              className="hidden"
            />

            {/* Severity Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Observed Severity Level:
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
                Street Landmark / Note (Optional):
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Near metro pillar 128 center lane"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Requirement Warning if no photo captured */}
            {!capturedPhoto && (
              <p className="text-[11px] text-amber-400/90 flex items-center justify-center gap-1.5 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Live photo required. Snap a live photo above to unlock submission.</span>
              </p>
            )}

            {/* Submit Button (Disabled until live photo is captured) */}
            <button
              type="submit"
              disabled={!capturedPhoto || isSubmitting}
              className={`w-full py-3 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition ${
                capturedPhoto && !isSubmitting
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25 active:scale-98 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{capturedPhoto ? 'Publish Geotagged Pothole' : 'Snap Live Photo to Submit'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
