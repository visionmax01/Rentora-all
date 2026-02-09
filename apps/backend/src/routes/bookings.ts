import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const app = new Hono();

const bookingSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guestsCount: z.number().min(1),
  specialRequests: z.string().optional(),
});

// Create booking
app.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = bookingSchema.parse(body);

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  // Validate dates
  if (checkIn >= checkOut) {
    return c.json({
      success: false,
      error: { code: 'INVALID_DATES', message: 'Check-out must be after check-in' },
    }, 400);
  }

  // Get property
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    include: { owner: true },
  });

  if (!property) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Property not found' },
    }, 404);
  }

  if (property.ownerId === user.userId) {
    return c.json({
      success: false,
      error: { code: 'INVALID_BOOKING', message: 'Cannot book your own property' },
    }, 400);
  }

  // Check availability
  const conflictingBooking = await prisma.propertyBooking.findFirst({
    where: {
      propertyId: data.propertyId,
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      OR: [
        {
          checkIn: { lte: checkIn },
          checkOut: { gt: checkIn },
        },
        {
          checkIn: { lt: checkOut },
          checkOut: { gte: checkOut },
        },
        {
          checkIn: { gte: checkIn },
          checkOut: { lte: checkOut },
        },
      ],
    },
  });

  if (conflictingBooking) {
    return c.json({
      success: false,
      error: { code: 'NOT_AVAILABLE', message: 'Property not available for selected dates' },
    }, 409);
  }

  // Calculate total price
  const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  let totalPrice = Number(property.price);
  
  if (property.priceUnit === 'DAILY') {
    totalPrice = Number(property.price) * days;
  } else if (property.priceUnit === 'WEEKLY') {
    totalPrice = Number(property.price) * Math.ceil(days / 7);
  } else if (property.priceUnit === 'MONTHLY') {
    totalPrice = Number(property.price) * Math.ceil(days / 30);
  }

  // Check minimum stay
  if (days < property.minStayDays) {
    return c.json({
      success: false,
      error: { code: 'MIN_STAY', message: `Minimum stay is ${property.minStayDays} days` },
    }, 400);
  }

  const booking = await prisma.propertyBooking.create({
    data: {
      propertyId: data.propertyId,
      guestId: user.userId,
      hostId: property.ownerId,
      checkIn,
      checkOut,
      guestsCount: data.guestsCount,
      specialRequests: data.specialRequests,
      totalPrice,
      status: 'PENDING',
    },
    include: {
      property: {
        include: { images: { take: 1 } },
      },
      host: {
        select: { firstName: true, lastName: true, phone: true },
      },
    },
  });

  return c.json({
    success: true,
    data: booking,
  }, 201);
});

// Get my bookings (as guest)
app.get('/my', authMiddleware, async (c) => {
  const user = c.get('user');
  const { status, page = '1', limit = '10' } = c.req.query();

  const where: Record<string, unknown> = { guestId: user.userId };
  if (status) where.status = status;

  const bookings = await prisma.propertyBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      property: {
        include: {
          images: { take: 1 },
          owner: { select: { firstName: true, lastName: true } },
        },
      },
      payments: true,
    },
  });

  return c.json({
    success: true,
    data: bookings,
  });
});

// Get bookings for my properties (as host)
app.get('/host', authMiddleware, requireRole('HOST', 'ADMIN', 'SUPER_ADMIN'), async (c) => {
  const user = c.get('user');
  const { status, page = '1', limit = '10' } = c.req.query();

  const where: Record<string, unknown> = { hostId: user.userId };
  if (status) where.status = status;

  const bookings = await prisma.propertyBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      property: { select: { title: true, images: { take: 1 } } },
      guest: { select: { firstName: true, lastName: true, phone: true, email: true } },
      payments: true,
    },
  });

  return c.json({
    success: true,
    data: bookings,
  });
});

// Get booking by ID
app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const booking = await prisma.propertyBooking.findUnique({
    where: { id },
    include: {
      property: {
        include: { images: true },
      },
      guest: {
        select: { firstName: true, lastName: true, phone: true, email: true },
      },
      host: {
        select: { firstName: true, lastName: true, phone: true, email: true },
      },
      payments: true,
      property: {
        include: {
          reviews: {
            where: { reviewerId: user.userId },
          },
        },
      },
    },
  });

  if (!booking) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    }, 404);
  }

  // Check if user is involved
  if (booking.guestId !== user.userId && booking.hostId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  return c.json({
    success: true,
    data: booking,
  });
});

// Confirm booking (host)
app.patch('/:id/confirm', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const booking = await prisma.propertyBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    }, 404);
  }

  if (booking.hostId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  if (booking.status !== 'PENDING') {
    return c.json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Can only confirm pending bookings' },
    }, 400);
  }

  const updated = await prisma.propertyBooking.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    data: updated,
  });
});

// Cancel booking
app.patch('/:id/cancel', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  const booking = await prisma.propertyBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    }, 404);
  }

  if (booking.guestId !== user.userId && booking.hostId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return c.json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Cannot cancel this booking' },
    }, 400);
  }

  const updated = await prisma.propertyBooking.update({
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

export default app;