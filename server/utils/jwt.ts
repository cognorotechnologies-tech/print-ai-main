import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db/prisma';

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Generate JWT token for user
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
};

/**
 * Create session in database
 */
export const createSession = async (userId: string, token: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

/**
 * Delete session from database
 */
export const deleteSession = async (token: string) => {
  return await prisma.session.deleteMany({
    where: { token },
  });
};

/**
 * Delete all sessions for a user
 */
export const deleteUserSessions = async (userId: string) => {
  return await prisma.session.deleteMany({
    where: { userId },
  });
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async () => {
  return await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

/**
 * Validate session exists and is not expired
 */
export const validateSession = async (token: string): Promise<boolean> => {
  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    await deleteSession(token);
    return false;
  }

  return true;
};
