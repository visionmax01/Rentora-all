import { Hono } from 'hono';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { prisma } from '@rentora/database';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const app = new Hono();

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

// Get user profile
app.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user');

  const profile = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
      _count: {
        select: {
          properties: true,
          bookingsMade: true,
          reviewsGiven: true,
        },
      },
    },
  });

  if (!profile) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: profile,
  });
});

// Update profile
app.patch('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = updateProfileSchema.parse(body);

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  return c.json({
    success: true,
    data: updated,
  });
});

// Change password
app.post('/change-password', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = changePasswordSchema.parse(body);

  const existing = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { password: true },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    }, 404);
  }

  const isValidPassword = await compare(data.currentPassword, existing.password);

  if (!isValidPassword) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
    }, 400);
  }

  const hashedPassword = await hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.userId },
    data: { password: hashedPassword },
  });

  return c.json({
    success: true,
    data: { message: 'Password changed successfully' },
  });
});

// Get user's properties
app.get('/properties', authMiddleware, async (c) => {
  const user = c.get('user');
  const { status, page = '1', limit = '10' } = c.req.query();

  const where: Record<string, unknown> = { ownerId: user.userId };
  if (status) where.status = status;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        images: { take: 1 },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return c.json({
    success: true,
    data: properties,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get user's favorites
app.get('/favorites', authMiddleware, async (c) => {
  const user = c.get('user');

  const favorites = await prisma.favoriteProperty.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        include: {
          images: { take: 1 },
          owner: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return c.json({
    success: true,
    data: favorites.map(f => f.property),
  });
});

// Add to favorites
app.post('/favorites/:propertyId', authMiddleware, async (c) => {
  const user = c.get('user');
  const { propertyId } = c.req.param();

  try {
    await prisma.favoriteProperty.create({
      data: {
        userId: user.userId,
        propertyId,
      },
    });

    return c.json({
      success: true,
      data: { message: 'Added to favorites' },
    }, 201);
  } catch {
    return c.json({
      success: false,
      error: { code: 'ALREADY_EXISTS', message: 'Already in favorites' },
    }, 409);
  }
});

// Remove from favorites
app.delete('/favorites/:propertyId', authMiddleware, async (c) => {
  const user = c.get('user');
  const { propertyId } = c.req.param();

  await prisma.favoriteProperty.deleteMany({
    where: {
      userId: user.userId,
      propertyId,
    },
  });

  return c.json({
    success: true,
    data: { message: 'Removed from favorites' },
  });
});

// Admin: Get all users
app.get('/', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { page = '1', limit = '20', role, search } = c.req.query();

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { properties: true, bookingsMade: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return c.json({
    success: true,
    data: users,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Admin: Update user status
app.patch('/:id/status', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { id } = c.req.param();
  const { isActive } = await c.req.json();

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  return c.json({
    success: true,
    data: updated,
  });
});

export default app;