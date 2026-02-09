import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      },
    }, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
    }, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return c.json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
    }, 401);
  }

  // Prisma errors
  if (err.code?.startsWith('P')) {
    // Prisma error codes
    if (err.code === 'P2002') {
      return c.json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists',
        },
      }, 409);
    }

    if (err.code === 'P2025') {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      }, 404);
    }

    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
      },
    }, 500);
  }

  // Default error
  const statusCode = (err.status || 500) as ContentfulStatusCode;
  const message = err.message || 'Internal server error';

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    },
  }, statusCode);
};