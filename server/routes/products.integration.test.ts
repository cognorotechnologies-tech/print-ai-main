import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { productsRouter } from './products';
import { prisma } from '../db/prisma';

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Products Router Integration Tests', () => {
  let fabricId: string;
  let gsmId: string;
  let sizeId: string;
  let colorId: string;

  beforeAll(async () => {
    // Get actual IDs from the database
    const fabric = await prisma.fabric.findFirst({ where: { isActive: true } });
    const gsm = await prisma.gSM.findFirst({ where: { isActive: true } });
    const size = await prisma.size.findFirst({ where: { isActive: true } });
    const color = await prisma.color.findFirst({ where: { isActive: true } });

    if (!fabric || !gsm || !size || !color) {
      throw new Error('Database not seeded with catalog data');
    }

    fabricId = fabric.id;
    gsmId = gsm.id;
    sizeId = size.id;
    colorId = color.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/products/catalog', () => {
    it('should return complete catalog from database', async () => {
      const response = await request(app).get('/api/products/catalog');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('catalog');
      expect(response.body.catalog).toHaveProperty('fabrics');
      expect(response.body.catalog).toHaveProperty('gsms');
      expect(response.body.catalog).toHaveProperty('sizes');
      expect(response.body.catalog).toHaveProperty('colors');
      expect(response.body.catalog).toHaveProperty('basePrice');

      // Verify data structure
      expect(Array.isArray(response.body.catalog.fabrics)).toBe(true);
      expect(Array.isArray(response.body.catalog.gsms)).toBe(true);
      expect(Array.isArray(response.body.catalog.sizes)).toBe(true);
      expect(Array.isArray(response.body.catalog.colors)).toBe(true);
      expect(typeof response.body.catalog.basePrice).toBe('number');

      // Verify at least one item in each category
      expect(response.body.catalog.fabrics.length).toBeGreaterThan(0);
      expect(response.body.catalog.gsms.length).toBeGreaterThan(0);
      expect(response.body.catalog.sizes.length).toBeGreaterThan(0);
      expect(response.body.catalog.colors.length).toBeGreaterThan(0);
    });

    it('should return only active catalog items', async () => {
      const response = await request(app).get('/api/products/catalog');

      expect(response.status).toBe(200);

      // All items should be active
      response.body.catalog.fabrics.forEach((fabric: any) => {
        expect(fabric.isActive).toBe(true);
      });
      response.body.catalog.gsms.forEach((gsm: any) => {
        expect(gsm.isActive).toBe(true);
      });
      response.body.catalog.sizes.forEach((size: any) => {
        expect(size.isActive).toBe(true);
      });
      response.body.catalog.colors.forEach((color: any) => {
        expect(color.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/products/options', () => {
    it('should return configuration options from database', async () => {
      const response = await request(app).get('/api/products/options');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveProperty('fabrics');
      expect(response.body.options).toHaveProperty('gsms');
      expect(response.body.options).toHaveProperty('sizes');
      expect(response.body.options).toHaveProperty('colors');
      expect(response.body.options).toHaveProperty('basePrice');
    });
  });

  describe('POST /api/products/price', () => {
    it('should calculate price with real database data', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('quantity');
      expect(response.body).toHaveProperty('pricePerItem');
      expect(response.body.quantity).toBe(1);
      expect(response.body.price).toBe(response.body.pricePerItem);
      expect(typeof response.body.price).toBe('number');
      expect(response.body.price).toBeGreaterThan(0);
    });

    it('should calculate price for multiple quantities', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(5);
      expect(response.body.price).toBe(response.body.pricePerItem * 5);
    });

    it('should return 400 for invalid fabric ID', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId: 'invalid-id',
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive');
    });

    it('should return 400 for invalid GSM ID', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId: 'invalid-id',
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive');
    });

    it('should return 400 for invalid size ID', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId,
          sizeId: 'invalid-id',
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive');
    });

    it('should return 400 for invalid color ID', async () => {
      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId,
          sizeId,
          colorId: 'invalid-id',
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive');
    });

    it('should verify price calculation formula', async () => {
      // Get the actual modifiers from database
      const fabric = await prisma.fabric.findUnique({ where: { id: fabricId } });
      const gsm = await prisma.gSM.findUnique({ where: { id: gsmId } });
      const size = await prisma.size.findUnique({ where: { id: sizeId } });
      const color = await prisma.color.findUnique({ where: { id: colorId } });
      const pricing = await prisma.pricing.findFirst({ 
        where: { isActive: true },
        orderBy: { effectiveFrom: 'desc' }
      });

      expect(fabric).toBeTruthy();
      expect(gsm).toBeTruthy();
      expect(size).toBeTruthy();
      expect(color).toBeTruthy();
      expect(pricing).toBeTruthy();

      const expectedPricePerItem = 
        pricing!.basePrice + 
        fabric!.priceModifier + 
        gsm!.priceModifier + 
        size!.priceModifier + 
        color!.priceModifier;

      const response = await request(app)
        .post('/api/products/price')
        .send({
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.pricePerItem).toBe(expectedPricePerItem);
      expect(response.body.price).toBe(expectedPricePerItem * 3);
    });
  });
});
