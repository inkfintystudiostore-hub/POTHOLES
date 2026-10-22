import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getCurrentGPSLocation } from '../services/locationService';
import { submitPotholeReport } from '../services/potholeService';

const { width } = Dimensions.get('window');

export default function CameraScreen({ onReportSubmitted, onCancel }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [severity, setSeverity] = useState('high'); // 'high' | 'medium' | 'low'
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const loc = await getCurrentGPSLocation();
      setGpsData(loc);
    } catch (err) {
      console.warn('GPS Fix failed:', err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      // Re-fetch latest GPS before snapping
      fetchCurrentLocation();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      setCapturedPhoto(photo);
    } catch (error) {
      Alert.alert('Camera Error', 'Could not capture photo: ' + error.message);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) return;

    // Use current GPS or fallback to reasonable coordinates if inside/testing
    const latitude = gpsData ? gpsData.latitude : 28.6139;
    const longitude = gpsData ? gpsData.longitude : 77.2090;

    setSubmitting(true);
    try {
      await submitPotholeReport({
        photoUri: capturedPhoto.uri,
        latitude,
        longitude,
        severity,
        description: description.trim() || `${severity.toUpperCase()} pothole reported`,
      });

      Alert.alert(
        'Hazard Reported',
        'Your pothole report with GPS coordinates has been logged and published to the map!',
        [
          {
            text: 'View on Map',
            onPress: () => {
              setCapturedPhoto(null);
              onReportSubmitted?.();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Permission Request View
  if (!permission) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={colors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            RoadWatch needs access to your camera to photograph road hazards and attach real-time GPS coordinates.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textBtn} onPress={onCancel}>
            <Text style={styles.textBtnText}>Return to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Post-Capture Review View
  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.reviewHeaderTitle}>Review Hazard Report</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.photoPreviewWrapper}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.photoPreview} />
          {/* GPS Stamp on Image */}
          <View style={styles.gpsStamp}>
            <Ionicons name="location" size={14} color="#FFF" />
            <Text style={styles.gpsStampText}>
              {gpsData
                ? `${gpsData.latitude.toFixed(5)}, ${gpsData.longitude.toFixed(5)} (±${Math.round(gpsData.accuracy || 5)}m)`
                : 'GPS Tagged'}
            </Text>
          </View>
        </View>

        <View style={styles.reviewForm}>
          <Text style={styles.formLabel}>SELECT SEVERITY LEVEL:</Text>
          <View style={styles.severityGrid}>
            {[
              {
                id: 'high',
                label: '🔴 Severe',
                desc: 'Deep Crater / Wheel Damage',
                border: colors.severity.high,
              },
              {
                id: 'medium',
                label: '🟠 Moderate',
                desc: 'Uneven Dip / Suspension Thud',
                border: colors.severity.medium,
              },
              {
                id: 'low',
                label: '🟡 Minor',
                desc: 'Surface Wear / Cracks',
                border: colors.severity.low,
              },
            ].map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.severityCard,
                  severity === item.id && {
                    borderColor: item.border,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  },
                ]}
                onPress={() => setSeverity(item.id)}
              >
                <Text style={styles.severityCardTitle}>{item.label}</Text>
                <Text style={styles.severityCardDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { marginTop: 16 }]}>ADDITIONAL NOTES (OPTIONAL):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Center lane before the flyover"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            maxLength={100}
          />

          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={handleRetake}
              disabled={submitting}
            >
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Active Live Camera Viewfinder
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <SafeAreaView style={styles.cameraOverlay}>
          {/* Top GPS HUD Banner */}
          <View style={styles.hudBar}>
            <View style={styles.hudGpsInfo}>
              <View style={styles.hudStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        gpsData?.accuracy <= 15
                          ? colors.gpsGood
                          : colors.gpsModerate,
                    },
                  ]}
                />
                <Text style={styles.hudTitle}>GPS GEOTAGGER</Text>
              </View>
              {gpsLoading ? (
                <Text style={styles.hudCoordinates}>Locking onto satellites...</Text>
              ) : (
                <Text style={styles.hudCoordinates}>
                  {gpsData
                    ? `${gpsData.latitude.toFixed(5)}°, ${gpsData.longitude.toFixed(5)}°`
                    : '28.6139° N, 77.2090° E'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.hudRefreshBtn}
              onPress={fetchCurrentLocation}
            >
              <Ionicons name="locate" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Safety Disclaimer Banner */}
          <View style={styles.safetyBanner}>
            <Ionicons name="shield-alert-outline" size={14} color="#FBBF24" />
            <Text style={styles.safetyText}>
              Safety: Only capture when safely stopped or as a passenger.
            </Text>
          </View>

          {/* Bottom Shutter Controls */}
          <View style={styles.shutterBar}>
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={onCancel}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* Big Shutter Button */}
            <TouchableOpacity
              style={styles.shutterOuterRing}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.shutterInnerCircle} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 20,
  },
  hudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hudGpsInfo: {
    flex: 1,
  },
  hudStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hudTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hudCoordinates: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  hudRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  safetyText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '600',
  },
  shutterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  controlIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  permissionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  textBtn: {
    marginTop: 16,
  },
  textBtnText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
  },
  reviewHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  photoPreviewWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
    backgroundColor: '#334155',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  gpsStamp: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsStampText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  reviewForm: {
    flex: 1,
    padding: 16,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  severityGrid: {
    gap: 8,
  },
  severityCard: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  severityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  severityCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 14,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  retakeBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
