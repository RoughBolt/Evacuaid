import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();

// GET /zones — Get all hotel zones
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const zones = await prisma.zone.findMany({ orderBy: { floor: 'asc' } });
    res.json({ success: true, data: zones });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /zones — Create zone (Admin only)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const zone = await prisma.zone.create({ data: req.body });
    res.status(201).json({ success: true, data: zone });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /zones/:id — Update zone type (Staff / Admin)
router.patch('/:id', authenticate, requireRole('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const zone = await prisma.zone.update({
      where: { id: req.params.id },
      data: { type: req.body.type },
    });

    const io = getIO();
    io.to('hotel_all').emit('zone:statusChanged', zone);

    res.json({ success: true, data: zone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /zones/seed — Seed default hotel zones (Dev/Admin only)
router.post('/seed', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.zone.deleteMany();
    
    const defaultZones = [
      // Floor 1
      { name: 'LOBBY', floor: 1, type: 'SAFE', x: 100, y: 200, width: 200, height: 150 },
      { name: 'RECEPTION', floor: 1, type: 'SAFE', x: 310, y: 200, width: 100, height: 150 },
      { name: 'CORRIDOR_1F', floor: 1, type: 'SAFE', x: 100, y: 360, width: 310, height: 60 },
      { name: 'STAIRWELL_A', floor: 1, type: 'SAFE', x: 420, y: 200, width: 60, height: 220 },
      { name: 'RESTAURANT', floor: 1, type: 'SAFE', x: 100, y: 430, width: 200, height: 120 },
      { name: 'POOL_AREA', floor: 1, type: 'SAFE', x: 310, y: 430, width: 170, height: 120 },
      // Floor 2
      { name: 'ROOMS_201_210', floor: 2, type: 'SAFE', x: 100, y: 200, width: 200, height: 120 },
      { name: 'ROOMS_211_220', floor: 2, type: 'SAFE', x: 310, y: 200, width: 170, height: 120 },
      { name: 'CORRIDOR_2F', floor: 2, type: 'SAFE', x: 100, y: 330, width: 380, height: 60 },
      { name: 'STAIRWELL_B', floor: 2, type: 'SAFE', x: 490, y: 200, width: 60, height: 190 },
      // Basement
      { name: 'BASEMENT', floor: 0, type: 'SAFE', x: 100, y: 200, width: 250, height: 150 },
      { name: 'PARKING', floor: 0, type: 'SAFE', x: 360, y: 200, width: 200, height: 150 },
    ];

    await prisma.zone.createMany({ data: defaultZones as any[] });
    const zones = await prisma.zone.findMany();
    res.json({ success: true, data: zones, message: `${zones.length} zones seeded` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
