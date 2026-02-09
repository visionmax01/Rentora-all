import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

// Get my notifications
app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { isRead, page = '1', limit = '20' } = c.req.query();

  const where: Record<string, unknown> = { userId: user.userId };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.notification.count({ where: { userId: user.userId } }),
    prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
  ]);

  return c.json({
    success: true,
    data: notifications,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      unreadCount,
    },
  });
});

// Mark as read
app.patch('/:id/read', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const notification = await prisma.notification.updateMany({
    where: { id, userId: user.userId },
    data: { isRead: true, readAt: new Date() },
  });

  if (notification.count === 0) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: { message: 'Marked as read' },
  });
});

// Mark all as read
app.post('/mark-all-read', authMiddleware, async (c) => {
  const user = c.get('user');

  await prisma.notification.updateMany({
    where: { userId: user.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return c.json({
    success: true,
    data: { message: 'All notifications marked as read' },
  });
});

// Delete notification
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  await prisma.notification.deleteMany({
    where: { id, userId: user.userId },
  });

  return c.json({
    success: true,
    data: { message: 'Notification deleted' },
  });
});

export default app;