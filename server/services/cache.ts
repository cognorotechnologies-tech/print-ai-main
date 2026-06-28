import { redisService } from './redis';
import { logger } from '../utils/logger';

export class CacheService {
  private defaultTTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisService.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await redisService.set(key, data, ttl);
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisService.del(key);
    } catch (error) {
      logger.error('Cache del error', { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidate pattern error', { pattern, error });
    }
  }
}

export const cacheService = new CacheService();
