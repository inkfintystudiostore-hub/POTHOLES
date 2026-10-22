# 🚨 RoadWatch — Crowdsourced Pothole Radar & Road Quality Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo-61DAFB.svg)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/Web-React%20%7C%20Vite-61DAFB.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Maps-OpenStreetMap%20%7C%20Leaflet-199900.svg)](https://leafletjs.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Ready-FFCA28.svg)](https://firebase.google.com/)

An end-to-end, cross-platform platform for reporting, detecting, and avoiding road hazards and potholes in real-time. Features an interactive **Live City Radar Map** on the web and a cross-platform **iOS & Android Mobile App**.

---

## 🌟 Key Features

### 1. 🌐 Live City Road Map (Web Portal)
- **Animated Pulsing Radar Rings:** Real-time visual pulses indicating hazard severity:
  - 🔴 **Severe Crater:** Rapid double-ring shockwave pulse (1.4s).
  - 🟠 **Moderate Dip:** Steady amber ripple (2.2s).
  - 🟡 **Minor Wear:** Subtle yellow ping (3.5s).
- **Proximity Audio & Radar Alert ("Waze-style"):** Synthesized audio chime & haptic vibration warning when entering within 120m of a road crater.
- **Safe Route & Road Quality Scanner:** Compares Route A (Direct, crater-heavy) vs Route B (Clean bypass, 96% smooth road) using OSRM to preserve vehicle suspension and tires.
- **4-Stage Repair Lifecycle:** Tracks progress from 🔴 *Reported* ➔ 🟠 *3+ Verified* ➔ 🔵 *In Repair* ➔ 🟢 *Fixed & Patched*.
- **Interactive Before/After Slider:** Draggable split-view slider comparing crater photos before repair and newly asphalted roads after patching.
- **1-Click Civic Grievance & Social Export:** Pre-drafted formal notice to the Municipal Commissioner, 1-click Twitter/X intent tagging `@PWD_Roads`, and WhatsApp alerts.

### 2. 📱 Mobile App (iOS & Android with Expo)
- **GPS Geotagger HUD:** Viewfinder overlay showing live coordinates (`lat, lng`) and horizontal satellite precision meters ($\pm 3\text{m}$).
- **Smart AI Vision Analyzer Overlay:** Augmented reality bounding box (`[ ]`), scanning laser line, and depth estimation (`~14.2 cm`).
- **Automated Privacy Shield:** Client-side blur masks over background vehicle license plates and bystander faces (GDPR & DPDP privacy compliant).
- **Client-Side Compression:** Automatically compresses photos to 75% JPEG (~300 KB) before cloud storage.

---

## 📂 Project Structure

```
PROJECT POTHOLES/
├── firebase.json              # Firebase Hosting, Firestore & Storage config
├── firestore.rules            # Coordinate boundary checks (-90/90) & security rules
├── storage.rules              # MIME validation & 5MB file limits
├── .gitignore
├── README.md
│
├── web/                       # Web Portal & City Radar Dashboard
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── RadarMap.jsx           # Leaflet map with pulsing HTML radar markers
│   │   │   ├── HeaderNav.jsx          # Live status, filters & search bar
│   │   │   ├── PhoneSimulator.jsx     # Side-by-side embedded mobile app
│   │   │   ├── InspectionSidebar.jsx  # Detailed inspection card & upvotes
│   │   │   ├── BeforeAfterSlider.jsx  # Draggable repair comparison slider
│   │   │   ├── SafeRouteModal.jsx     # Route A vs Route B quality scanner
│   │   │   ├── ProximityAlertHUD.jsx  # Automotive heads-up warning banner
│   │   │   └── CivicGrievanceModal.jsx# 1-click Twitter & legal grievance exporter
│   │   ├── utils/
│   │   │   ├── audioRadar.js          # Web Audio API chime synthesizer
│   │   │   └── routeService.js        # OSRM road geometry & smoothness scorer
│   │   └── App.jsx
│
└── mobile/                    # React Native / Expo Mobile App (iOS & Android)
    ├── App.js                 # Bottom tab navigation & automotive dark theme
    ├── app.json               # Camera & GPS permission strings for App Store & Play Store
    └── src/
        ├── screens/
        │   ├── MapScreen.js           # City hazard feed & nearby radar
        │   └── CameraScreen.js        # Viewfinder, GPS HUD & severity selector
        └── services/
            ├── locationService.js     # High-precision GPS tracking
            └── potholeService.js      # Client-side photo compression
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### 1. Run the Web Dashboard
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Run the Mobile App (iOS & Android)
```bash
cd mobile
npm install
npx expo start
```
- **On Physical Phone:** Scan the QR code using the **Expo Go** app (Android) or native Camera app (iOS).
- **In Web Browser:** Press `w` in the terminal to open the web emulator.

---

## 🔒 Security & Privacy by Design

- **Zero Personally Identifiable Information (PII):** User names, phone numbers, and IPs are never attached to public map markers.
- **EXIF Stripping:** Device serial numbers and raw hardware EXIF metadata are stripped client-side before uploading.
- **Automated Privacy Shield:** Vehicle license plates and bystander faces are masked.
- **Strict Firestore & Storage Rules:** Strict coordinate boundaries ($-90^\circ \le \text{lat} \le 90^\circ$, $-180^\circ \le \text{lng} \le 180^\circ$) and MIME-type restrictions.

---

## 📄 License

This project is licensed under the MIT License.
