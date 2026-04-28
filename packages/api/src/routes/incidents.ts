import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { crisisEngine } from '../services/crisisEngine';
import { guidanceService } from '../services/guidanceService';
import { getIO } from '../socket';
import { notificationService } from '../services/notificationService';

const router = Router();

const createIncidentSchema = z.object({
  type: z.enum(['FIRE', 'MEDICAL', 'THEFT', 'FLOOD', 'EARTHQUAKE', 'OTHER']),
  location: z.string().min(1),
  floor: z.number().int().min(1).max(20).optional(),
  description: z.string().optional(),
});

// POST /incidents — Create (Guest SOS or Staff Manual)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createIncidentSchema.parse(req.body);
    const incident = await crisisEngine.processNewIncident({
      ...data,
      createdById: req.user!.id,
    });
    res.status(201).json({ success: true, data: incident });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Invalid input', details: err.errors });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// GET /incidents — List (Staff sees all, Guest sees own)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = ['STAFF', 'ADMIN'].includes(req.user!.role);
    const where = isStaff ? {} : { createdById: req.user!.id };

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        updates: { orderBy: { createdAt: 'desc' }, take: 5 },
        responders: { include: { staff: { select: { id: true, name: true } } } },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ success: true, data: incidents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /incidents/:id — Detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        updates: { orderBy: { createdAt: 'asc' } },
        responders: { include: { staff: { select: { id: true, name: true, employeeId: true } } } },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({ success: true, data: incident });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /incidents/:id/guidance — Escape guidance for guest
router.get('/:id/guidance', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    const guidance = guidanceService.generateGuidance(incident.id, incident.type, incident.floor ?? undefined);
    res.json({ success: true, data: guidance });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /incidents/:id — Update (Staff only)
router.patch('/:id', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, assignedToId, message } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (assignedToId) updates.assignedToId = assignedToId;

    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: updates,
      include: { createdBy: true, assignedTo: true },
    });

    // If resolving, run full resolution flow
    if (status === 'RESOLVED') {
      await crisisEngine.resolveIncident(req.params.id, req.user!.id);
    } else {
      // Log the update
      if (message) {
        await prisma.incidentUpdate.create({
          data: {
            incidentId: req.params.id,
            message,
            source: 'STAFF',
            userId: req.user!.id,
          },
        });
      }

      const io = getIO();
      io.to('hotel_staff').emit('incident:updated', incident);
      io.to(`incident_${req.params.id}`).emit('incident:updated', incident);
    }

    res.json({ success: true, data: incident });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /incidents/:id/assign — Assign responder
router.post('/:id/assign', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId } = req.body;

    const responder = await prisma.responder.create({
      data: {
        incidentId: req.params.id,
        staffId: staffId || req.user!.id,
      },
      include: { staff: { select: { id: true, name: true } } },
    });

    await prisma.incidentUpdate.create({
      data: {
        incidentId: req.params.id,
        message: `👮 ${responder.staff.name} assigned as responder. Help is on the way.`,
        source: 'SYSTEM',
      },
    });

    const io = getIO();
    io.to('hotel_staff').emit('incident:updated', { id: req.params.id, responder });
    io.to(`incident_${req.params.id}`).emit('guidance:update', {
      incidentId: req.params.id,
      update: `✅ Help is on the way — ${responder.staff.name} is responding to your emergency.`,
    });

    res.json({ success: true, data: responder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /incidents/:id/broadcast — Broadcast alert to all staff
router.post('/:id/broadcast', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const io = getIO();
    io.to('hotel_staff').emit('alert:broadcast', {
      incidentId: req.params.id,
      message,
      sentBy: req.user!.name,
      timestamp: new Date().toISOString(),
    });

    await notificationService.broadcastToStaff('📢 Staff Alert', message);

    res.json({ success: true, message: 'Broadcast sent to all staff' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /incidents/:id/notify-authorities — Manual authority trigger
router.post('/:id/notify-authorities', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await crisisEngine.notifyAuthorities(req.params.id);
    res.json({ success: true, message: 'Authorities notified' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /incidents/:id/report — Incident lifecycle report
router.get('/:id/report', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: true,
        assignedTo: true,
        updates: { orderBy: { createdAt: 'asc' } },
        responders: { include: { staff: true } },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    const duration =
      incident.updatedAt && incident.createdAt
        ? Math.round((incident.updatedAt.getTime() - incident.createdAt.getTime()) / 60000)
        : null;

    res.json({
      success: true,
      data: {
        report: {
          incidentId: incident.id,
          generatedAt: new Date().toISOString(),
          summary: {
            type: incident.type,
            severity: incident.severity,
            status: incident.status,
            location: incident.location,
            floor: incident.floor,
            reportedBy: incident.createdBy.name,
            assignedTo: incident.assignedTo?.name || 'Unassigned',
            authorityNotified: incident.authorityNotified,
            durationMinutes: duration,
            createdAt: incident.createdAt,
            resolvedAt: incident.status === 'RESOLVED' ? incident.updatedAt : null,
          },
          timeline: incident.updates.map((u) => ({
            timestamp: u.createdAt,
            message: u.message,
            source: u.source,
          })),
          responders: incident.responders.map((r) => ({
            name: r.staff.name,
            employeeId: r.staff.employeeId,
            assignedAt: r.assignedAt,
          })),
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
