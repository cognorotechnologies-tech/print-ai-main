import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { cartRouter } from './cart';
import * as cartService from '../services/cart';
import { authenticate } from '../middleware/auth';

vi.mock('../services/cart');
vi.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/cart', cartRouter);

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'CUSTOMER' as const,
};

describe('Cart Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticate middleware to attach user to request
    vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  describe('GET /api/cart', () => {
    it('should return user cart with items', async () => {
      const mockCart = {
        items: [
          {
            id: 'cart-item-1',
            userId: 'user-123',
            designId: 'design-1',
            fabricId: 'fabric-1',
            gsmId: 'gsm-1',
            sizeId: 'size-1',
            colorId: 'color-1',
            quantity: 2,
            price: 738,
            createdAt: new Date(),
            updatedAt: new Date(),
            design: {
              id: 'design-1',
              imageUrl: 'https://example.com/design.jpg',
              prompt: 'Cool design',
            },
            fabric: { id: 'fabric-1', name: 'Cotton' },
            gsm: { id: 'gsm-1', value: 180 },
            size: { id: 'size-1', name: 'M' },
            color: { id: 'color-1', name: 'White', hexCode: '#FFFFFF' },
          },
        ],
        totalItems: 2,
        totalPrice: 738,
      };

      vi.mocked(cartService.getCart).mockResolvedValue(mockCart);

      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(200);
      expect(response.body.cart).toBeDefined();
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.totalItems).toBe(2);
      expect(response.body.cart.totalPrice).toBe(738);
      expect(cartService.getCart).toHaveBeenCalledWith('user-123');
    });

    it('should return empty cart', async () => {
      const mockCart = {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

      vi.mocked(cartService.getCart).mockResolvedValue(mockCart);

      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ cart: mockCart });
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(cartService.getCart).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve cart');
    });
  });

  describe('POST /api/cart/items', () => {
    const validCartItem = {
      designId: 'design-1',
      fabricId: 'fabric-1',
      gsmId: 'gsm-1',
      sizeId: 'size-1',
      colorId: 'color-1',
      quantity: 2,
    };

    const mockCartItemResponse = {
      id: 'cart-item-1',
      userId: 'user-123',
      ...validCartItem,
      price: 738,
      createdAt: new Date(),
      updatedAt: new Date(),
      design: {
        id: 'design-1',
        imageUrl: 'https://example.com/design.jpg',
        prompt: 'Cool design',
      },
      fabric: { id: 'fabric-1', name: 'Cotton' },
      gsm: { id: 'gsm-1', value: 180 },
      size: { id: 'size-1', name: 'M' },
      color: { id: 'color-1', name: 'White', hexCode: '#FFFFFF' },
    };

    it('should add item to cart', async () => {
      vi.mocked(cartService.addToCart).mockResolvedValue(mockCartItemResponse);

      const response = await request(app)
        .post('/api/cart/items')
        .send(validCartItem);

      expect(response.status).toBe(201);
      expect(response.body.item).toBeDefined();
      expect(response.body.item.id).toBe('cart-item-1');
      expect(response.body.item.quantity).toBe(2);
      expect(response.body.item.price).toBe(738);
      expect(cartService.addToCart).toHaveBeenCalledWith({
        userId: 'user-123',
        ...validCartItem,
      });
    });

    it('should default quantity to 1 if not provided', async () => {
      const itemWithoutQuantity = { ...validCartItem };
      delete (itemWithoutQuantity as any).quantity;

      vi.mocked(cartService.addToCart).mockResolvedValue(mockCartItemResponse);

      const response = await request(app)
        .post('/api/cart/items')
        .send(itemWithoutQuantity);

      expect(response.status).toBe(201);
      expect(cartService.addToCart).toHaveBeenCalledWith({
        userId: 'user-123',
        ...itemWithoutQuantity,
        quantity: 1,
      });
    });

    it('should return 400 for missing designId', async () => {
      const invalidItem = { ...validCartItem };
      delete (invalidItem as any).designId;

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for missing fabricId', async () => {
      const invalidItem = { ...validCartItem };
      delete (invalidItem as any).fabricId;

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for non-string IDs', async () => {
      const invalidItem = { ...validCartItem, designId: 123 };

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('All configuration IDs must be strings');
    });

    it('should return 400 for invalid quantity (zero)', async () => {
      const invalidItem = { ...validCartItem, quantity: 0 };

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 400 for invalid quantity (negative)', async () => {
      const invalidItem = { ...validCartItem, quantity: -1 };

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 400 for invalid quantity (non-integer)', async () => {
      const invalidItem = { ...validCartItem, quantity: 2.5 };

      const response = await request(app)
        .post('/api/cart/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 400 for design not found', async () => {
      vi.mocked(cartService.addToCart).mockRejectedValue(new Error('Design not found'));

      const response = await request(app)
        .post('/api/cart/items')
        .send(validCartItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Design not found');
    });

    it('should return 400 for inactive fabric', async () => {
      vi.mocked(cartService.addToCart).mockRejectedValue(
        new Error('Invalid or inactive fabric')
      );

      const response = await request(app)
        .post('/api/cart/items')
        .send(validCartItem);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or inactive fabric');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .post('/api/cart/items')
        .send(validCartItem);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(cartService.addToCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/cart/items')
        .send(validCartItem);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to add item to cart');
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    const mockUpdatedItem = {
      id: 'cart-item-1',
      userId: 'user-123',
      designId: 'design-1',
      fabricId: 'fabric-1',
      gsmId: 'gsm-1',
      sizeId: 'size-1',
      colorId: 'color-1',
      quantity: 5,
      price: 1845,
      createdAt: new Date(),
      updatedAt: new Date(),
      design: {
        id: 'design-1',
        imageUrl: 'https://example.com/design.jpg',
        prompt: 'Cool design',
      },
      fabric: { id: 'fabric-1', name: 'Cotton' },
      gsm: { id: 'gsm-1', value: 180 },
      size: { id: 'size-1', name: 'M' },
      color: { id: 'color-1', name: 'White', hexCode: '#FFFFFF' },
    };

    it('should update cart item quantity', async () => {
      vi.mocked(cartService.updateCartItem).mockResolvedValue(mockUpdatedItem);

      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.item).toBeDefined();
      expect(response.body.item.id).toBe('cart-item-1');
      expect(response.body.item.quantity).toBe(5);
      expect(response.body.item.price).toBe(1845);
      expect(cartService.updateCartItem).toHaveBeenCalledWith('cart-item-1', 'user-123', 5);
    });

    it('should return 400 for missing quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Quantity is required');
    });

    it('should return 400 for invalid quantity (zero)', async () => {
      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 400 for invalid quantity (negative)', async () => {
      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 400 for invalid quantity (non-integer)', async () => {
      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 3.5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Quantity must be a positive integer');
    });

    it('should return 404 for cart item not found', async () => {
      vi.mocked(cartService.updateCartItem).mockRejectedValue(
        new Error('Cart item not found')
      );

      const response = await request(app)
        .put('/api/cart/items/nonexistent-id')
        .send({ quantity: 3 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Cart item not found');
    });

    it('should return 403 for unauthorized update attempt', async () => {
      vi.mocked(cartService.updateCartItem).mockRejectedValue(
        new Error('Unauthorized to update this cart item')
      );

      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 3 });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to update this cart item');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 3 });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(cartService.updateCartItem).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 3 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update cart item');
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('should remove cart item', async () => {
      vi.mocked(cartService.removeFromCart).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/cart/items/cart-item-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Item removed from cart successfully' });
      expect(cartService.removeFromCart).toHaveBeenCalledWith('cart-item-1', 'user-123');
    });

    it('should return 404 for cart item not found', async () => {
      vi.mocked(cartService.removeFromCart).mockRejectedValue(
        new Error('Cart item not found')
      );

      const response = await request(app).delete('/api/cart/items/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Cart item not found');
    });

    it('should return 403 for unauthorized removal attempt', async () => {
      vi.mocked(cartService.removeFromCart).mockRejectedValue(
        new Error('Unauthorized to remove this cart item')
      );

      const response = await request(app).delete('/api/cart/items/cart-item-1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to remove this cart item');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app).delete('/api/cart/items/cart-item-1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(cartService.removeFromCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).delete('/api/cart/items/cart-item-1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to remove cart item');
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear all cart items', async () => {
      vi.mocked(cartService.clearCart).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/cart');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Cart cleared successfully' });
      expect(cartService.clearCart).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app).delete('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(cartService.clearCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).delete('/api/cart');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to clear cart');
    });
  });
});
