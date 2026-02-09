import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';
import { indexProperty, updatePropertyIndex, deletePropertyIndex, searchProperties } from '../lib/typesense.js';
import { sendNotificationJob } from '../lib/queue.js';

const app = new Hono();

// Validation schemas
const propertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  type: z.enum(['ROOM', 'APARTMENT', 'HOUSE', 'VILLA', 'OFFICE', 'SHOP', 'LAND', 'HOSTEL', 'HOTEL']),
  price: z.number().positive(),
  priceUnit: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  areaSqFt: z.number().optional(),
  furnished: z.boolean().default(false),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
  minStayDays: z.number().default(1),
  maxStayDays: z.number().optional(),
  images: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

const propertyQuerySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('20'),
  type: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  bedrooms: z.string().optional(),
  furnished: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

// Get all properties
app.get('/', optionalAuth, async (c) => {
  const query = c.req.query();
  const filters = propertyQuerySchema.parse(query);

  const page = parseInt(filters.page);
  const limit = parseInt(filters.limit);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'AVAILABLE' };

  if (filters.type) where.type = filters.type;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, unknown>).gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(filters.maxPrice);
  }
  if (filters.bedrooms) where.bedrooms = parseInt(filters.bedrooms);
  if (filters.furnished) where.furnished = filters.furnished === 'true';

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (filters.sort === 'price_asc') orderBy = { price: 'asc' };
  if (filters.sort === 'price_desc') orderBy = { price: 'desc' };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: { take: 1, where: { isPrimary: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return c.json({
    success: true,
    data: properties,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

// Get property by ID
app.get('/:id', optionalAuth, async (c) => {
  const { id } = c.req.param();

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      },
      _count: { select: { reviews: true, bookings: true } },
    },
  });

  if (!property) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Property not found' },
    }, 404);
  }

  // Increment view count
  await prisma.property.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return c.json({
    success: true,
    data: property,
  });
});

// Create property
app.post('/', authMiddleware, requireRole('HOST', 'ADMIN', 'SUPER_ADMIN'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = propertySchema.parse(body);

  const property = await prisma.property.create({
    data: {
      ...data,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableTo: data.availableTo ? new Date(data.availableTo) : undefined,
      ownerId: user.userId,
      images: data.images ? { create: data.images } : undefined,
    },
    include: {
      images: true,
      owner: { select: { firstName: true, lastName: true } },
    },
  });

  // Index in Typesense
  await indexProperty({
    ...property,
    rating: 0,
    reviewCount: 0,
  });

  return c.json({
    success: true,
    data: property,
  }, 201);
});

// Update property
app.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = propertySchema.partial().parse(body);

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Property not found' },
    }, 404);
  }

  // Check ownership
  if (existing.ownerId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...data,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableTo: data.availableTo ? new Date(data.availableTo) : undefined,
    },
    include: { images: true },
  });

  // Update Typesense index
  await updatePropertyIndex(id, data);

  return c.json({
    success: true,
    data: property,
  });
});

// Delete property
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Property not found' },
    }, 404);
  }

  if (existing.ownerId !== user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  await prisma.property.delete({ where: { id } });
  await deletePropertyIndex(id);

  return c.json({
    success: true,
    data: { message: 'Property deleted' },
  });
});

// Get featured properties
app.get('/featured/list', async (c) => {
  const properties = await prisma.property.findMany({
    where: { isFeatured: true, status: 'AVAILABLE' },
    take: 6,
    include: {
      images: { take: 1, where: { isPrimary: true } },
      owner: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return c.json({
    success: true,
    data: properties,
  });
});

// Get property types
app.get('/meta/types', async (c) => {
  const types = ['ROOM', 'APARTMENT', 'HOUSE', 'VILLA', 'OFFICE', 'SHOP', 'LAND', 'HOSTEL', 'HOTEL'];
  return c.json({
    success: true,
    data: types,
  });
});

// Get cities
app.get('/meta/cities', async (c) => {
  const cities = await prisma.property.groupBy({
    by: ['city'],
    where: { status: 'AVAILABLE' },
    _count: { city: true },
  });

  return c.json({
    success: true,
    data: cities.map(c => ({ name: c.city, count: c._count.city })),
  });
});

export default app;