import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../services/redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limiting middleware using Redis
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redisClient.zcard(key);

      if (requestCount >= maxRequests) {
        logger.warn(`Rate limit exceeded for ${key}`);
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Add current request
      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await redisClient.expire(key, Math.ceil(windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - requestCount - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data: any) {
          const shouldSkip =
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip) {
            // Remove the request we just added
            redisClient
              .zremrangebyscore(key, now, now)
              .catch((err: Error) => logger.error('Failed to remove rate limit entry:', err));
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      // Don't block request if rate limiting fails
      next();
    }
  };
};

/**
 * Strict rate limit for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    // Use email or mobile from request body if available
    const identifier = req.body?.email || req.body?.mobile || req.ip;
    return identifier;
  },
});

/**
 * General API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

/**
 * Strict rate limit for OTP endpoints
 */
export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3,
  keyGenerator: (req) => {
    const mobile = req.body?.mobile || req.ip;
    return `otp:${mobile}`;
  },
});
