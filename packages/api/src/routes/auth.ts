import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { config } from '../config';

const router = Router();

const guestLoginSchema = z.object({
  name: z.string().min(2),
  roomNumber: z.string().min(1),
});

const staffLoginSchema = z.object({
  employeeId: z.string().min(1),
  password: z.string().min(6),
});

const generateTokens = (user: { id: string; role: string; name: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

// POST /auth/guest-login
router.post('/guest-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, roomNumber } = guestLoginSchema.parse(req.body);

    // Find or create guest user
    let user = await prisma.user.findFirst({
      where: { roomNumber, role: 'GUEST' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name, roomNumber, role: 'GUEST' },
      });
    } else {
      // Update name if returning guest
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    const tokens = generateTokens({ id: user.id, role: user.role, name: user.name });
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, role: user.role, roomNumber: user.roomNumber },
        ...tokens,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Invalid input', details: err.errors });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// POST /auth/staff-login
router.post('/staff-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, password } = staffLoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokens({ id: user.id, role: user.role, name: user.name });
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, role: user.role, employeeId: user.employeeId },
        ...tokens,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Invalid input', details: err.errors });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const tokens = generateTokens({ id: user.id, role: user.role, name: user.name });
    res.json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// POST /auth/register-staff (Admin only — seed endpoint)
router.post('/register-staff', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, employeeId, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        employeeId,
        passwordHash,
        role: role || 'STAFF',
      },
    });
    res.json({
      success: true,
      data: { id: user.id, name: user.name, employeeId: user.employeeId, role: user.role },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
