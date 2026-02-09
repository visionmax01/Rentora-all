import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { updatePropertyIndex } from '../lib/typesense.js';

const app = new Hono();

// Apply admin middleware to all routes
app.use('*', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'));

// Dashboard stats
app.get('/stats', async (c) => {
  const [
    totalUsers,
    newUsersThisMonth,
    totalProperties,
    activeProperties,
    totalBookings,
    pendingBookings,
    totalRevenue,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'AVAILABLE' } }),
    prisma.propertyBooking.count(),
    prisma.propertyBooking.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: {
          gte: new Date(new Date().setDate(1)),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return c.json({
    success: true,
    data: {
      totalUsers,
      newUsersThisMonth,
      totalProperties,
      activeProperties,
      totalBookings,
      pendingBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
    },
  });
});

// Recent activity
app.get('/activity', async (c) => {
  const { limit = '10' } = c.req.query();

  const [recentBookings, recentUsers, recentProperties] = await Promise.all([
    prisma.propertyBooking.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        property: { select: { title: true } },
      },
    }),
    prisma.user.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, createdAt: true },
    }),
    prisma.property.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true, owner: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const activities = [
    ...recentBookings.map(b => ({
      id: b.id,
      type: 'booking',
      description: `New booking for ${b.property.title}`,
      user: `${b.guest.firstName} ${b.guest.lastName}`,
      timestamp: b.createdAt,
    })),
    ...recentUsers.map(u => ({
      id: u.id,
      type: 'user',
      description: 'New user registered',
      user: `${u.firstName} ${u.lastName}`,
      timestamp: u.createdAt,
    })),
    ...recentProperties.map(p => ({
      id: p.id,
      type: 'listing',
      description: `New property listed: ${p.title}`,
      user: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : 'Unknown',
      timestamp: p.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, parseInt(limit));

  return c.json({
    success: true,
    data: activities,
  });
});

// Get pending property verifications
app.get('/properties/pending', async (c) => {
  const { page = '1', limit = '20' } = c.req.query();

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        images: true,
        owner: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.property.count({ where: { status: 'PENDING_VERIFICATION' } }),
  ]);

  return c.json({
    success: true,
    data: properties,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
});

// Verify property
app.patch('/properties/:id/verify', async (c) => {
  const { id } = c.req.param();

  const property = await prisma.property.update({
    where: { id },
    data: {
      status: 'AVAILABLE',
      isVerified: true,
    },
  });

  // Update search index
  await updatePropertyIndex(id, { isVerified: true, status: 'AVAILABLE' });

  return c.json({
    success: true,
    data: property,
  });
});

// Reject property
app.patch('/properties/:id/reject', async (c) => {
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  const property = await prisma.property.update({
    where: { id },
    data: {
      status: 'UNAVAILABLE',
    },
  });

  // Update search index
  await updatePropertyIndex(id, { status: 'UNAVAILABLE' });

  return c.json({
    success: true,
    data: property,
  });
});

// Get all bookings
app.get('/bookings', async (c) => {
  const { status, page = '1', limit = '20' } = c.req.query();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.propertyBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        property: { select: { title: true, images: { take: 1 } } },
        guest: { select: { firstName: true, lastName: true, email: true } },
        host: { select: { firstName: true, lastName: true } },
        payments: true,
      },
    }),
    prisma.propertyBooking.count({ where }),
  ]);

  return c.json({
    success: true,
    data: bookings,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
});

// Get contact submissions
app.get('/contact-submissions', async (c) => {
  const { isResolved, page = '1', limit = '20' } = c.req.query();

  const where: Record<string, unknown> = {};
  if (isResolved !== undefined) where.isResolved = isResolved === 'true';

  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  return c.json({
    success: true,
    data: submissions,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
});

// Mark contact submission as resolved
app.patch('/contact-submissions/:id/resolve', async (c) => {
  const { id } = c.req.param();

  const submission = await prisma.contactSubmission.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    data: submission,
  });
});

export default app;