import { createMiddleware } from 'hono/factory';
import { verify } from 'jsonwebtoken';
import type { JWTPayload } from '../types/auth.js';
import { redis } from '../lib/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const authMiddleware = createMiddleware<{
  Variables: {
    user: JWTPayload;
  };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token required',
      },
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked',
        },
      }, 401);
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    }, 401);
  }
});

export const requireRole = (...allowedRoles: string[]) => {
  return createMiddleware<{
    Variables: {
      user: JWTPayload;
    };
  }>(async (c, next) => {
    const user = c.get('user');
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      }, 403);
    }

    await next();
  });
};

export const optionalAuth = createMiddleware<{
  Variables: {
    user?: JWTPayload;
  };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (!isBlacklisted) {
      const decoded = verify(token, JWT_SECRET) as JWTPayload;
      c.set('user', decoded);
    }
  } catch {
    // Ignore errors for optional auth
  }

  await next();
});