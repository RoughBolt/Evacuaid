import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, BorderRadius, Typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

/**
 * Offline BLE simulation banner.
 * Shows a pulsing blue BLE indicator when internet is unavailable.
 */
export const OfflineBanner: React.FC = () => {
  const isOffline = useAppStore((s) => s.isOffline);
  const queueLength = useAppStore((s) => s.offlineQueue.length);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOffline) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Animated.Text style={[styles.bleIcon, { transform: [{ scale: pulseAnim }] }]}>
        🔵
      </Animated.Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Bluetooth Mesh Mode</Text>
        <Text style={styles.subtitle}>
          No internet — SOS will relay peer-to-peer
          {queueLength > 0 ? ` · ${queueLength} queued` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  bleIcon: { fontSize: 20 },
  textContainer: { flex: 1 },
  title: {
    ...Typography.label,
    color: '#93C5FD',
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: '#6B9FDD',
    marginTop: 1,
  },
});
