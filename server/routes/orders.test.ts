import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ordersRouter } from './orders';
import * as orderService from '../services/order';
import { authenticate } from '../middleware/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

vi.mock('../services/order');
vi.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'CUSTOMER' as const,
};

describe('Order Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticate middleware to attach user to request
    vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  describe('POST /api/orders', () => {
    const validShippingAddress = {
      name: 'John Doe',
      phone: '+919876543210',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
    };

    const mockOrderResponse = {
      id: 'order-123',
      orderNumber: 'ORD-ABC123',
      userId: 'user-123',
      vendorId: null,
      status: OrderStatus.PENDING,
      totalAmount: 1500,
      paymentId: null,
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress: validShippingAddress,
      trackingNumber: null,
      estimatedDelivery: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          designId: 'design-1',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 750,
          design: { id: 'design-1', imageUrl: 'https://example.com/design.jpg', prompt: 'Cool design' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'White', hexCode: '#FFFFFF' },
        },
      ],
    };

    it('should create order from cart', async () => {
      vi.mocked(orderService.createOrderFromCart).mockResolvedValue(mockOrderResponse);

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: validShippingAddress });

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe('order-123');
      expect(response.body.order.orderNumber).toBe('ORD-ABC123');
      expect(response.body.order.status).toBe(OrderStatus.PENDING);
      expect(response.body.order.totalAmount).toBe(1500);
      expect(orderService.createOrderFromCart).toHaveBeenCalledWith({
        userId: 'user-123',
        shippingAddress: validShippingAddress,
      });
    });

    it('should create order without optional addressLine2', async () => {
      const addressWithoutLine2 = { ...validShippingAddress };
      delete (addressWithoutLine2 as any).addressLine2;

      vi.mocked(orderService.createOrderFromCart).mockResolvedValue(mockOrderResponse);

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: addressWithoutLine2 });

      expect(response.status).toBe(201);
      expect(orderService.createOrderFromCart).toHaveBeenCalledWith({
        userId: 'user-123',
        shippingAddress: addressWithoutLine2,
      });
    });

    it('should return 400 for missing shippingAddress', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Shipping address is required');
    });

    it('should return 400 for missing name', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).name;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('name');
    });

    it('should return 400 for missing phone', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).phone;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('phone');
    });

    it('should return 400 for missing addressLine1', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).addressLine1;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('addressLine1');
    });

    it('should return 400 for missing city', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).city;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('city');
    });

    it('should return 400 for missing state', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).state;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('state');
    });

    it('should return 400 for missing pincode', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).pincode;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('pincode');
    });

    it('should return 400 for missing country', async () => {
      const invalidAddress = { ...validShippingAddress };
      delete (invalidAddress as any).country;

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required shipping address fields');
      expect(response.body.error).toContain('country');
    });

    it('should return 400 for non-string name', async () => {
      const invalidAddress = { ...validShippingAddress, name: 123 };

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All shipping address fields must be strings');
    });

    it('should return 400 for non-string addressLine2', async () => {
      const invalidAddress = { ...validShippingAddress, addressLine2: 123 };

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: invalidAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('addressLine2 must be a string if provided');
    });

    it('should return 400 for empty cart', async () => {
      vi.mocked(orderService.createOrderFromCart).mockRejectedValue(
        new Error('Cart is empty')
      );

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: validShippingAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cart is empty');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: validShippingAddress });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(orderService.createOrderFromCart).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/orders')
        .send({ shippingAddress: validShippingAddress });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create order');
    });
  });

  describe('GET /api/orders', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-123',
        vendorId: null,
        status: OrderStatus.PENDING,
        totalAmount: 1500,
        paymentId: null,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddress: {},
        trackingNumber: null,
        estimatedDelivery: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        items: [],
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-DEF456',
        userId: 'user-123',
        vendorId: 'vendor-1',
        status: OrderStatus.SHIPPED,
        totalAmount: 2000,
        paymentId: 'pay-123',
        paymentStatus: PaymentStatus.SUCCESS,
        shippingAddress: {},
        trackingNumber: 'TRACK123',
        estimatedDelivery: new Date('2024-01-20'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        items: [],
      },
    ];

    it('should return order history', async () => {
      vi.mocked(orderService.getOrderHistory).mockResolvedValue(mockOrders);

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0].id).toBe('order-1');
      expect(response.body.orders[1].id).toBe('order-2');
      expect(orderService.getOrderHistory).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array for no orders', async () => {
      vi.mocked(orderService.getOrderHistory).mockResolvedValue([]);

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body.orders).toEqual([]);
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(orderService.getOrderHistory).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve order history');
    });
  });

  describe('GET /api/orders/:id', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-ABC123',
      userId: 'user-123',
      vendorId: 'vendor-1',
      status: OrderStatus.SHIPPED,
      totalAmount: 1500,
      paymentId: 'pay-123',
      paymentStatus: PaymentStatus.SUCCESS,
      shippingAddress: {
        name: 'John Doe',
        phone: '+919876543210',
        addressLine1: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
      trackingNumber: 'TRACK123',
      estimatedDelivery: new Date('2024-01-20'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-18'),
      items: [
        {
          id: 'item-1',
          designId: 'design-1',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 750,
          design: { id: 'design-1', imageUrl: 'https://example.com/design.jpg', prompt: 'Cool design' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'White', hexCode: '#FFFFFF' },
        },
      ],
    };

    it('should return order details', async () => {
      vi.mocked(orderService.getOrderDetails).mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/orders/order-123');

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe('order-123');
      expect(response.body.order.orderNumber).toBe('ORD-ABC123');
      expect(response.body.order.status).toBe(OrderStatus.SHIPPED);
      expect(response.body.order.items).toHaveLength(1);
      expect(orderService.getOrderDetails).toHaveBeenCalledWith('order-123', 'user-123');
    });

    it('should return 404 for order not found', async () => {
      vi.mocked(orderService.getOrderDetails).mockRejectedValue(
        new Error('Order not found')
      );

      const response = await request(app).get('/api/orders/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });

    it('should return 403 for unauthorized access', async () => {
      vi.mocked(orderService.getOrderDetails).mockRejectedValue(
        new Error('Unauthorized to view this order')
      );

      const response = await request(app).get('/api/orders/order-123');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to view this order');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app).get('/api/orders/order-123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(orderService.getOrderDetails).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/api/orders/order-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve order details');
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    const mockCancelledOrder = {
      id: 'order-123',
      orderNumber: 'ORD-ABC123',
      userId: 'user-123',
      vendorId: null,
      status: OrderStatus.CANCELLED,
      totalAmount: 1500,
      paymentId: null,
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress: {},
      trackingNumber: null,
      estimatedDelivery: null,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-16'),
      items: [],
    };

    it('should cancel order', async () => {
      vi.mocked(orderService.cancelOrder).mockResolvedValue(mockCancelledOrder);

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe('order-123');
      expect(response.body.order.status).toBe(OrderStatus.CANCELLED);
      expect(orderService.cancelOrder).toHaveBeenCalledWith('order-123', 'user-123', undefined);
    });

    it('should cancel order with reason', async () => {
      vi.mocked(orderService.cancelOrder).mockResolvedValue(mockCancelledOrder);

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({ reason: 'Changed my mind' });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe(OrderStatus.CANCELLED);
      expect(orderService.cancelOrder).toHaveBeenCalledWith('order-123', 'user-123', 'Changed my mind');
    });

    it('should return 400 for non-string reason', async () => {
      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({ reason: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Reason must be a string if provided');
    });

    it('should return 404 for order not found', async () => {
      vi.mocked(orderService.cancelOrder).mockRejectedValue(
        new Error('Order not found')
      );

      const response = await request(app)
        .put('/api/orders/nonexistent-id/cancel')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });

    it('should return 403 for unauthorized cancellation', async () => {
      vi.mocked(orderService.cancelOrder).mockRejectedValue(
        new Error('Unauthorized to cancel this order')
      );

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to cancel this order');
    });

    it('should return 400 for already delivered order', async () => {
      vi.mocked(orderService.cancelOrder).mockRejectedValue(
        new Error('Cannot cancel order with status DELIVERED')
      );

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot cancel order with status DELIVERED');
    });

    it('should return 400 for already cancelled order', async () => {
      vi.mocked(orderService.cancelOrder).mockRejectedValue(
        new Error('Cannot cancel order with status CANCELLED')
      );

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot cancel order with status CANCELLED');
    });

    it('should return 401 if user not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(orderService.cancelOrder).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .put('/api/orders/order-123/cancel')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to cancel order');
    });
  });
});
