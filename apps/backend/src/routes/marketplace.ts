import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { indexMarketplaceItem } from '../lib/typesense.js';

const app = new Hono();

const itemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  isNegotiable: z.boolean().default(false),
  city: z.string(),
  address: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('20'),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  condition: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

// Get categories
app.get('/categories', async (c) => {
  const categories = await prisma.marketplaceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return c.json({
    success: true,
    data: categories,
  });
});

// Get all items
app.get('/', optionalAuth, async (c) => {
  const query = c.req.query();
  const filters = querySchema.parse(query);

  const page = parseInt(filters.page);
  const limit = parseInt(filters.limit);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'ACTIVE' };

  if (filters.category) where.categoryId = filters.category;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.condition) where.condition = filters.condition;
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, unknown>).gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(filters.maxPrice);
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (filters.sort === 'price_asc') orderBy = { price: 'asc' };
  if (filters.sort === 'price_desc') orderBy = { price: 'desc' };

  const [items, total] = await Promise.all([
    prisma.marketplaceItem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { name: true } },
        images: { take: 1, where: { isPrimary: true } },
        seller: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.marketplaceItem.count({ where }),
  ]);

  return c.json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

// Get item by ID
app.get('/:id', optionalAuth, async (c) => {
  const { id } = c.req.param();

  const item = await prisma.marketplaceItem.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
      },
    },
  });

  if (!item) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    }, 404);
  }

  // Increment view count
  await prisma.marketplaceItem.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return c.json({
    success: true,
    data: item,
  });
});

// Create item
app.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = itemSchema.parse(body);

  const item = await prisma.marketplaceItem.create({
    data: {
      ...data,
      sellerId: user.userId,
      images: data.images ? { create: data.images } : undefined,
    },
    include: {
      images: true,
      category: true,
    },
  });

  // Index in Typesense
  await indexMarketplaceItem({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category.name,
    condition: item.condition,
    price: Number(item.price),
    isNegotiable: item.isNegotiable,
    city: item.city,
    status: item.status,
    createdAt: item.createdAt,
  });

  return c.json({
    success: true,
    data: item,
  }, 201);
});

// Update item
app.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = itemSchema.partial().parse(body);

  const existing = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    }, 404);
  }

  if (existing.sellerId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  const item = await prisma.marketplaceItem.update({
    where: { id },
    data,
    include: { category: true, images: true },
  });

  return c.json({
    success: true,
    data: item,
  });
});

// Delete item
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    }, 404);
  }

  if (existing.sellerId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  await prisma.marketplaceItem.delete({ where: { id } });

  return c.json({
    success: true,
    data: { message: 'Item deleted' },
  });
});

// Mark as sold
app.patch('/:id/sold', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!existing || existing.sellerId !== user.userId) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    }, 404);
  }

  const item = await prisma.marketplaceItem.update({
    where: { id },
    data: { status: 'SOLD', soldAt: new Date() },
  });

  return c.json({
    success: true,
    data: item,
  });
});

// Get user's listings
app.get('/my/listings', authMiddleware, async (c) => {
  const user = c.get('user');
  const { status } = c.req.query();

  const where: Record<string, unknown> = { sellerId: user.userId };
  if (status) where.status = status;

  const items = await prisma.marketplaceItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      images: { take: 1 },
      _count: { select: { /* messages/conversations */ } },
    },
  });

  return c.json({
    success: true,
    data: items,
  });
});

// Get cities
app.get('/meta/cities', async (c) => {
  const cities = await prisma.marketplaceItem.groupBy({
    by: ['city'],
    where: { status: 'ACTIVE' },
    _count: { city: true },
  });

  return c.json({
    success: true,
    data: cities.map(c => ({ name: c.city, count: c._count.city })),
  });
});

export default app;