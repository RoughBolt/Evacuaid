// API base URL — change to your deployed Railway URL in production
export const API_URL = __DEV__
  ? 'http://localhost:4000'
  : 'https://evacuaid-api.railway.app';

export const SOCKET_URL = API_URL;

// Emergency types with display info
export const EMERGENCY_TYPES = [
  {
    id: 'FIRE',
    label: 'Fire',
    icon: '🔥',
    color: '#FF4444',
    description: 'Building fire or smoke detected',
  },
  {
    id: 'MEDICAL',
    label: 'Medical',
    icon: '🏥',
    color: '#FF6B35',
    description: 'Medical emergency — injury or illness',
  },
  {
    id: 'THEFT',
    label: 'Theft / Security',
    icon: '🔒',
    color: '#F59E0B',
    description: 'Theft, robbery, or suspicious activity',
  },
  {
    id: 'FLOOD',
    label: 'Flood / Water',
    icon: '🌊',
    color: '#3B82F6',
    description: 'Flooding or water hazard',
  },
  {
    id: 'EARTHQUAKE',
    label: 'Earthquake',
    icon: '🏚️',
    color: '#8B5CF6',
    description: 'Earthquake or structural damage',
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: '⚠️',
    color: '#6B7280',
    description: 'Other emergency — describe below',
  },
] as const;

export const SEVERITY_COLORS = {
  LOW: '#22C55E',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

export const STATUS_COLORS = {
  CREATED: '#6B7280',
  ACTIVE: '#F97316',
  RESOLVED: '#22C55E',
  REPORT_GENERATED: '#8B5CF6',
};

export const ZONE_COLORS = {
  DANGER: 'rgba(239, 68, 68, 0.45)',
  CAUTION: 'rgba(245, 158, 11, 0.40)',
  SAFE: 'rgba(34, 197, 94, 0.30)',
};

export const HOTEL_FLOORS = [
  { id: 0, label: 'Basement (B1)' },
  { id: 1, label: 'Ground Floor (1F)' },
  { id: 2, label: 'Floor 2' },
  { id: 3, label: 'Floor 3' },
  { id: 4, label: 'Floor 4' },
];
