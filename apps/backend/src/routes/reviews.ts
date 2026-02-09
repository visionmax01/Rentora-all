import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000).optional(),
  propertyId: z.string().uuid().optional(),
  serviceBookingId: z.string().uuid().optional(),
});

// Create review
app.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = reviewSchema.parse(body);

  // Validate that at least one entity is being reviewed
  if (!data.propertyId && !data.serviceBookingId) {
    return c.json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Must specify property or service booking' },
    }, 400);
  }

  // Check if user has completed booking for this property
  if (data.propertyId) {
    const completedBooking = await prisma.propertyBooking.findFirst({
      where: {
        propertyId: data.propertyId,
        guestId: user.userId,
        status: 'CHECKED_OUT',
      },
    });

    if (!completedBooking && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return c.json({
        success: false,
        error: { code: 'NOT_ELIGIBLE', message: 'Can only review after staying' },
      }, 403);
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: user.userId,
        propertyId: data.propertyId,
      },
    });

    if (existingReview) {
      return c.json({
        success: false,
        error: { code: 'ALREADY_REVIEWED', message: 'You have already reviewed this property' },
      }, 409);
    }

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      }, 404);
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        reviewerId: user.userId,
        revieweeId: property.ownerId,
      },
      include: {
        reviewer: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update property rating
    const reviews = await prisma.review.findMany({
      where: { propertyId: data.propertyId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.property.update({
      where: { id: data.propertyId },
      data: { rating: avgRating, reviewCount: reviews.length },
    });

    return c.json({
      success: true,
      data: review,
    }, 201);
  }

  // Service booking review
  if (data.serviceBookingId) {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: data.serviceBookingId },
    });

    if (!booking || booking.userId !== user.userId) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      }, 404);
    }

    if (booking.status !== 'COMPLETED') {
      return c.json({
        success: false,
        error: { code: 'NOT_COMPLETED', message: 'Can only review completed services' },
      }, 400);
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        reviewerId: user.userId,
        revieweeId: booking.providerId,
      },
    });

    return c.json({
      success: true,
      data: review,
    }, 201);
  }

  return c.json({
    success: false,
    error: { code: 'INVALID_REQUEST', message: 'Invalid review request' },
  }, 400);
});

// Get property reviews
app.get('/property/:propertyId', async (c) => {
  const { propertyId } = c.req.param();
  const { page = '1', limit = '10' } = c.req.query();

  const reviews = await prisma.review.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      reviewer: {
        select: { firstName: true, lastName: true, avatar: true },
      },
    },
  });

  const stats = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return c.json({
    success: true,
    data: reviews,
    meta: {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
    },
  });
});

// Get user's reviews
app.get('/my', authMiddleware, async (c) => {
  const user = c.get('user');

  const reviews = await prisma.review.findMany({
    where: { reviewerId: user.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: { title: true, images: { take: 1 } },
      },
    },
  });

  return c.json({
    success: true,
    data: reviews,
  });
});

// Update review
app.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = reviewSchema.partial().parse(body);

  const existing = await prisma.review.findUnique({
    where: { id },
  });

  if (!existing || existing.reviewerId !== user.userId) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found' },
    }, 404);
  }

  const review = await prisma.review.update({
    where: { id },
    data,
  });

  // Update property rating if applicable
  if (review.propertyId) {
    const reviews = await prisma.review.findMany({
      where: { propertyId: review.propertyId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.property.update({
      where: { id: review.propertyId },
      data: { rating: avgRating },
    });
  }

  return c.json({
    success: true,
    data: review,
  });
});

// Delete review
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await prisma.review.findUnique({
    where: { id },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Review not found' },
    }, 404);
  }

  if (existing.reviewerId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  const propertyId = existing.propertyId;
  await prisma.review.delete({ where: { id } });

  // Update property rating
  if (propertyId) {
    const reviews = await prisma.review.findMany({
      where: { propertyId },
      select: { rating: true },
    });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    await prisma.property.update({
      where: { id: propertyId },
      data: { rating: avgRating, reviewCount: reviews.length },
    });
  }

  return c.json({
    success: true,
    data: { message: 'Review deleted' },
  });
});

export default app;