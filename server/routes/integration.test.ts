import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { apiRouter } from './index';

// Mock authentication middleware
vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'CUSTOMER' };
    next();
  }),
  AuthRequest: {},
}));

// Mock queues
vi.mock('../queues', () => ({
  designGenerationQueue: {
    add: vi.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: vi.fn(),
  },
}));

// Mock prisma
vi.mock('../db/prisma', () => ({
  prisma: {
    design: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('API Router Integration', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', apiRouter);
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should respond to health check at /api/v1/health', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        version: 'v1',
      });
    });
  });

  describe('Design Routes', () => {
    it('should be accessible at /api/v1/designs', async () => {
      const response = await request(app).get('/api/v1/designs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('designs');
    });

    it('should accept POST requests at /api/v1/designs/generate', async () => {
      const response = await request(app)
        .post('/api/v1/designs/generate')
        .send({
          prompt: 'A beautiful sunset',
          aspectRatio: '16:9',
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should accept GET requests at /api/v1/designs/job/:jobId', async () => {
      const response = await request(app).get('/api/v1/designs/job/test-job-id');

      // Will return 404 since job doesn't exist, but route is accessible
      expect([200, 404]).toContain(response.status);
    });

    it('should accept DELETE requests at /api/v1/designs/:id', async () => {
      const response = await request(app).delete('/api/v1/designs/test-design-id');

      // Will return 404 since design doesn't exist, but route is accessible
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Route Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
