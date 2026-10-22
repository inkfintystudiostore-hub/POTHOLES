import React, { useEffect, useRef, useState } from 'react';
import * as LModule from 'leaflet';
import 'leaflet/dist/leaflet.css';

const L = LModule.default || LModule;

export default function RadarMap({
  potholes,
  selectedPothole,
  onSelectPothole,
  latestReportId,
  mapStyle = 'streets',
  userLocation,
  vehicleLocation,
  flyToTarget,
  routes = [],
  selectedRouteId,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const routesLayerRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }

      const initialLat = userLocation ? userLocation.lat : 28.6139;
      const initialLng = userLocation ? userLocation.lng : 77.2090;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer groups
      const routesLayer = L.layerGroup().addTo(map);
      routesLayerRef.current = routesLayer;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 200);

      const handleResize = () => {
        try {
          map.invalidateSize();
        } catch (e) {}
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        try {
          map.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.error('Error mounting Leaflet Map:', err);
      setMapError(err.message);
    }
  }, []);

  // Handle Route Polylines (Route A vs Route B visualization)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const rLayer = routesLayerRef.current;
    if (!map || !rLayer) return;

    try {
      rLayer.clearLayers();

      if (routes && routes.length > 0) {
        let allPoints = [];

        routes.forEach((r) => {
          const isSelected = selectedRouteId === r.id;
          const isSafe = r.isRecommended;

          allPoints = allPoints.concat(r.polyline);

          // Route Polyline styling
          const polyline = L.polyline(r.polyline, {
            color: isSelected
              ? isSafe
                ? '#10B981' // Vibrant Emerald Green for Safe Route
                : '#EF4444' // Urgent Red for Rough Route
              : '#64748B', // Muted Gray for unselected alternate
            weight: isSelected ? 6 : 4,
            opacity: isSelected ? 0.95 : 0.45,
            dashArray: !isSafe && isSelected ? '8, 8' : undefined,
          });

          polyline.bindTooltip(
            `${r.name}: ${r.smoothnessScore}% Smooth (${r.distanceKm}km)`,
            { sticky: true }
          );

          rLayer.addLayer(polyline);
        });

        // Add Start & Finish Flag Markers
        const firstRoute = routes[0];
        if (firstRoute && firstRoute.polyline.length > 1) {
          const startPt = firstRoute.polyline[0];
          const endPt = firstRoute.polyline[firstRoute.polyline.length - 1];

          // Start Marker (Green Circle)
          const startHtml = `<div style="background:#10B981;width:24px;height:24px;border-radius:12px;border:3px solid #FFF;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #10B981;font-size:11px;">🟢</div>`;
          const startIcon = L.divIcon({ html: startHtml, className: 'start-flag-icon', iconSize: [24, 24] });
          rLayer.addLayer(L.marker(startPt, { icon: startIcon, zIndexOffset: 1500 }));

          // Destination Marker (Checkered Flag)
          const endHtml = `<div style="background:#0F172A;width:28px;height:28px;border-radius:14px;border:3px solid #F59E0B;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px #F59E0B;font-size:13px;">🏁</div>`;
          const endIcon = L.divIcon({ html: endHtml, className: 'end-flag-icon', iconSize: [28, 28] });
          rLayer.addLayer(L.marker(endPt, { icon: endIcon, zIndexOffset: 1500 }));
        }

        // Fit map smoothly to encompass the full routes
        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints);
          map.fitBounds(bounds, { padding: [70, 70], animate: true });
        }
      }
    } catch (e) {
      console.warn('Error rendering route polylines:', e);
    }
  }, [routes, selectedRouteId]);

  // Handle User Location (Glowing Blue Pin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.lat && userLocation.lng && !vehicleLocation) {
      const html = `
        <div class="user-location-marker">
          <div class="user-pulse-ring"></div>
          <div class="user-dot"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html,
        className: 'custom-user-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation, vehicleLocation]);

  // Handle Vehicle Simulator Marker (Driving Mode with 100m Radar Zone)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (vehicleMarkerRef.current) {
      map.removeLayer(vehicleMarkerRef.current);
      vehicleMarkerRef.current = null;
    }

    if (vehicleLocation) {
      const html = `
        <div class="vehicle-marker">
          <div class="vehicle-radar-zone"></div>
          <div class="vehicle-core" style="transform: rotate(${vehicleLocation.heading || 0}deg);">
            🚗
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        html,
        className: 'custom-vehicle-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([vehicleLocation.lat, vehicleLocation.lng], {
        icon: vehicleIcon,
        zIndexOffset: 2000,
      }).addTo(map);

      vehicleMarkerRef.current = marker;
      map.panTo([vehicleLocation.lat, vehicleLocation.lng], { animate: true, duration: 0.3 });
    }
  }, [vehicleLocation]);

  // Handle Search Result or Locate Target Flight
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToTarget) return;

    try {
      map.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom || 14, {
        animate: true,
        duration: 1.8,
      });
    } catch (e) {
      console.warn('Map flyTo failed:', e);
    }
  }, [flyToTarget]);

  // Handle Map Style Changes (Streets vs Dark vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let attribution = '&copy; OpenStreetMap contributors';

      if (mapStyle === 'dark') {
        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        attribution = '&copy; CARTO &copy; OpenStreetMap contributors';
      } else if (mapStyle === 'satellite') {
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';
      }

      const newTileLayer = L.tileLayer(url, { maxZoom: 19, attribution }).addTo(map);
      tileLayerRef.current = newTileLayer;

      if (routesLayerRef.current) {
        routesLayerRef.current.bringToFront();
      }
      if (markersLayerRef.current) {
        markersLayerRef.current.bringToFront();
      }
    } catch (e) {
      console.warn('Error switching map style:', e);
    }
  }, [mapStyle]);

  // Update Markers when potholes or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    try {
      layer.clearLayers();

      potholes.forEach((pothole) => {
        const isSelected = selectedPothole?.id === pothole.id;
        const isNew = latestReportId === pothole.id;
        const isFixed = pothole.status === 'fixed';

        const severityClass = isFixed ? 'fixed' : pothole.severity;
        const iconSymbol = isFixed
          ? '✓'
          : pothole.severity === 'high'
          ? '!'
          : pothole.severity === 'medium'
          ? '~'
          : '•';

        const html = `
          <div class="radar-marker-wrapper severity-${severityClass} ${isNew ? 'new-arrival-pulse' : ''}" style="${isSelected ? 'transform: scale(1.35); z-index: 999;' : ''}">
            <div class="radar-ring-1"></div>
            ${pothole.severity === 'high' && !isFixed ? '<div class="radar-ring-2"></div>' : ''}
            <div class="radar-core">
              <span style="font-size: 11px; font-weight: 900; color: #FFF; line-height: 1;">${iconSymbol}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html,
          className: 'custom-radar-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([pothole.latitude, pothole.longitude], {
          icon: customIcon,
        });

        marker.on('click', () => {
          onSelectPothole(pothole);
          try {
            map.flyTo([pothole.latitude, pothole.longitude], 16, {
              duration: 1.2,
            });
          } catch (e) {}
        });

        layer.addLayer(marker);
      });
    } catch (e) {
      console.error('Error updating markers:', e);
    }
  }, [potholes, selectedPothole, latestReportId, onSelectPothole]);

  // Smoothly FlyTo whenever a new hazard is reported
  useEffect(() => {
    if (!latestReportId || !mapInstanceRef.current) return;
    const latest = potholes.find((p) => p.id === latestReportId);
    if (latest) {
      try {
        mapInstanceRef.current.flyTo([latest.latitude, latest.longitude], 16, {
          animate: true,
          duration: 1.6,
        });
      } catch (e) {}
    }
  }, [latestReportId, potholes]);

  if (mapError) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#EF4444' }}>
        <p>Map Error: {mapError}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}
