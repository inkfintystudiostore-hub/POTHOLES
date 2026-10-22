import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fetchPotholes, upvotePothole } from '../services/potholeService';
import { getCurrentGPSLocation, formatDistance, calculateDistanceMeters } from '../services/locationService';

// Optional native map import (graceful fallback to interactive card view if native map is unavailable on web/simulator)
let MapView = null;
let Marker = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.log('react-native-maps fallback mode');
}

const { width, height } = Dimensions.get('window');

export default function MapScreen({ onNavigateToCamera }) {
  const [potholes, setPotholes] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'map' or 'list'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPotholes();
      setPotholes(data);

      try {
        const loc = await getCurrentGPSLocation();
        setUserLocation(loc);
      } catch (locErr) {
        console.log('Using default reference location:', locErr.message);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id) => {
    const updated = await upvotePothole(id);
    if (updated) {
      setPotholes(prev => prev.map(p => (p.id === id ? updated : p)));
      if (selectedPothole && selectedPothole.id === id) {
        setSelectedPothole(updated);
      }
    }
  };

  const filteredPotholes = potholes.filter(p => {
    if (filter === 'all') return true;
    return p.severity === filter;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return { label: 'CRATER / SEVERE', bg: colors.severity.high };
      case 'medium':
        return { label: 'MODERATE DIP', bg: colors.severity.medium };
      case 'low':
      default:
        return { label: 'MINOR WEAR', bg: colors.severity.low };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>RoadWatch Patrol</Text>
          <Text style={styles.subtitle}>
            {userLocation
              ? `GPS: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
              : 'Acquiring GPS fix...'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadData}
          activeOpacity={0.7}
        >
          <Ionicons name="reload" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Severity Filter Tabs */}
      <View style={styles.filterBar}>
        {[
          { id: 'all', label: 'All Hazards' },
          { id: 'high', label: '🔴 Severe' },
          { id: 'medium', label: '🟠 Moderate' },
          { id: 'low', label: '🟡 Minor' },
        ].map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterPill,
              filter === item.id && styles.filterPillActive,
            ]}
            onPress={() => setFilter(item.id)}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === item.id && styles.filterPillTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Scanning road hazards...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPotholes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badge = getSeverityBadge(item.severity);
            const distance = userLocation
              ? formatDistance(
                  calculateDistanceMeters(
                    userLocation.latitude,
                    userLocation.longitude,
                    item.latitude,
                    item.longitude
                  )
                )
              : null;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelectedPothole(item)}
              >
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.cardImage}
                />
                <View style={styles.cardOverlay}>
                  <View
                    style={[styles.badge, { backgroundColor: badge.bg }]}
                  >
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                  {distance && (
                    <View style={styles.distanceBadge}>
                      <Ionicons
                        name="navigate-outline"
                        size={12}
                        color={colors.text}
                      />
                      <Text style={styles.distanceText}>{distance}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title || item.address}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>
                      {new Date(item.reportedAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.upvoteRow}>
                      <TouchableOpacity
                        style={styles.upvoteBtn}
                        onPress={() => handleUpvote(item.id)}
                      >
                        <Ionicons
                          name="thumbs-up-outline"
                          size={14}
                          color={colors.text}
                        />
                        <Text style={styles.upvoteCount}>
                          {item.upvotes || 0} Confirmations
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={48}
                color={colors.secondary}
              />
              <Text style={styles.emptyTitle}>Road Clear Ahead</Text>
              <Text style={styles.emptySubtitle}>
                No hazards reported under this filter. Tap the Camera to report a new pothole.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) to Report */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateToCamera}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={24} color="#FFF" />
        <Text style={styles.fabText}>Report Pothole</Text>
      </TouchableOpacity>

      {/* Detail Inspection Modal */}
      {selectedPothole && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedPothole(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <Image
                source={{ uri: selectedPothole.photoUrl }}
                style={styles.modalImage}
              />
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedPothole(null)}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.modalBody}>
                <View style={styles.modalHeaderRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: getSeverityBadge(
                          selectedPothole.severity
                        ).bg,
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getSeverityBadge(selectedPothole.severity).label}
                    </Text>
                  </View>
                  <Text style={styles.modalStatus}>
                    Status: {selectedPothole.status?.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>
                  {selectedPothole.title || 'Road Hazard Report'}
                </Text>
                <Text style={styles.modalDesc}>
                  {selectedPothole.description}
                </Text>

                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.metaText}>
                      Lat: {Number(selectedPothole.latitude).toFixed(5)}, Lon:{' '}
                      {Number(selectedPothole.longitude).toFixed(5)}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.metaText}>
                      Reported: {new Date(selectedPothole.reportedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleUpvote(selectedPothole.id)}
                >
                  <Ionicons name="thumbs-up" size={18} color="#FFF" />
                  <Text style={styles.confirmBtnText}>
                    Confirm & Upvote ({selectedPothole.upvotes || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#334155',
  },
  cardOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cardTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  upvoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  upvoteCount: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.85,
  },
  modalImage: {
    width: '100%',
    height: 220,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStatus: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  metaBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
