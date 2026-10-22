import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import MapScreen from './src/screens/MapScreen';
import CameraScreen from './src/screens/CameraScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'camera'

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Screen View */}
      <View style={styles.screenContainer}>
        {activeTab === 'map' ? (
          <MapScreen onNavigateToCamera={() => setActiveTab('camera')} />
        ) : (
          <CameraScreen
            onReportSubmitted={() => setActiveTab('map')}
            onCancel={() => setActiveTab('map')}
          />
        )}
      </View>

      {/* Bottom Tab Bar (Visible only when in map mode, hidden in full-screen camera) */}
      {activeTab === 'map' && (
        <SafeAreaView style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => setActiveTab('map')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'map' ? 'map' : 'map-outline'}
                size={22}
                color={activeTab === 'map' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'map' && styles.tabLabelActive,
                ]}
              >
                Road Map
              </Text>
            </TouchableOpacity>

            {/* Central Camera Action Tab */}
            <TouchableOpacity
              style={styles.centerCameraBtn}
              onPress={() => setActiveTab('camera')}
              activeOpacity={0.8}
            >
              <View style={styles.centerCameraIconCircle}>
                <Ionicons name="camera" size={26} color="#FFF" />
              </View>
              <Text style={styles.tabLabelActive}>Snap Hazard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => setActiveTab('camera')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.textMuted}
              />
              <Text style={styles.tabLabel}>Safety Log</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBarWrapper: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 60 : 68,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4,
  },
  centerCameraBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  centerCameraIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.card,
  },
});
