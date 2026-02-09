import { sign, verify } from 'jsonwebtoken';
import type { JWTPayload } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '900'); // 15 minutes
const JWT_REFRESH_EXPIRES_IN = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800'); // 7 days

export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const accessToken = sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = sign({ userId: payload.userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
  };
}

export function verifyAccessToken(token: string): JWTPayload {
  return verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return verify(token, JWT_REFRESH_SECRET) as { userId: string };
}

export function generatePasswordResetToken(userId: string): string {
  return sign({ userId, type: 'password_reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

export function verifyPasswordResetToken(token: string): { userId: string; type: string } {
  return verify(token, JWT_SECRET) as { userId: string; type: string };
}