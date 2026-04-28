/**
 * Crisis Processing Engine
 * Central brain of EvacuAid — classifies incidents, tags zones,
 * generates escape guidance, and triggers notifications.
 */
import { IncidentType, IncidentSeverity, IncidentStatus } from '@evacuaid/shared';
import { prisma } from '../config/prisma';
import { getIO } from '../socket';
import { notificationService } from './notificationService';
import { guidanceService } from './guidanceService';

// Severity classification map
const SEVERITY_MAP: Record<string, IncidentSeverity> = {
  FIRE: IncidentSeverity.CRITICAL,
  EARTHQUAKE: IncidentSeverity.CRITICAL,
  FLOOD: IncidentSeverity.HIGH,
  MEDICAL: IncidentSeverity.HIGH,
  THEFT: IncidentSeverity.MEDIUM,
  OTHER: IncidentSeverity.LOW,
};

// Zones to auto-mark as CAUTION when a specific emergency occurs
const ZONE_IMPACT_MAP: Record<string, string[]> = {
  FIRE: ['LOBBY', 'STAIRWELL_A', 'CORRIDOR_1F'],
  FLOOD: ['BASEMENT', 'LOBBY', 'CORRIDOR_B1'],
  EARTHQUAKE: ['LOBBY', 'POOL_AREA'],
  MEDICAL: [],
  THEFT: ['CORRIDOR_1F'],
  OTHER: [],
};

export interface ProcessIncidentPayload {
  type: string;
  location: string;
  floor?: number;
  description?: string;
  createdById: string;
}

export const crisisEngine = {
  async processNewIncident(payload: ProcessIncidentPayload) {
    const { type, location, floor, description, createdById } = payload;

    // 1. Classify severity
    const severity = SEVERITY_MAP[type] || IncidentSeverity.LOW;

    // 2. Create incident in DB
    const incident = await prisma.incident.create({
      data: {
        type: type as IncidentType,
        severity: severity as any,
        status: 'CREATED',
        location,
        floor,
        description,
        createdById,
      },
      include: { createdBy: true },
    });

    // 3. Create initial update log
    await prisma.incidentUpdate.create({
      data: {
        incidentId: incident.id,
        message: `🚨 ${type} emergency reported at ${location}. Incident ID: ${incident.id}`,
        source: 'SYSTEM',
      },
    });

    // 4. Tag affected zones based on emergency type
    const affectedZoneNames = ZONE_IMPACT_MAP[type] || [];
    if (affectedZoneNames.length > 0) {
      await prisma.zone.updateMany({
        where: { name: { in: affectedZoneNames } },
        data: { type: 'DANGER' },
      });
    }

    // 5. Update incident status to ACTIVE and emit to staff room
    const activeIncident = await prisma.incident.update({
      where: { id: incident.id },
      data: { status: 'ACTIVE' },
      include: {
        createdBy: true,
        updates: { orderBy: { createdAt: 'asc' } },
        responders: { include: { staff: true } },
      },
    });

    // 6. Emit real-time event to hotel staff room
    const io = getIO();
    io.to('hotel_staff').emit('incident:created', activeIncident);

    // 7. Generate escape guidance for guest
    const guidance = guidanceService.generateGuidance(incident.id, type, floor);
    io.to(`incident_${incident.id}`).emit('guidance:update', guidance);

    // 8. Broadcast push notification to all staff
    await notificationService.broadcastToStaff(
      `🚨 ${type} ALERT`,
      `${severity} severity incident at ${location} — ${incident.id}`,
    );

    // 9. If CRITICAL, auto-notify authorities
    if (severity === IncidentSeverity.CRITICAL) {
      await crisisEngine.notifyAuthorities(incident.id);
    }

    return activeIncident;
  },

  async resolveIncident(incidentId: string, resolvedById: string) {
    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'RESOLVED' },
    });

    await prisma.incidentUpdate.create({
      data: {
        incidentId,
        message: `✅ Incident resolved by staff. All clear.`,
        source: 'STAFF',
        userId: resolvedById,
      },
    });

    // Reset zone types back to SAFE
    const affectedZoneNames = ZONE_IMPACT_MAP[incident.type] || [];
    if (affectedZoneNames.length > 0) {
      await prisma.zone.updateMany({
        where: { name: { in: affectedZoneNames } },
        data: { type: 'SAFE' },
      });
    }

    const io = getIO();
    io.to('hotel_staff').emit('incident:updated', { id: incidentId, status: 'RESOLVED' });
    io.to(`incident_${incidentId}`).emit('guidance:update', {
      incidentId,
      steps: ['✅ Incident has been resolved. The hotel is safe. You may resume normal activity.'],
      nearestExit: 'Main Lobby',
      zonesToAvoid: [],
      safeAssemblyPoint: 'Main Lobby',
    });

    // Generate report
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'REPORT_GENERATED' },
    });

    return incident;
  },

  async notifyAuthorities(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { createdBy: true },
    });
    if (!incident || incident.authorityNotified) return;

    await notificationService.notifyAuthorities(incident);

    await prisma.incident.update({
      where: { id: incidentId },
      data: { authorityNotified: true },
    });

    await prisma.incidentUpdate.create({
      data: {
        incidentId,
        message: `📞 Authorities notified — Police, Fire, Ambulance alerted.`,
        source: 'SYSTEM',
      },
    });

    const io = getIO();
    io.to('hotel_staff').emit('incident:updated', {
      id: incidentId,
      authorityNotified: true,
      update: 'Authorities have been notified',
    });
  },
};
