import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const app = new Hono();

const serviceBookingSchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string(),
  address: z.string(),
  city: z.string(),
  notes: z.string().optional(),
});

// Get all service categories
app.get('/categories', async (c) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return c.json({
    success: true,
    data: categories,
  });
});

// Get services by category
app.get('/category/:categoryId', async (c) => {
  const { categoryId } = c.req.param();

  const services = await prisma.service.findMany({
    where: { categoryId, isActive: true },
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  return c.json({
    success: true,
    data: services,
  });
});

// Get all services
app.get('/', async (c) => {
  const { category, city } = c.req.query();

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.categoryId = category;

  const services = await prisma.service.findMany({
    where,
    include: {
      category: { select: { name: true, icon: true } },
      providers: city ? { where: { city, isActive: true } } : { where: { isActive: true } },
      _count: { select: { bookings: true } },
    },
  });

  return c.json({
    success: true,
    data: services,
  });
});

// Get service providers
app.get('/providers', async (c) => {
  const { serviceId, city } = c.req.query();

  const where: Record<string, unknown> = { isActive: true };
  if (serviceId) where.serviceId = serviceId;
  if (city) where.city = city;

  const providers = await prisma.serviceProvider.findMany({
    where,
    orderBy: { rating: 'desc' },
  });

  return c.json({
    success: true,
    data: providers,
  });
});

// Get service by ID
app.get('/:id', async (c) => {
  const { id } = c.req.param();

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
      providers: {
        where: { isActive: true },
        orderBy: { rating: 'desc' },
      },
    },
  });

  if (!service) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: service,
  });
});

// Book a service
app.post('/bookings', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = serviceBookingSchema.parse(body);

  // Check if provider exists and is active
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: data.providerId, isActive: true },
  });

  if (!provider) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service provider not found' },
    }, 404);
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      ...data,
      scheduledDate: new Date(data.scheduledDate),
      userId: user.userId,
      status: 'PENDING',
    },
    include: {
      service: true,
      provider: true,
    },
  });

  return c.json({
    success: true,
    data: booking,
  }, 201);
});

// Get user's service bookings
app.get('/bookings/my', authMiddleware, async (c) => {
  const user = c.get('user');
  const { status, page = '1', limit = '10' } = c.req.query();

  const where: Record<string, unknown> = { userId: user.userId };
  if (status) where.status = status;

  const bookings = await prisma.serviceBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      service: { include: { category: true } },
      provider: true,
    },
  });

  return c.json({
    success: true,
    data: bookings,
  });
});

// Cancel booking
app.patch('/bookings/:id/cancel', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  const booking = await prisma.serviceBooking.findUnique({
    where: { id },
  });

  if (!booking || booking.userId !== user.userId) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    }, 404);
  }

  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    return c.json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Cannot cancel this booking' },
    }, 400);
  }

  const updated = await prisma.serviceBooking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  return c.json({
    success: true,
    data: updated,
  });
});

// Admin: Create service
app.post('/', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const body = await c.req.json();
  
  const service = await prisma.service.create({
    data: body,
  });

  return c.json({
    success: true,
    data: service,
  }, 201);
});

// Admin: Create service provider
app.post('/providers', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const body = await c.req.json();
  
  const provider = await prisma.serviceProvider.create({
    data: body,
  });

  return c.json({
    success: true,
    data: provider,
  }, 201);
});

export default app;