import React, { useState, useEffect, useRef } from 'react';
import RadarMap from './components/RadarMap';
import HeaderNav from './components/HeaderNav';
import FeatureDrawer from './components/FeatureDrawer';
import CameraReportModal from './components/CameraReportModal';
import InspectionSidebar from './components/InspectionSidebar';
import PhoneSimulator from './components/PhoneSimulator';
import ProximityAlertHUD from './components/ProximityAlertHUD';
import SafeRouteModal from './components/SafeRouteModal';
import CivicGrievanceModal from './components/CivicGrievanceModal';
import FirebaseSyncModal from './components/FirebaseSyncModal';
import { INITIAL_POTHOLES } from './data/mockPotholes';
import { audioRadar, getDistanceInMeters } from './utils/audioRadar';
import { calculateRouteAlternatives } from './utils/routeService';
import {
  subscribeToLivePotholes,
  publishPotholeToCloud,
  updatePotholeInCloud,
} from './services/firebaseSync';
import { isFirebaseConfigured } from './services/firebaseConfig';
import { Camera, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [potholes, setPotholes] = useState(INITIAL_POTHOLES);
  const [activeFilter, setActiveFilter] = useState('all');
  const [mapStyle, setMapStyle] = useState('streets');
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [latestReportId, setLatestReportId] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // UI & Drawer Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCameraReportOpen, setIsCameraReportOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);

  // Drive Mode & Proximity Radar
  const [isDriving, setIsDriving] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [proximityAlert, setProximityAlert] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const driveIntervalRef = useRef(null);

  // Safe Route Scanner State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // Civic Grievance Modal State
  const [grievancePothole, setGrievancePothole] = useState(null);

  // Firebase Real-time Cloud Sync State
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(isFirebaseConfigured());
  const initialLoadRef = useRef(true);

  // DIRECT AUTO-GEOLOCATION ON PAGE LOAD
  // Automatically requests user location and glides map directly to their city/neighborhood
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 4),
          };
          setUserLocation(loc);
          setFlyToTarget({ lat: loc.lat, lng: loc.lng, zoom: 16 });
          console.log('[RoadWatch] Centered directly on user location:', loc);
        },
        (err) => {
          console.log('[RoadWatch] Using default regional view:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Statistics
  const stats = {
    total: potholes.length,
    high: potholes.filter((p) => p.severity === 'high' && p.status !== 'fixed').length,
    medium: potholes.filter((p) => p.severity === 'medium' && p.status !== 'fixed').length,
    fixed: potholes.filter((p) => p.status === 'fixed').length,
  };

  const filteredPotholes = potholes.filter((p) => {
    if (activeFilter === 'fixed') return p.status === 'fixed';
    if (activeFilter === 'all') return true;
    return p.severity === activeFilter && p.status !== 'fixed';
  });

  // Handle Marking a Pothole as Repaired with Before/After Proof
  const handleMarkFixed = (potholeId, fixedData) => {
    setPotholes((prev) =>
      prev.map((item) => {
        if (item.id === potholeId) {
          const updated = {
            ...item,
            status: 'fixed',
            fixedPhotoUrl: fixedData.fixedPhotoUrl,
            fixedAt: fixedData.fixedAt,
            fixedBy: fixedData.fixedBy,
            description: `${item.description} (Repaired: ${fixedData.fixedNote})`,
            confirmations: (item.confirmations || 0) + 1,
          };
          if (selectedPothole && selectedPothole.id === potholeId) {
            setSelectedPothole(updated);
          }
          return updated;
        }
        return item;
      })
    );

    // Sync to Cloud Firestore in real-time
    updatePotholeInCloud(potholeId, {
      status: 'fixed',
      fixedPhotoUrl: fixedData.fixedPhotoUrl,
      fixedAt: fixedData.fixedAt,
      fixedBy: fixedData.fixedBy,
      description: fixedData.fixedNote,
    }).catch((err) => console.warn('Cloud update fallback:', err));

    setNotification({
      title: '🎉 Road Repair Verified!',
      message: 'Status upgraded to FIXED. View the Before & After slider!',
      severity: 'low',
    });

    setTimeout(() => setNotification(null), 6000);
  };

  // Upvote & Lifecycle Promotion: 3+ confirmations promotes 'reported' -> 'verified'
  const handleUpvote = (id) => {
    setPotholes((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newConfirmations = (item.confirmations || 0) + 1;
          const newUpvotes = (item.upvotes || 0) + 1;
          let newStatus = item.status;

          // Auto-promote to 'verified' upon reaching 3 confirmations
          if (item.status === 'reported' && newConfirmations >= 3) {
            newStatus = 'verified';
            setNotification({
              title: '🟠 Hazard Verified by 3+ Commuters!',
              message: 'Community threshold reached. Prioritized for municipal work order.',
              severity: 'medium',
            });
            setTimeout(() => setNotification(null), 5000);
          } else {
            setNotification({
              title: '👍 Hazard Confirmed (+1)!',
              message: `Now confirmed by ${newConfirmations} citizens. Helps avoid duplicate reports.`,
              severity: 'low',
            });
            setTimeout(() => setNotification(null), 4000);
          }

          const updated = {
            ...item,
            upvotes: newUpvotes,
            confirmations: newConfirmations,
            status: newStatus,
          };

          if (selectedPothole && selectedPothole.id === id) {
            setSelectedPothole(updated);
          }

          // Sync to Cloud Firestore in real-time
          updatePotholeInCloud(id, {
            upvotes: newUpvotes,
            confirmations: newConfirmations,
            status: newStatus,
          }).catch((err) => console.warn('Cloud upvote fallback:', err));

          return updated;
        }
        return item;
      })
    );
  };

  // Calculate Routes & Road Smoothness
  const handleCalculateRoutes = async (start, dest) => {
    const calculated = await calculateRouteAlternatives(start, dest, potholes);
    setRoutes(calculated);
    const recommended = calculated.find((r) => r.isRecommended) || calculated[0];
    setSelectedRouteId(recommended?.id);

    setNotification({
      title: '🛣️ Road Quality Scan Completed!',
      message: `Clean Bypass is ${recommended?.smoothnessScore}% smooth. Direct route has road craters.`,
      severity: 'low',
    });

    setTimeout(() => setNotification(null), 6000);
  };

  const handleSelectLocation = (place) => {
    const [lat, lng] = place.coordinates;
    setFlyToTarget({ lat, lng, zoom: 15 });

    setNotification({
      title: `📍 Navigated to ${place.name}`,
      message: `Loaded regional road network for ${place.label}.`,
      severity: 'low',
    });

    setTimeout(() => setNotification(null), 4000);
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setFlyToTarget({ lat: userLocation.lat, lng: userLocation.lng, zoom: 16 });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 4),
          };
          setUserLocation(loc);
          setFlyToTarget({ lat: loc.lat, lng: loc.lng, zoom: 16 });
        },
        (err) => {
          alert('Could not fetch location: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleToggleMute = () => {
    const muted = audioRadar.toggleMute();
    setIsMuted(muted);
  };

  // Drive Mode Simulation
  const handleToggleDrive = () => {
    if (isDriving) {
      clearInterval(driveIntervalRef.current);
      setIsDriving(false);
      setVehicleLocation(null);
      setProximityAlert(null);
      return;
    }

    audioRadar.initContext();
    setIsDriving(true);

    const targetPothole = potholes.find((p) => p.severity === 'high' && p.status !== 'fixed') || potholes[0];
    const targetLat = targetPothole.latitude;
    const targetLng = targetPothole.longitude;

    let progress = 0;
    const startLat = targetLat - 0.0042;
    const startLng = targetLng - 0.0038;

    setFlyToTarget({ lat: startLat, lng: startLng, zoom: 16 });

    driveIntervalRef.current = setInterval(() => {
      progress += 0.015;

      if (progress >= 1.25) {
        clearInterval(driveIntervalRef.current);
        setIsDriving(false);
        setVehicleLocation(null);
        setProximityAlert(null);

        setNotification({
          title: '✅ Hazard Cleared',
          message: 'Vehicle safely passed road crater. Drive simulation complete.',
          severity: 'low',
        });
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const currentLat = startLat + (targetLat - startLat) * Math.min(progress, 1);
      const currentLng = startLng + (targetLng - startLng) * Math.min(progress, 1);

      setVehicleLocation({
        lat: currentLat,
        lng: currentLng,
        heading: 42,
      });

      const dist = getDistanceInMeters(currentLat, currentLng, targetLat, targetLng);

      if (progress < 1.05 && dist <= 140) {
        if (targetPothole.severity === 'high') {
          audioRadar.playSevereChime();
        } else {
          audioRadar.playModerateChime();
        }

        setProximityAlert({
          title: targetPothole.title,
          severity: targetPothole.severity,
          distance: dist,
        });
      } else if (progress >= 1.05) {
        setProximityAlert(null);
      }
    }, 200);
  };

  // Subscribe to Live Real-Time Firestore Sync
  useEffect(() => {
    const unsubscribe = subscribeToLivePotholes(
      (data, isCloud) => {
        setIsLiveConnected(isCloud);
        if (data && data.length > 0) {
          setPotholes((prev) => {
            // Check if there is a new hazard that arrived live over cloud
            if (!initialLoadRef.current && isCloud) {
              const prevIds = new Set(prev.map((p) => p.id));
              const newlyAdded = data.find((p) => !prevIds.has(p.id));
              if (newlyAdded) {
                setLatestReportId(newlyAdded.id);
                setFlyToTarget({ lat: newlyAdded.latitude, lng: newlyAdded.longitude, zoom: 16 });
                audioRadar.playModerateChime();
                setNotification({
                  title: '📡 Live Cloud Radar: New Hazard Reported!',
                  message: `${newlyAdded.severity.toUpperCase()} hazard synced live at ${newlyAdded.address || 'Roadway'}.`,
                  severity: newlyAdded.severity,
                });
                setTimeout(() => setNotification(null), 6000);
              }
            }
            initialLoadRef.current = false;
            return data;
          });
        }
      },
      (err) => {
        console.warn('Real-time sync notice:', err);
        setIsLiveConnected(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (driveIntervalRef.current) {
        clearInterval(driveIntervalRef.current);
      }
    };
  }, []);

  const handleNewReport = (newPothole) => {
    setPotholes((prev) => [newPothole, ...prev]);
    setLatestReportId(newPothole.id);
    setSelectedPothole(newPothole);
    setFlyToTarget({ lat: newPothole.latitude, lng: newPothole.longitude, zoom: 16 });

    // Sync to Cloud Firestore in real-time
    publishPotholeToCloud(newPothole).catch((err) =>
      console.warn('Could not sync new report to Firestore:', err)
    );

    setNotification({
      title: '🚨 Pothole Upload Received!',
      message: `${newPothole.severity.toUpperCase()} hazard logged at ${newPothole.latitude.toFixed(4)}, ${newPothole.longitude.toFixed(4)}`,
      severity: newPothole.severity,
    });

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#020617' }}>
      
      {/* Sleek, Uncluttered Top Bar */}
      <HeaderNav
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSelectLocation={handleSelectLocation}
        onLocateMe={handleLocateMe}
        userLocation={userLocation}
        isLiveConnected={isLiveConnected}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Full-Screen Smooth City Road Map */}
      <RadarMap
        potholes={filteredPotholes}
        selectedPothole={selectedPothole}
        onSelectPothole={setSelectedPothole}
        latestReportId={latestReportId}
        mapStyle={mapStyle}
        userLocation={userLocation}
        vehicleLocation={vehicleLocation}
        flyToTarget={flyToTarget}
        routes={routes}
        selectedRouteId={selectedRouteId}
      />

      {/* Floating Camera Report Action Button (Thumb-Friendly FAB) */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-auto">
        <button
          onClick={() => setIsCameraReportOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-sm shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 border border-white/20 active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="tracking-wide shadow-sm">Report Pothole</span>
        </button>
      </div>

      {/* Slide-Out Feature Drawer (Tucks away Route Scanner, Drive Mode, Settings) */}
      <FeatureDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        stats={stats}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        isDriving={isDriving}
        onToggleDrive={handleToggleDrive}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenRouteScanner={() => setIsRouteModalOpen(true)}
        hasActiveRoutes={routes.length > 0}
        isLiveConnected={isLiveConnected}
        onOpenFirebaseSync={() => setIsFirebaseModalOpen(true)}
        isPhoneOpen={isPhoneOpen}
        onTogglePhone={() => setIsPhoneOpen(!isPhoneOpen)}
      />

      {/* Dedicated Camera & Geotag Report Modal (with 10-Meter Anti-Spam Deduplication) */}
      <CameraReportModal
        isOpen={isCameraReportOpen}
        onClose={() => setIsCameraReportOpen(false)}
        userLocation={userLocation}
        potholes={potholes}
        onUploadPothole={handleNewReport}
        onUpvotePothole={handleUpvote}
      />

      {/* Proximity Radar Warning HUD (When driving) */}
      <ProximityAlertHUD
        alert={proximityAlert}
        onDismiss={() => setProximityAlert(null)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Safe Route Scanner Modal */}
      <SafeRouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onCalculateRoutes={handleCalculateRoutes}
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        userLocation={userLocation}
      />

      {/* Embedded Mobile Phone Simulator (Optional view from drawer) */}
      <PhoneSimulator
        potholes={potholes}
        onUploadPothole={handleNewReport}
        isOpen={isPhoneOpen}
        onToggle={() => setIsPhoneOpen(!isPhoneOpen)}
        onSelectPothole={(p) => {
          setSelectedPothole(p);
          setLatestReportId(p.id);
        }}
      />

      {/* Real-time Toast Banner */}
      {notification && (
        <div className="absolute top-24 right-4 z-[1500] max-w-sm glass-panel rounded-2xl p-4 border border-emerald-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-white">{notification.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Hazard Inspection Sidebar Sheet */}
      <InspectionSidebar
        pothole={selectedPothole}
        onClose={() => setSelectedPothole(null)}
        onUpvote={handleUpvote}
        onMarkFixed={handleMarkFixed}
        onOpenGrievance={(p) => setGrievancePothole(p)}
      />

      {/* Civic Grievance & Social Export Modal */}
      <CivicGrievanceModal
        isOpen={!!grievancePothole}
        onClose={() => setGrievancePothole(null)}
        pothole={grievancePothole}
      />

      {/* Firebase Cloud Sync Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isLiveConnected={isLiveConnected}
        onConfigUpdated={(cfg) => {
          setIsLiveConnected(isFirebaseConfigured(cfg));
        }}
      />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-6 left-6 z-[900] glass-pill rounded-xl px-3.5 py-2 hidden md:flex items-center gap-4 text-[11px] font-bold text-slate-300 pointer-events-auto shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 🟢 Fixed (✓)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" /> 🔴 Severe
        </span>
      </div>
    </div>
  );
}
