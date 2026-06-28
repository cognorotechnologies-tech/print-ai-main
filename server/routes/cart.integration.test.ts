import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { cartRouter } from './cart';
import { prisma } from '../db/prisma';
import { config } from '../config';

const app = express();
app.use(express.json());
app.use('/api/cart', cartRouter);

describe('Cart Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let designId: string;
  let fabricId: string;
  let gsmId: string;
  let sizeId: string;
  let colorId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `cart-test-${Date.now()}@example.com`,
        password: 'hashedpassword',
        role: 'CUSTOMER',
      },
    });
    userId = user.id;

    // Generate JWT token
    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create a test design
    const design = await prisma.design.create({
      data: {
        userId: user.id,
        prompt: 'Test design for cart',
        imageUrl: 'https://example.com/test-design.jpg',
        cloudinaryId: 'test-design-id',
        aspectRatio: '1:1',
        aiProvider: 'stability',
      },
    });
    designId = design.id;

    // Get catalog IDs
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

  beforeEach(async () => {
    // Clear cart before each test
    await prisma.cartItem.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.design.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cart).toBeDefined();
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.cart.totalItems).toBe(0);
      expect(response.body.cart.totalPrice).toBe(0);
    });

    it('should return cart with items', async () => {
      // Add an item to cart first
      await prisma.cartItem.create({
        data: {
          userId,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 2,
          price: 738,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].quantity).toBe(2);
      expect(response.body.cart.items[0].price).toBe(738);
      expect(response.body.cart.totalItems).toBe(2);
      expect(response.body.cart.totalPrice).toBe(738);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add new item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.item).toBeDefined();
      expect(response.body.item.quantity).toBe(1);
      expect(response.body.item.price).toBeGreaterThan(0);
      expect(response.body.item.design.id).toBe(designId);

      // Verify in database
      const cartItems = await prisma.cartItem.findMany({ where: { userId } });
      expect(cartItems).toHaveLength(1);
    });

    it('should update quantity if item already exists', async () => {
      // Add item first time
      const response1 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 2,
        });

      expect(response1.status).toBe(201);
      const firstPrice = response1.body.item.price;

      // Add same item again
      const response2 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 3,
        });

      expect(response2.status).toBe(201);
      expect(response2.body.item.quantity).toBe(5); // 2 + 3
      expect(response2.body.item.price).toBeGreaterThan(firstPrice);

      // Verify only one item in database
      const cartItems = await prisma.cartItem.findMany({ where: { userId } });
      expect(cartItems).toHaveLength(1);
    });

    it('should return 400 for invalid design ID', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId: 'invalid-design-id',
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Design not found');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId,
          fabricId,
          // Missing gsmId, sizeId, colorId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Create a cart item for testing
      const cartItem = await prisma.cartItem.create({
        data: {
          userId,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 2,
          price: 738,
        },
      });
      cartItemId = cartItem.id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(5);
      expect(response.body.item.price).toBeGreaterThan(738);

      // Verify in database
      const updatedItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });
      expect(updatedItem?.quantity).toBe(5);
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .put('/api/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Cart item not found');
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(401);
    });

    it('should return 403 when trying to update another user cart item', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'CUSTOMER',
        },
      });

      // Create cart item for other user
      const otherCartItem = await prisma.cartItem.create({
        data: {
          userId: otherUser.id,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
          price: 369,
        },
      });

      // Try to update with current user's token
      const response = await request(app)
        .put(`/api/cart/items/${otherCartItem.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to update this cart item');

      // Cleanup
      await prisma.cartItem.delete({ where: { id: otherCartItem.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Create a cart item for testing
      const cartItem = await prisma.cartItem.create({
        data: {
          userId,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 2,
          price: 738,
        },
      });
      cartItemId = cartItem.id;
    });

    it('should remove cart item', async () => {
      const response = await request(app)
        .delete(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Item removed from cart successfully');

      // Verify in database
      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });
      expect(deletedItem).toBeNull();
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .delete('/api/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Cart item not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).delete(`/api/cart/items/${cartItemId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when trying to delete another user cart item', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'CUSTOMER',
        },
      });

      // Create cart item for other user
      const otherCartItem = await prisma.cartItem.create({
        data: {
          userId: otherUser.id,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 1,
          price: 369,
        },
      });

      // Try to delete with current user's token
      const response = await request(app)
        .delete(`/api/cart/items/${otherCartItem.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to remove this cart item');

      // Cleanup
      await prisma.cartItem.delete({ where: { id: otherCartItem.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      // Get another size for second item
      const largeSize = await prisma.size.findFirst({ where: { name: 'L' } });
      const largeSizeId = largeSize?.id || sizeId;

      // Add multiple items to cart with different configurations
      await prisma.cartItem.createMany({
        data: [
          {
            userId,
            designId,
            fabricId,
            gsmId,
            sizeId,
            colorId,
            quantity: 2,
            price: 738,
          },
          {
            userId,
            designId,
            fabricId: fabricId,
            gsmId: gsmId,
            sizeId: largeSizeId, // Different size to avoid unique constraint violation
            colorId: colorId,
            quantity: 1,
            price: 369,
          },
        ],
      });
    });

    it('should clear all cart items', async () => {
      // Verify items exist
      const itemsBefore = await prisma.cartItem.findMany({ where: { userId } });
      expect(itemsBefore.length).toBeGreaterThan(0);

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cart cleared successfully');

      // Verify all items removed
      const itemsAfter = await prisma.cartItem.findMany({ where: { userId } });
      expect(itemsAfter).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/cart');

      expect(response.status).toBe(401);
    });
  });

  describe('Cart workflow', () => {
    it('should support complete cart workflow', async () => {
      // 1. Start with empty cart
      let response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.body.cart.items).toHaveLength(0);

      // 2. Add first item
      response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity: 2,
        });
      expect(response.status).toBe(201);
      const firstItemId = response.body.item.id;

      // 3. Verify cart has one item
      response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.totalItems).toBe(2);

      // 4. Update quantity
      response = await request(app)
        .put(`/api/cart/items/${firstItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });
      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(5);

      // 5. Verify updated quantity
      response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.body.cart.totalItems).toBe(5);

      // 6. Remove item
      response = await request(app)
        .delete(`/api/cart/items/${firstItemId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);

      // 7. Verify cart is empty
      response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.body.cart.items).toHaveLength(0);
    });
  });
});
