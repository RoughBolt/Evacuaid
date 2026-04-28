import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useConnectivity } from '../hooks/useConnectivity';
import { OfflineBanner } from '../components/OfflineBanner';
import { createIncident } from '../services/api';
import { v4 as uuid } from 'uuid';

type Props = { navigation: any };

export const GuestHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, addToOfflineQueue, setActiveIncidentId } = useAppStore();
  const { isOffline } = useConnectivity();

  // Pulse animation for SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, []);

  const handleSOS = async () => {
    // Triple vibration + haptic
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    navigation.navigate('EmergencyType');
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#1A0808', '#0A0E1A']} style={styles.gradient}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.roomChip}>
            <Text style={styles.roomIcon}>🏨</Text>
            <Text style={styles.roomText}>Room {user?.roomNumber}</Text>
          </View>
        </View>
        <OfflineBanner />
      </View>

      {/* SOS Section */}
      <View style={styles.sosContainer}>
        <Text style={styles.sosLabel}>ONE TAP EMERGENCY</Text>
        <Text style={styles.sosSubtitle}>Press to trigger immediate crisis response</Text>

        {/* Glow rings */}
        <View style={styles.glowWrapper}>
          <Animated.View style={[styles.glowRing, styles.glowRing3, { opacity: glowAnim }]} />
          <Animated.View style={[styles.glowRing, styles.glowRing2, { opacity: glowAnim }]} />
          <Animated.View style={[styles.glowRing, styles.glowRing1, { opacity: glowAnim }]} />

          {/* SOS Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              id="sos-button"
              style={styles.sosButton}
              onPress={handleSOS}
              activeOpacity={0.85}
              accessibilityLabel="SOS Emergency Button"
              accessibilityHint="Double tap to trigger emergency alert"
            >
              <Text style={styles.sosButtonIcon}>🚨</Text>
              <Text style={styles.sosButtonText}>SOS</Text>
              <Text style={styles.sosButtonSub}>PRESS FOR HELP</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Quick info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔥</Text>
            <Text style={styles.infoLabel}>Fire</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🏥</Text>
            <Text style={styles.infoLabel}>Medical</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoLabel}>Security</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={styles.infoLabel}>Other</Text>
          </View>
        </View>
      </View>

      {/* Footer tip */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🛡️ Your safety is our priority. Hotel security responds within 3 minutes.
        </Text>
        <Text style={styles.footerEmergency}>
          Direct call: Ext. 0 (Reception) · Ext. 1 (Security)
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: { ...Typography.bodySmall, color: Colors.textMuted },
  userName: { ...Typography.h2 },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  roomIcon: { fontSize: 14 },
  roomText: { ...Typography.label, color: Colors.textPrimary },

  sosContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  sosLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  sosSubtitle: { ...Typography.bodySmall, marginBottom: Spacing.xl, textAlign: 'center' },

  glowWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  glowRing: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  glowRing1: { width: 200, height: 200 },
  glowRing2: { width: 230, height: 230, borderColor: 'rgba(239,68,68,0.5)' },
  glowRing3: { width: 260, height: 260, borderColor: 'rgba(239,68,68,0.25)' },

  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow(Colors.primary),
  },
  sosButtonIcon: { fontSize: 40, marginBottom: 4 },
  sosButtonText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  sosButtonSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },

  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  infoIcon: { fontSize: 22 },
  infoLabel: { ...Typography.caption, fontWeight: '600' },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: 4,
  },
  footerText: { ...Typography.bodySmall, textAlign: 'center', color: Colors.textMuted },
  footerEmergency: { ...Typography.caption, textAlign: 'center', color: Colors.accentBlue },
});
