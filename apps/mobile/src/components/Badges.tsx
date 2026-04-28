import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/theme';
import { SEVERITY_COLORS, STATUS_COLORS } from '../constants';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || Colors.textMuted;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize: isSmall ? 10 : 12 }]}>{severity}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || Colors.textMuted;
  const label = status.replace('_', ' ');

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

interface IncidentTypeIconProps {
  type: string;
  size?: number;
}

export const IncidentTypeIcon: React.FC<IncidentTypeIconProps> = ({ type, size = 24 }) => {
  const icons: Record<string, string> = {
    FIRE: '🔥',
    MEDICAL: '🏥',
    THEFT: '🔒',
    FLOOD: '🌊',
    EARTHQUAKE: '🏚️',
    OTHER: '⚠️',
  };
  return <Text style={{ fontSize: size }}>{icons[type] || '⚠️'}</Text>;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
