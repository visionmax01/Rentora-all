import { Hono } from 'hono';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { generateTokens, verifyRefreshToken } from '../lib/jwt.js';
import { redis } from '../lib/redis.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmailJob } from '../lib/queue.js';

const app = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
app.post('/register', async (c) => {
  const body = await c.req.json();
  const data = registerSchema.parse(body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return c.json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
    }, 409);
  }

  const hashedPassword = await hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
    },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store session
  await redis.setex(`session:${user.id}`, 7 * 24 * 60 * 60, JSON.stringify({
    refreshToken: tokens.refreshToken,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
  }));

  // Send welcome email
  await sendEmailJob({
    to: user.email,
    subject: 'Welcome to Rentora Nepal!',
    template: 'welcome',
    variables: { firstName: user.firstName },
  });

  return c.json({
    success: true,
    data: { user, tokens },
  }, 201);
});

// Login
app.post('/login', async (c) => {
  const body = await c.req.json();
  const data = loginSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.isActive) {
    return c.json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    }, 401);
  }

  const isValidPassword = await compare(data.password, user.password);

  if (!isValidPassword) {
    return c.json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    }, 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store session
  await redis.setex(`session:${user.id}`, 7 * 24 * 60 * 60, JSON.stringify({
    refreshToken: tokens.refreshToken,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
  }));

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      tokens,
    },
  });
});

// Refresh token
app.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();

  if (!refreshToken) {
    return c.json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Refresh token required' },
    }, 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return c.json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
      }, 401);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      success: true,
      data: { tokens },
    });
  } catch {
    return c.json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
    }, 401);
  }
});

// Logout
app.post('/logout', authMiddleware, async (c) => {
  const user = c.get('user');
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.substring(7);

  // Blacklist the token
  if (token) {
    await redis.setex(`blacklist:${token}`, 15 * 60, '1');
  }

  // Clear session
  await redis.del(`session:${user.userId}`);

  return c.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// Get current user
app.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  const userData = await prisma.user.findUnique({
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
    },
  });

  if (!userData) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: { user: userData },
  });
});

// Forgot password
app.post('/forgot-password', async (c) => {
  const { email } = await c.req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Send password reset email (don't reveal if user exists)
    await sendEmailJob({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      variables: { email },
    });
  }

  return c.json({
    success: true,
    data: { message: 'If the email exists, a reset link has been sent' },
  });
});

export default app;