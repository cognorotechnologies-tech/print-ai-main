import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db/prisma';
import { Role } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as {
        userId: string;
        email: string;
        role: Role;
      };

      // Verify user still exists and is not deleted
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }

      req.user = {
        id: user.id,
        email: user.email!,
        role: user.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as {
        userId: string;
        email: string;
        role: Role;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      });

      if (user && !user.deletedAt) {
        req.user = {
          id: user.id,
          email: user.email!,
          role: user.role,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};
