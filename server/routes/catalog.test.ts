import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { catalogRouter } from './catalog';
import * as catalogService from '../services/catalog';

vi.mock('../services/catalog');

const app = express();
app.use(express.json());
app.use('/api/v1/catalog', catalogRouter);

describe('Catalog Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/catalog', () => {
    it('should return complete catalog', async () => {
      const mockCatalog = {
        fabrics: [{ id: '1', name: 'Cotton', priceModifier: 0, isActive: true }],
        gsms: [{ id: '1', value: 160, priceModifier: 0, isActive: true }],
        sizes: [{ id: '1', name: 'M', priceModifier: 0, isActive: true }],
        colors: [{ id: '1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true }],
        basePrice: 299,
      };

      vi.mocked(catalogService.getCatalog).mockResolvedValue(mockCatalog);

      const response = await request(app).get('/api/v1/catalog');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ catalog: mockCatalog });
    });

    it('should return 500 on service error', async () => {
      vi.mocked(catalogService.getCatalog).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/catalog');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch catalog' });
    });
  });

  describe('GET /api/v1/catalog/fabrics', () => {
    it('should return all fabrics', async () => {
      const mockFabrics = [
        { id: '1', name: 'Cotton', priceModifier: 0, isActive: true },
        { id: '2', name: 'Polyester', priceModifier: 50, isActive: true },
      ];

      vi.mocked(catalogService.getFabrics).mockResolvedValue(mockFabrics);

      const response = await request(app).get('/api/v1/catalog/fabrics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ fabrics: mockFabrics });
    });
  });

  describe('GET /api/v1/catalog/gsms', () => {
    it('should return all GSM options', async () => {
      const mockGSMs = [
        { id: '1', value: 160, priceModifier: 0, isActive: true },
        { id: '2', value: 180, priceModifier: 20, isActive: true },
      ];

      vi.mocked(catalogService.getGSMs).mockResolvedValue(mockGSMs);

      const response = await request(app).get('/api/v1/catalog/gsms');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ gsms: mockGSMs });
    });
  });

  describe('GET /api/v1/catalog/sizes', () => {
    it('should return all sizes', async () => {
      const mockSizes = [
        { id: '1', name: 'M', priceModifier: 0, isActive: true },
        { id: '2', name: 'L', priceModifier: 0, isActive: true },
      ];

      vi.mocked(catalogService.getSizes).mockResolvedValue(mockSizes);

      const response = await request(app).get('/api/v1/catalog/sizes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sizes: mockSizes });
    });
  });

  describe('GET /api/v1/catalog/colors', () => {
    it('should return all colors', async () => {
      const mockColors = [
        { id: '1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true },
        { id: '2', name: 'Black', hexCode: '#000000', priceModifier: 0, isActive: true },
      ];

      vi.mocked(catalogService.getColors).mockResolvedValue(mockColors);

      const response = await request(app).get('/api/v1/catalog/colors');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ colors: mockColors });
    });
  });

  describe('POST /api/v1/catalog/price', () => {
    it('should calculate price for valid configuration', async () => {
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(738);

      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
          quantity: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        price: 738,
        quantity: 2,
        pricePerItem: 369,
      });
      expect(catalogService.calculatePrice).toHaveBeenCalledWith(
        'fabric1',
        'gsm1',
        'size1',
        'color1',
        2
      );
    });

    it('should use quantity 1 if not provided', async () => {
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(369);

      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
        });

      expect(response.status).toBe(200);
      expect(catalogService.calculatePrice).toHaveBeenCalledWith(
        'fabric1',
        'gsm1',
        'size1',
        'color1',
        1
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
          quantity: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be between 1 and 100');
    });

    it('should return 400 for quantity over 100', async () => {
      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
          quantity: 101,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be between 1 and 100');
    });

    it('should return 400 for inactive options', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Invalid or inactive fabric')
      );

      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive fabric');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/v1/catalog/price')
        .send({
          fabricId: 'fabric1',
          gsmId: 'gsm1',
          sizeId: 'size1',
          colorId: 'color1',
          quantity: 1,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to calculate price');
    });
  });
});
