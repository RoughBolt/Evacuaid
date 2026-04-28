// ─── Enums ─────────────────────────────────────────────────────────────────

export enum UserRole {
  GUEST = 'GUEST',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum IncidentType {
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  THEFT = 'THEFT',
  FLOOD = 'FLOOD',
  EARTHQUAKE = 'EARTHQUAKE',
  OTHER = 'OTHER',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  REPORT_GENERATED = 'REPORT_GENERATED',
}

export enum ZoneType {
  DANGER = 'DANGER',
  CAUTION = 'CAUTION',
  SAFE = 'SAFE',
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roomNumber?: string;
  employeeId?: string;
  pushToken?: string;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  source: 'SYSTEM' | 'STAFF' | 'GUEST';
  timestamp: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  floor?: number;
  description?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  updates: IncidentUpdate[];
}

export interface EscapeGuidance {
  incidentId: string;
  steps: string[];
  nearestExit: string;
  zonesToAvoid: string[];
  safeAssemblyPoint: string;
}

// ─── Socket Events ───────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_UPDATED: 'incident:updated',
  GUIDANCE_UPDATE: 'guidance:update',
  ZONE_STATUS_CHANGED: 'zone:statusChanged',
  BROADCAST_ALERT: 'alert:broadcast',
  JOIN_HOTEL_ROOM: 'hotel:join',
  JOIN_INCIDENT_ROOM: 'incident:join',
} as const;

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Severity Classification ─────────────────────────────────────────────────

export const INCIDENT_SEVERITY_MAP: Record<IncidentType, IncidentSeverity> = {
  [IncidentType.FIRE]: IncidentSeverity.CRITICAL,
  [IncidentType.EARTHQUAKE]: IncidentSeverity.CRITICAL,
  [IncidentType.FLOOD]: IncidentSeverity.HIGH,
  [IncidentType.MEDICAL]: IncidentSeverity.HIGH,
  [IncidentType.THEFT]: IncidentSeverity.MEDIUM,
  [IncidentType.OTHER]: IncidentSeverity.LOW,
};

export const EMERGENCY_CONTACTS = {
  POLICE: '100',
  FIRE: '101',
  AMBULANCE: '102',
};
