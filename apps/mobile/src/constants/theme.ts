export const Colors = {
  // Background layers
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgCardAlt: '#1A2235',
  bgOverlay: 'rgba(10,14,26,0.85)',

  // Brand
  primary: '#EF4444',       // Emergency red
  primaryDark: '#B91C1C',
  primaryLight: '#FCA5A5',
  accent: '#F97316',        // Warning orange
  accentBlue: '#3B82F6',    // BLE blue
  accentGreen: '#22C55E',   // Safe green
  accentPurple: '#8B5CF6',  // Resolved purple

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Borders
  border: '#1F2937',
  borderLight: '#374151',

  // Status
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#3B82F6',

  // Severity
  severityCritical: '#EF4444',
  severityHigh: '#F97316',
  severityMedium: '#F59E0B',
  severityLow: '#22C55E',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  }),
};
