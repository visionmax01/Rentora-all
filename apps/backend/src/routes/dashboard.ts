import { Hono } from 'hono';
import { prisma } from '@rentora/database';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

// User dashboard stats
app.get('/user', authMiddleware, async (c) => {
  const user = c.get('user');

  const [
    propertyCount,
    bookingCount,
    favoriteCount,
    reviewCount,
    notificationCount,
    upcomingBookings,
    recentListings,
  ] = await Promise.all([
    prisma.property.count({ where: { ownerId: user.userId } }),
    prisma.propertyBooking.count({ where: { guestId: user.userId } }),
    prisma.favoriteProperty.count({ where: { userId: user.userId } }),
    prisma.review.count({ where: { reviewerId: user.userId } }),
    prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
    prisma.propertyBooking.findMany({
      where: {
        guestId: user.userId,
        checkIn: { gte: new Date() },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      orderBy: { checkIn: 'asc' },
      take: 5,
      include: {
        property: {
          include: { images: { take: 1 } },
        },
      },
    }),
    prisma.marketplaceItem.findMany({
      where: { sellerId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { images: { take: 1 } },
    }),
  ]);

  return c.json({
    success: true,
    data: {
      stats: {
        propertyCount,
        bookingCount,
        favoriteCount,
        reviewCount,
        notificationCount,
      },
      upcomingBookings,
      recentListings,
    },
  });
});

// Host dashboard stats
app.get('/host', authMiddleware, async (c) => {
  const user = c.get('user');

  const [
    totalProperties,
    activeProperties,
    totalBookings,
    pendingBookings,
    totalEarnings,
    recentBookings,
    occupancyRate,
  ] = await Promise.all([
    prisma.property.count({ where: { ownerId: user.userId } }),
    prisma.property.count({ where: { ownerId: user.userId, status: 'AVAILABLE' } }),
    prisma.propertyBooking.count({ where: { hostId: user.userId } }),
    prisma.propertyBooking.count({ where: { hostId: user.userId, status: 'PENDING' } }),
    prisma.propertyBooking.aggregate({
      where: { hostId: user.userId, status: 'CHECKED_OUT' },
      _sum: { totalPrice: true },
    }),
    prisma.propertyBooking.findMany({
      where: { hostId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        property: { select: { title: true, images: { take: 1 } } },
        guest: { select: { firstName: true, lastName: true } },
      },
    }),
    // This is simplified - in production you'd calculate actual occupancy
    prisma.propertyBooking.count({
      where: {
        hostId: user.userId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lte: new Date() },
        checkOut: { gte: new Date() },
      },
    }),
  ]);

  return c.json({
    success: true,
    data: {
      stats: {
        totalProperties,
        activeProperties,
        totalBookings,
        pendingBookings,
        totalEarnings: totalEarnings._sum.totalPrice || 0,
        occupancyRate,
      },
      recentBookings,
    },
  });
});

export default app;