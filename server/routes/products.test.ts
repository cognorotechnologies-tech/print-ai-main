import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { productsRouter } from './products';
import * as catalogService from '../services/catalog';

// Mock the catalog service
vi.mock('../services/catalog');

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Products Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products/catalog', () => {
    it('should return complete catalog', async () => {
      const mockCatalog = {
        fabrics: [{ id: 'f1', name: 'Cotton', priceModifier: 0, isActive: true }],
        gsms: [{ id: 'g1', value: 160, priceModifier: 0, isActive: true }],
        sizes: [{ id: 's1', name: 'M', priceModifier: 0, isActive: true }],
        colors: [{ id: 'c1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true }],
        basePrice: 299,
      };

      vi.mocked(catalogService.getCatalog).mockResolvedValue(mockCatalog);

      const response = await request(app).get('/api/products/catalog');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ catalog: mockCatalog });
      expect(catalogService.getCatalog).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching catalog', async () => {
      vi.mocked(catalogService.getCatalog).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/products/catalog');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch catalog' });
    });
  });

  describe('GET /api/products/options', () => {
    it('should return configuration options', async () => {
      const mockCatalog = {
        fabrics: [{ id: 'f1', name: 'Cotton', priceModifier: 0, isActive: true }],
        gsms: [{ id: 'g1', value: 160, priceModifier: 0, isActive: true }],
        sizes: [{ id: 's1', name: 'M', priceModifier: 0, isActive: true }],
        colors: [{ id: 'c1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true }],
        basePrice: 299,
      };

      vi.mocked(catalogService.getCatalog).mockResolvedValue(mockCatalog);

      const response = await request(app).get('/api/products/options');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ options: mockCatalog });
      expect(catalogService.getCatalog).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching options', async () => {
      vi.mocked(catalogService.getCatalog).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/products/options');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch product options' });
    });
  });

  describe('POST /api/products/price', () => {
    const validConfig = {
      fabricId: 'fabric-1',
      gsmId: 'gsm-1',
      sizeId: 'size-1',
      colorId: 'color-1',
      quantity: 2,
    };

    it('should calculate price for valid configuration', async () => {
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(738);

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        price: 738,
        quantity: 2,
        pricePerItem: 369,
      });
      expect(catalogService.calculatePrice).toHaveBeenCalledWith(
        'fabric-1',
        'gsm-1',
        'size-1',
        'color-1',
        2
      );
    });

    it('should use default quantity of 1 when not provided', async () => {
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(369);

      const config = { ...validConfig };
      delete (config as any).quantity;

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        price: 369,
        quantity: 1,
        pricePerItem: 369,
      });
      expect(catalogService.calculatePrice).toHaveBeenCalledWith(
        'fabric-1',
        'gsm-1',
        'size-1',
        'color-1',
        1
      );
    });

    it('should return 400 when fabricId is missing', async () => {
      const config = { ...validConfig };
      delete (config as any).fabricId;

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when gsmId is missing', async () => {
      const config = { ...validConfig };
      delete (config as any).gsmId;

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when sizeId is missing', async () => {
      const config = { ...validConfig };
      delete (config as any).sizeId;

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when colorId is missing', async () => {
      const config = { ...validConfig };
      delete (config as any).colorId;

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 when IDs are not strings', async () => {
      const config = {
        fabricId: 123,
        gsmId: 'gsm-1',
        sizeId: 'size-1',
        colorId: 'color-1',
      };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be strings');
    });

    it('should return 400 when quantity is less than 1', async () => {
      const config = { ...validConfig, quantity: 0 };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be an integer between 1 and 100');
    });

    it('should return 400 when quantity is greater than 100', async () => {
      const config = { ...validConfig, quantity: 101 };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be an integer between 1 and 100');
    });

    it('should return 400 when quantity is not an integer', async () => {
      const config = { ...validConfig, quantity: 2.5 };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be an integer between 1 and 100');
    });

    it('should return 400 when quantity is not a number', async () => {
      const config = { ...validConfig, quantity: 'two' };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be an integer between 1 and 100');
    });

    it('should return 400 when fabric is invalid or inactive', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Invalid or inactive fabric')
      );

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive fabric');
    });

    it('should return 400 when GSM is invalid or inactive', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Invalid or inactive GSM')
      );

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive GSM');
    });

    it('should return 400 when size is invalid or inactive', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Invalid or inactive size')
      );

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive size');
    });

    it('should return 400 when color is invalid or inactive', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Invalid or inactive color')
      );

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive color');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(catalogService.calculatePrice).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/products/price')
        .send(validConfig);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to calculate price');
    });

    it('should handle maximum quantity correctly', async () => {
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(36900);

      const config = { ...validConfig, quantity: 100 };

      const response = await request(app)
        .post('/api/products/price')
        .send(config);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        price: 36900,
        quantity: 100,
        pricePerItem: 369,
      });
    });
  });
});
