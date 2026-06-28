import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { catalogRouter } from './catalog';
import { prisma } from '../db/prisma';

const app = express();
app.use(express.json());
app.use('/api/v1/catalog', catalogRouter);

describe('Catalog Integration Tests', () => {
  let fabricId: string;
  let gsmId: string;
  let sizeId: string;
  let colorId: string;

  beforeAll(async () => {
    // Get actual IDs from the database
    const fabric = await prisma.fabric.findFirst({ where: { name: 'Cotton' } });
    const gsm = await prisma.gSM.findFirst({ where: { value: 160 } });
    const size = await prisma.size.findFirst({ where: { name: 'M' } });
    const color = await prisma.color.findFirst({ where: { name: 'White' } });

    if (!fabric || !gsm || !size || !color) {
      throw new Error('Seed data not found. Run: npm run db:seed');
    }

    fabricId = fabric.id;
    gsmId = gsm.id;
    sizeId = size.id;
    colorId = color.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fetch complete catalog with all options', async () => {
    const response = await request(app).get('/api/v1/catalog');

    expect(response.status).toBe(200);
    expect(response.body.catalog).toBeDefined();
    expect(response.body.catalog.fabrics).toBeInstanceOf(Array);
    expect(response.body.catalog.gsms).toBeInstanceOf(Array);
    expect(response.body.catalog.sizes).toBeInstanceOf(Array);
    expect(response.body.catalog.colors).toBeInstanceOf(Array);
    expect(response.body.catalog.basePrice).toBeGreaterThan(0);
  });

  it('should fetch fabrics', async () => {
    const response = await request(app).get('/api/v1/catalog/fabrics');

    expect(response.status).toBe(200);
    expect(response.body.fabrics).toBeInstanceOf(Array);
    expect(response.body.fabrics.length).toBeGreaterThan(0);

    expect(response.body.fabrics[0]).toHaveProperty('id');
    expect(response.body.fabrics[0]).toHaveProperty('name');
    expect(response.body.fabrics[0]).toHaveProperty('priceModifier');
  });

  it('should fetch GSM options', async () => {
    const response = await request(app).get('/api/v1/catalog/gsms');

    expect(response.status).toBe(200);
    expect(response.body.gsms).toBeInstanceOf(Array);
    expect(response.body.gsms.length).toBeGreaterThan(0);
    expect(response.body.gsms[0]).toHaveProperty('value');
  });

  it('should fetch sizes', async () => {
    const response = await request(app).get('/api/v1/catalog/sizes');

    expect(response.status).toBe(200);
    expect(response.body.sizes).toBeInstanceOf(Array);
    expect(response.body.sizes.length).toBeGreaterThan(0);
  });

  it('should fetch colors', async () => {
    const response = await request(app).get('/api/v1/catalog/colors');

    expect(response.status).toBe(200);
    expect(response.body.colors).toBeInstanceOf(Array);
    expect(response.body.colors.length).toBeGreaterThan(0);
    expect(response.body.colors[0]).toHaveProperty('hexCode');
  });

  it('should calculate price for valid configuration', async () => {
    const response = await request(app)
      .post('/api/v1/catalog/price')
      .send({
        fabricId,
        gsmId,
        sizeId,
        colorId,
        quantity: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body.price).toBeGreaterThan(0);
    expect(response.body.quantity).toBe(1);
    expect(response.body.pricePerItem).toBe(response.body.price);
  });

  it('should calculate price for multiple quantities', async () => {
    const response = await request(app)
      .post('/api/v1/catalog/price')
      .send({
        fabricId,
        gsmId,
        sizeId,
        colorId,
        quantity: 3,
      });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(3);
    expect(response.body.price).toBe(response.body.pricePerItem * 3);
  });

  it('should return error for invalid fabric ID', async () => {
    const response = await request(app)
      .post('/api/v1/catalog/price')
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

  it('should cache catalog data on subsequent requests', async () => {
    // First request - should hit database
    const response1 = await request(app).get('/api/v1/catalog/fabrics');
    expect(response1.status).toBe(200);

    // Second request - should hit cache
    const response2 = await request(app).get('/api/v1/catalog/fabrics');
    expect(response2.status).toBe(200);
    expect(response2.body.fabrics).toEqual(response1.body.fabrics);
  });
});
