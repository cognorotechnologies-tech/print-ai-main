import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { productsRouter } from './products';
import * as mockupService from '../services/mockup';
import { prisma } from '../db/prisma';

// Mock services
vi.mock('../services/mockup');
vi.mock('../db/prisma', () => ({
  prisma: {
    color: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('POST /api/products/mockup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate mockup with valid request', async () => {
    const mockColor = {
      name: 'Red',
      hexCode: '#FF0000',
      isActive: true,
    };

    const mockMockup = {
      mockupUrl: 'https://res.cloudinary.com/test/mockup-url',
      colorName: 'Red',
      placement: 'front',
    };

    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);
    vi.mocked(mockupService.generateMockup).mockResolvedValue(mockMockup);

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'color-123',
        placement: 'front',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mockup: mockMockup });
    expect(mockupService.generateMockup).toHaveBeenCalledWith({
      designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
      colorHex: '#FF0000',
      colorName: 'Red',
      placement: 'front',
    });
  });

  it('should use default placement when not specified', async () => {
    const mockColor = {
      name: 'Blue',
      hexCode: '#0000FF',
      isActive: true,
    };

    const mockMockup = {
      mockupUrl: 'https://res.cloudinary.com/test/mockup-url',
      colorName: 'Blue',
      placement: 'front',
    };

    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);
    vi.mocked(mockupService.generateMockup).mockResolvedValue(mockMockup);

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'color-123',
      });

    expect(response.status).toBe(200);
    expect(mockupService.generateMockup).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'front',
      })
    );
  });

  it('should return 400 for invalid request', async () => {
    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({
      valid: false,
      error: 'designUrl is required',
    });

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        colorId: 'color-123',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'designUrl is required' });
  });

  it('should return 404 when color not found', async () => {
    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(null);

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'invalid-color-id',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Color not found' });
  });

  it('should return 400 when color is inactive', async () => {
    const mockColor = {
      name: 'Red',
      hexCode: '#FF0000',
      isActive: false,
    };

    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'color-123',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Color is not active' });
  });

  it('should return 500 when mockup generation fails', async () => {
    const mockColor = {
      name: 'Red',
      hexCode: '#FF0000',
      isActive: true,
    };

    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);
    vi.mocked(mockupService.generateMockup).mockRejectedValue(
      new Error('Cloudinary error')
    );

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'color-123',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to generate mockup' });
  });

  it('should handle back placement', async () => {
    const mockColor = {
      name: 'Green',
      hexCode: '#00FF00',
      isActive: true,
    };

    const mockMockup = {
      mockupUrl: 'https://res.cloudinary.com/test/mockup-url',
      colorName: 'Green',
      placement: 'back',
    };

    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({ valid: true });
    vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);
    vi.mocked(mockupService.generateMockup).mockResolvedValue(mockMockup);

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorId: 'color-123',
        placement: 'back',
      });

    expect(response.status).toBe(200);
    expect(response.body.mockup.placement).toBe('back');
  });

  it('should validate all required fields', async () => {
    vi.mocked(mockupService.validateMockupRequest).mockReturnValue({
      valid: false,
      error: 'colorId is required and must be a string',
    });

    const response = await request(app)
      .post('/api/products/mockup')
      .send({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('colorId');
  });
});
