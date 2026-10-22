import React, { useState, useEffect, useRef } from 'react';
import RadarMap from './components/RadarMap';
import HeaderNav from './components/HeaderNav';
import InspectionSidebar from './components/InspectionSidebar';
import PhoneSimulator from './components/PhoneSimulator';
import SimulateUploadModal from './components/SimulateUploadModal';
import LocationPermissionModal from './components/LocationPermissionModal';
import ProximityAlertHUD from './components/ProximityAlertHUD';
import SafeRouteModal from './components/SafeRouteModal';
import CivicGrievanceModal from './components/CivicGrievanceModal';
import { INITIAL_POTHOLES } from './data/mockPotholes';
import { audioRadar, getDistanceInMeters } from './utils/audioRadar';
import { calculateRouteAlternatives } from './utils/routeService';
import { Bell, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [potholes, setPotholes] = useState(INITIAL_POTHOLES);
  const [activeFilter, setActiveFilter] = useState('all');
  const [mapStyle, setMapStyle] = useState('streets');
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [latestReportId, setLatestReportId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
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

    setNotification({
      title: '🎉 Road Repair Verified!',
      message: 'Status upgraded to FIXED. Drag the interactive Before & After slider to view the transformation!',
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
      message: `Clean Bypass is ${recommended?.smoothnessScore}% smooth (0 craters). Direct road has 3 severe craters.`,
      severity: 'low',
    });

    setTimeout(() => setNotification(null), 6000);
  };

  const handleLocationGranted = (loc) => {
    setUserLocation(loc);
    setFlyToTarget({ lat: loc.lat, lng: loc.lng, zoom: 14 });

    const localPothole = {
      id: `local-user-pot-${Date.now()}`,
      latitude: +(loc.lat + 0.005).toFixed(5),
      longitude: +(loc.lng + 0.004).toFixed(5),
      severity: 'high',
      title: 'Active Road Crater in Your Neighborhood',
      description: 'Reported by local driver. Verified high-risk road degradation.',
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop&q=80',
      reportedAt: new Date().toISOString(),
      status: 'reported',
      upvotes: 1,
      confirmations: 1,
      address: 'Near Your Neighborhood Main Road',
      reportedBy: 'Local Community Watch',
    };

    setPotholes((prev) => [localPothole, ...prev]);

    setNotification({
      title: '📍 Local City Map Activated!',
      message: `Centered on your location (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}). Hazards near you loaded.`,
      severity: 'medium',
    });

    setTimeout(() => setNotification(null), 5000);
  };

  const handleSelectLocation = (place) => {
    const [lat, lng] = place.coordinates;
    setFlyToTarget({ lat, lng, zoom: 13 });

    const searchPothole = {
      id: `search-pot-${Date.now()}`,
      latitude: +(lat + (Math.random() - 0.5) * 0.015).toFixed(5),
      longitude: +(lng + (Math.random() - 0.5) * 0.015).toFixed(5),
      severity: 'high',
      title: `Major Road Crater - ${place.name}`,
      description: `Discovered in ${place.label}. Severe surface collapse requiring road repair.`,
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
      reportedAt: new Date().toISOString(),
      status: 'verified',
      upvotes: 12,
      confirmations: 5,
      address: place.label,
      reportedBy: 'Regional Patrol',
    };

    setPotholes((prev) => [searchPothole, ...prev]);

    setNotification({
      title: `📍 Navigated to ${place.name}`,
      message: `Loaded regional road network and hazards for ${place.label}.`,
      severity: 'low',
    });

    setTimeout(() => setNotification(null), 5000);
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setFlyToTarget({ lat: userLocation.lat, lng: userLocation.lng, zoom: 15 });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationGranted({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          alert('Could not fetch location: ' + err.message);
        }
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

  useEffect(() => {
    return () => {
      if (driveIntervalRef.current) {
        clearInterval(driveIntervalRef.current);
      }
    };
  }, []);

  const handleNewReport = (newPothole) => {
    setPotholes((prev) => [newPothole, ...prev]);
    setLatestReportId(newPothole.id);
    setSelectedPothole(newPothole);

    setNotification({
      title: '🚨 Pothole Upload Received!',
      message: `${newPothole.severity.toUpperCase()} hazard reported at ${newPothole.latitude}, ${newPothole.longitude}`,
      severity: newPothole.severity,
    });

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#020617' }}>
      {/* Location Permission Modal */}
      <LocationPermissionModal
        onGrantPermission={handleLocationGranted}
        onDenyPermission={() => {}}
        userLocation={userLocation}
      />

      {/* Top Header & Search Bar */}
      <HeaderNav
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        isPhoneOpen={isPhoneOpen}
        onTogglePhone={() => setIsPhoneOpen(!isPhoneOpen)}
        onTriggerSimulation={() => setIsSimulateOpen(true)}
        onSelectLocation={handleSelectLocation}
        onLocateMe={handleLocateMe}
        userLocation={userLocation}
        isDriving={isDriving}
        onToggleDrive={handleToggleDrive}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenRouteScanner={() => setIsRouteModalOpen(true)}
        hasActiveRoutes={routes.length > 0}
      />

      {/* Full-Screen City Road Map */}
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

      {/* Proximity Radar Warning HUD */}
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

      {/* Embedded Mobile Phone Simulator */}
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

      {/* Quick Simulation Modal */}
      <SimulateUploadModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSimulate={handleNewReport}
      />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 right-16 z-[900] glass-pill rounded-xl px-3.5 py-2 hidden md:flex items-center gap-4 text-[11px] font-bold text-slate-300 pointer-events-auto shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 🟢 Fixed Road (✓)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" /> 🔴 Severe Crater
        </span>
      </div>
    </div>
  );
}
