/**
 * Web Audio API Radar Synthesizer & Haptic Vibration Utility
 * Works 100% offline with zero external audio files or dependencies.
 */

class AudioRadarEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.lastBeepTime = 0;
  }

  // Initialize or resume audio context upon user gesture
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play high-urgency two-tone radar alert (for severe craters)
  playSevereChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    // Throttle beeps so they don't overlap too intensely
    if (Date.now() - this.lastBeepTime < 1200) return;
    this.lastBeepTime = Date.now();

    try {
      // First Tone (High alert ping - 880 Hz / A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Second Tone (Higher resonant warning - 1320 Hz / E6)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);

      // Trigger Haptic Vibration on supported mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([180, 80, 220]);
      }
    } catch (e) {
      console.warn('Audio playback restricted:', e);
    }
  }

  // Play moderate caution ping (for moderate road dips)
  playModerateChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    if (Date.now() - this.lastBeepTime < 2000) return;
    this.lastBeepTime = Date.now();

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now); // E5 note
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      if (navigator.vibrate) {
        navigator.vibrate([120]);
      }
    } catch (e) {
      console.warn('Audio playback restricted:', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const audioRadar = new AudioRadarEngine();

/**
 * Calculate distance in meters using Haversine formula
 */
export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
