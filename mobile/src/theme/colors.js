// Color palette for Pothole Report App
export const colors = {
  // Severity Levels
  severity: {
    high: '#EF4444',      // Red (Crater / Axle-breaker)
    medium: '#F59E0B',    // Amber / Orange (Moderate dip)
    low: '#EAB308',       // Yellow (Minor cracks / bump)
  },
  
  // UI Theme
  primary: '#2563EB',     // Royal Blue
  primaryDark: '#1D4ED8',
  secondary: '#10B981',   // Emerald Green
  accent: '#8B5CF6',
  
  // Backgrounds & Surfaces
  background: '#0F172A', // Slate 900 (High contrast dark theme)
  card: '#1E293B',       // Slate 800
  cardBorder: '#334155', // Slate 700
  
  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // Indicators
  gpsGood: '#10B981',     // Accuracy <= 10m
  gpsModerate: '#F59E0B', // Accuracy 10m-25m
  gpsBad: '#EF4444',      // Accuracy > 25m
};
