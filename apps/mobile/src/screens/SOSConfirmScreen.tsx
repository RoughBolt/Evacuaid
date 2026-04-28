import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { SeverityBadge, IncidentTypeIcon } from '../components/Badges';
import { getGuidance, getIncident } from '../services/api';
import { getSocket, joinIncidentRoom } from '../services/socket';
import { useAppStore } from '../store/useAppStore';

type Props = { navigation: any; route: { params: { incident: any } } };

export const SOSConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const { incident: initialIncident } = route.params;
  const [incident, setIncident] = useState(initialIncident);
  const [guidance, setGuidance] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>(initialIncident.updates || []);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const feedRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Spin animation for "connecting" indicator
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Join incident Socket.IO room for real-time updates
    joinIncidentRoom(initialIncident.id);
    const socket = getSocket();

    socket.on('guidance:update', (data: any) => {
      if (data.incidentId === initialIncident.id) {
        if (data.steps) setGuidance(data);
        if (data.update) {
          setUpdates((prev) => [
            { id: Date.now(), message: data.update, createdAt: new Date().toISOString() },
            ...prev,
          ]);
          feedRef.current?.scrollTo({ y: 0, animated: true });
        }
      }
    });

    socket.on('incident:updated', (data: any) => {
      if (data.id === initialIncident.id) {
        setIncident((prev: any) => ({ ...prev, ...data }));
      }
    });

    // Load initial guidance
    getGuidance(initialIncident.id).then((res) => setGuidance(res.data)).catch(console.error);

    return () => {
      socket.off('guidance:update');
      socket.off('incident:updated');
    };
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const severityColor =
    incident.severity === 'CRITICAL'
      ? Colors.danger
      : incident.severity === 'HIGH'
      ? Colors.accent
      : Colors.warning;

  return (
    <LinearGradient colors={['#0A0E1A', '#1A0A0A']} style={styles.gradient}>
      <ScrollView ref={feedRef} contentContainerStyle={styles.scroll}>
        {/* Incident ID Banner */}
        <View style={[styles.idBanner, { borderColor: severityColor }]}>
          <Animated.Text style={[styles.spinnerIcon, { transform: [{ rotate: spinInterpolate }] }]}>
            ⚙️
          </Animated.Text>
          <View style={styles.idContent}>
            <Text style={styles.idLabel}>INCIDENT ACTIVE</Text>
            <Text style={styles.idValue} numberOfLines={1}># {incident.id}</Text>
          </View>
          <SeverityBadge severity={incident.severity} />
        </View>

        {/* Incident Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <IncidentTypeIcon type={incident.type} size={32} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryType}>{incident.type} EMERGENCY</Text>
              <Text style={styles.summaryLocation}>📍 {incident.location}</Text>
              {incident.floor != null && (
                <Text style={styles.summaryFloor}>🏢 Floor {incident.floor}</Text>
              )}
            </View>
          </View>
          <Text style={styles.summaryTime}>
            🕐 Reported: {new Date(incident.createdAt).toLocaleTimeString()}
          </Text>
        </View>

        {/* Escape Guidance */}
        {guidance && (
          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceTitle}>🛟 Escape Guidance</Text>

            <View style={styles.guidanceItem}>
              <Text style={styles.guidanceLabel}>NEAREST EXIT</Text>
              <Text style={styles.guidanceValue}>🚪 {guidance.nearestExit}</Text>
            </View>

            <View style={styles.guidanceItem}>
              <Text style={styles.guidanceLabel}>ASSEMBLY POINT</Text>
              <Text style={styles.guidanceValue}>🟢 {guidance.safeAssemblyPoint}</Text>
            </View>

            <Text style={styles.guidanceLabel}>STEP-BY-STEP</Text>
            {guidance.steps.map((step: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBullet}>
                  <Text style={styles.stepBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            {guidance.zonesToAvoid.length > 0 && (
              <View style={styles.avoidBox}>
                <Text style={styles.avoidLabel}>⛔ ZONES TO AVOID</Text>
                {guidance.zonesToAvoid.map((zone: string, i: number) => (
                  <Text key={i} style={styles.avoidZone}>• {zone}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Live Updates Feed */}
        <View style={styles.updatesCard}>
          <Text style={styles.updatesTitle}>📡 Live Updates</Text>
          {updates.length === 0 ? (
            <View style={styles.updatesEmpty}>
              <Animated.Text style={{ transform: [{ rotate: spinInterpolate }], fontSize: 20 }}>⚙️</Animated.Text>
              <Text style={styles.updatesEmptyText}>Connecting to crisis response team...</Text>
            </View>
          ) : (
            updates.map((update: any) => (
              <View key={update.id} style={styles.updateItem}>
                <Text style={styles.updateTime}>
                  {new Date(update.createdAt).toLocaleTimeString()}
                </Text>
                <Text style={styles.updateMessage}>{update.message}</Text>
              </View>
            ))
          )}
        </View>

        {/* Navigation to full guidance */}
        <TouchableOpacity
          id="view-map-btn"
          style={styles.mapBtn}
          onPress={() => navigation.navigate('ZoneMap', { incident })}
        >
          <Text style={styles.mapBtnText}>🗺️ View Hotel Zone Map</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 60 },

  idBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  spinnerIcon: { fontSize: 24 },
  idContent: { flex: 1 },
  idLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.textMuted },
  idValue: { ...Typography.h3, fontSize: 14, color: Colors.textPrimary, marginTop: 2 },

  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  summaryText: { flex: 1 },
  summaryType: { ...Typography.h3, color: Colors.primary },
  summaryLocation: { ...Typography.bodySmall, marginTop: 2 },
  summaryFloor: { ...Typography.caption, marginTop: 2 },
  summaryTime: { ...Typography.caption },

  guidanceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accentGreen,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  guidanceTitle: { ...Typography.h3, marginBottom: Spacing.md, color: Colors.accentGreen },
  guidanceItem: { marginBottom: Spacing.sm },
  guidanceLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted, marginBottom: 4 },
  guidanceValue: { ...Typography.body, fontWeight: '600' },

  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepBulletText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText: { ...Typography.body, flex: 1, lineHeight: 22 },

  avoidBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  avoidLabel: { fontSize: 10, fontWeight: '800', color: Colors.danger, letterSpacing: 1.5, marginBottom: 4 },
  avoidZone: { ...Typography.bodySmall, color: Colors.danger, marginBottom: 2 },

  updatesCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  updatesTitle: { ...Typography.h3, marginBottom: Spacing.md },
  updatesEmpty: { alignItems: 'center', gap: 8, paddingVertical: Spacing.md },
  updatesEmptyText: { ...Typography.bodySmall, textAlign: 'center' },
  updateItem: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentGreen,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  updateTime: { ...Typography.caption, color: Colors.textMuted },
  updateMessage: { ...Typography.body, fontSize: 14 },

  mapBtn: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  mapBtnText: { color: Colors.accentBlue, fontWeight: '700', fontSize: 16 },
});
