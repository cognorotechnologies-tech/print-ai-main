import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { designsRouter } from './designs';
import { authenticate } from '../middleware/auth';
import { designGenerationQueue } from '../queues';
import { prisma } from '../db/prisma';

// Mock dependencies
vi.mock('../queues', () => ({
  designGenerationQueue: {
    add: vi.fn(),
    getJob: vi.fn(),
  },
}));

vi.mock('../db/prisma', () => ({
  prisma: {
    design: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock authentication middleware
vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'CUSTOMER' };
    next();
  }),
  AuthRequest: {},
}));

describe('Design Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/designs', designsRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/designs/generate', () => {
    it('should queue a design generation job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        data: { userId: 'test-user-id', prompt: 'A beautiful sunset', aspectRatio: '16:9' },
      };

      vi.mocked(designGenerationQueue.add).mockResolvedValueOnce(mockJob as any);

      const response = await request(app)
        .post('/api/designs/generate')
        .send({
          prompt: 'A beautiful sunset',
          aspectRatio: '16:9',
        });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({
        message: 'Design generation started',
        jobId: 'job-123',
      });

      expect(designGenerationQueue.add).toHaveBeenCalledWith('generate-design', {
        userId: 'test-user-id',
        prompt: 'A beautiful sunset',
        aspectRatio: '16:9',
      });
    });

    it('should use default aspect ratio when not provided', async () => {
      const mockJob = {
        id: 'job-456',
        data: { userId: 'test-user-id', prompt: 'A mountain landscape', aspectRatio: '1:1' },
      };

      vi.mocked(designGenerationQueue.add).mockResolvedValueOnce(mockJob as any);

      const response = await request(app)
        .post('/api/designs/generate')
        .send({
          prompt: 'A mountain landscape',
        });

      expect(response.status).toBe(202);
      expect(designGenerationQueue.add).toHaveBeenCalledWith('generate-design', {
        userId: 'test-user-id',
        prompt: 'A mountain landscape',
        aspectRatio: '1:1',
      });
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await request(app)
        .post('/api/designs/generate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Prompt is required',
      });
    });

    it('should return 400 when prompt is not a string', async () => {
      const response = await request(app)
        .post('/api/designs/generate')
        .send({
          prompt: 123,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Prompt is required',
      });
    });

    it('should return 500 when queue fails', async () => {
      vi.mocked(designGenerationQueue.add).mockRejectedValueOnce(new Error('Queue error'));

      const response = await request(app)
        .post('/api/designs/generate')
        .send({
          prompt: 'A beautiful sunset',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to start design generation',
      });
    });
  });

  describe('GET /api/designs/job/:jobId', () => {
    it('should return job status for completed job', async () => {
      const mockJob = {
        id: 'job-123',
        data: { userId: 'test-user-id', prompt: 'A sunset' },
        getState: vi.fn().mockResolvedValue('completed'),
        progress: 100,
        returnvalue: {
          designId: 'design-123',
          imageUrl: 'https://cloudinary.com/image.png',
          cloudinaryId: 'designs/user/design-123',
          aiProvider: 'stability',
        },
        failedReason: null,
      };

      vi.mocked(designGenerationQueue.getJob).mockResolvedValueOnce(mockJob as any);

      const response = await request(app).get('/api/designs/job/job-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        jobId: 'job-123',
        state: 'completed',
        progress: 100,
        result: {
          designId: 'design-123',
          imageUrl: 'https://cloudinary.com/image.png',
          cloudinaryId: 'designs/user/design-123',
          aiProvider: 'stability',
        },
        error: null,
      });
    });

    it('should return job status for failed job', async () => {
      const mockJob = {
        id: 'job-456',
        data: { userId: 'test-user-id', prompt: 'A sunset' },
        getState: vi.fn().mockResolvedValue('failed'),
        progress: 50,
        returnvalue: null,
        failedReason: 'AI service timeout',
      };

      vi.mocked(designGenerationQueue.getJob).mockResolvedValueOnce(mockJob as any);

      const response = await request(app).get('/api/designs/job/job-456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        jobId: 'job-456',
        state: 'failed',
        progress: 50,
        result: null,
        error: 'AI service timeout',
      });
    });

    it('should return 404 when job not found', async () => {
      vi.mocked(designGenerationQueue.getJob).mockResolvedValueOnce(null);

      const response = await request(app).get('/api/designs/job/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Job not found',
      });
    });

    it('should return 403 when job belongs to different user', async () => {
      const mockJob = {
        id: 'job-789',
        data: { userId: 'other-user-id', prompt: 'A sunset' },
        getState: vi.fn(),
        progress: 0,
        returnvalue: null,
        failedReason: null,
      };

      vi.mocked(designGenerationQueue.getJob).mockResolvedValueOnce(mockJob as any);

      const response = await request(app).get('/api/designs/job/job-789');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
      });
    });
  });

  describe('GET /api/designs', () => {
    it('should return all designs for authenticated user', async () => {
      const mockDesigns = [
        {
          id: 'design-1',
          userId: 'test-user-id',
          prompt: 'A sunset',
          imageUrl: 'https://cloudinary.com/image1.png',
          cloudinaryId: 'designs/user/design-1',
          aspectRatio: '16:9',
          aiProvider: 'stability',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'design-2',
          userId: 'test-user-id',
          prompt: 'A mountain',
          imageUrl: 'https://cloudinary.com/image2.png',
          cloudinaryId: 'designs/user/design-2',
          aspectRatio: '1:1',
          aiProvider: 'dalle',
          createdAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(prisma.design.findMany).mockResolvedValueOnce(mockDesigns as any);

      const response = await request(app).get('/api/designs');

      expect(response.status).toBe(200);
      expect(response.body.designs).toHaveLength(2);
      expect(response.body.designs[0].id).toBe('design-1');
      expect(response.body.designs[1].id).toBe('design-2');

      expect(prisma.design.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should return empty array when user has no designs', async () => {
      vi.mocked(prisma.design.findMany).mockResolvedValueOnce([]);

      const response = await request(app).get('/api/designs');

      expect(response.status).toBe(200);
      expect(response.body.designs).toEqual([]);
    });

    it('should return 500 when database query fails', async () => {
      vi.mocked(prisma.design.findMany).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/designs');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch designs',
      });
    });
  });

  describe('GET /api/designs/:id', () => {
    it('should return design details for valid design', async () => {
      const mockDesign = {
        id: 'design-123',
        userId: 'test-user-id',
        prompt: 'A beautiful sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-123',
        aspectRatio: '16:9',
        aiProvider: 'stability',
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(mockDesign as any);

      const response = await request(app).get('/api/designs/design-123');

      expect(response.status).toBe(200);
      expect(response.body.design).toMatchObject({
        id: 'design-123',
        userId: 'test-user-id',
        prompt: 'A beautiful sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-123',
        aspectRatio: '16:9',
        aiProvider: 'stability',
      });

      expect(prisma.design.findUnique).toHaveBeenCalledWith({
        where: { id: 'design-123' },
      });
    });

    it('should return 404 when design not found', async () => {
      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(null);

      const response = await request(app).get('/api/designs/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Design not found',
      });
    });

    it('should return 403 when design belongs to different user', async () => {
      const mockDesign = {
        id: 'design-456',
        userId: 'other-user-id',
        prompt: 'A sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-456',
        aspectRatio: '1:1',
        aiProvider: 'dalle',
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(mockDesign as any);

      const response = await request(app).get('/api/designs/design-456');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
      });
    });
  });

  describe('DELETE /api/designs/:id', () => {
    it('should delete design successfully', async () => {
      const mockDesign = {
        id: 'design-123',
        userId: 'test-user-id',
        prompt: 'A sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-123',
        aspectRatio: '16:9',
        aiProvider: 'stability',
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(mockDesign as any);
      vi.mocked(prisma.design.delete).mockResolvedValueOnce(mockDesign as any);

      const response = await request(app).delete('/api/designs/design-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Design deleted successfully',
      });

      expect(prisma.design.delete).toHaveBeenCalledWith({
        where: { id: 'design-123' },
      });
    });

    it('should return 404 when design not found', async () => {
      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(null);

      const response = await request(app).delete('/api/designs/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Design not found',
      });

      expect(prisma.design.delete).not.toHaveBeenCalled();
    });

    it('should return 403 when design belongs to different user', async () => {
      const mockDesign = {
        id: 'design-456',
        userId: 'other-user-id',
        prompt: 'A sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-456',
        aspectRatio: '1:1',
        aiProvider: 'dalle',
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(mockDesign as any);

      const response = await request(app).delete('/api/designs/design-456');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
      });

      expect(prisma.design.delete).not.toHaveBeenCalled();
    });

    it('should return 500 when delete fails', async () => {
      const mockDesign = {
        id: 'design-789',
        userId: 'test-user-id',
        prompt: 'A sunset',
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user/design-789',
        aspectRatio: '16:9',
        aiProvider: 'stability',
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(prisma.design.findUnique).mockResolvedValueOnce(mockDesign as any);
      vi.mocked(prisma.design.delete).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).delete('/api/designs/design-789');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete design',
      });
    });
  });
});
