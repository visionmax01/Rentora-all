import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const app = new Hono();

// Get page by slug
app.get('/:slug', async (c) => {
  const { slug } = c.req.param();

  const page = await prisma.page.findUnique({
    where: { slug },
  });

  if (!page || !page.isPublished) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Page not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: page,
  });
});

// Admin: Get all pages
app.get('/', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const pages = await prisma.page.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return c.json({
    success: true,
    data: pages,
  });
});

// Admin: Create page
app.post('/', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const body = await c.req.json();

  const page = await prisma.page.create({
    data: body,
  });

  return c.json({
    success: true,
    data: page,
  }, 201);
});

// Admin: Update page
app.put('/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  const page = await prisma.page.update({
    where: { id },
    data: body,
  });

  return c.json({
    success: true,
    data: page,
  });
});

// Admin: Delete page
app.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { id } = c.req.param();

  await prisma.page.delete({ where: { id } });

  return c.json({
    success: true,
    data: { message: 'Page deleted' },
  });
});

export default app;