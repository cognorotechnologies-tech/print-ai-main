import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE imports
vi.mock('../services/payment', () => ({
  createRazorpayOrder: vi.fn(),
  handlePaymentCallback: vi.fn(),
  processRefund: vi.fn(),
}));

vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { paymentsRouter } from './payments';
import * as paymentService from '../services/payment';
import { authenticate } from '../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payment Routes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'CUSTOMER',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticate middleware
    vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
      req.user = mockUser;
      next();
      return Promise.resolve(undefined);
    });
  });

  describe('POST /api/payments/create', () => {
    it('should create Razorpay order successfully', async () => {
      const mockRazorpayOrder = {
        razorpayOrderId: 'order_123',
        amount: 50000,
        currency: 'INR',
        keyId: 'rzp_test_key',
      };

      vi.mocked(paymentService.createRazorpayOrder).mockResolvedValue(mockRazorpayOrder);

      const response = await request(app)
        .post('/api/payments/create')
        .send({
          orderId: 'order-123',
          amount: 500,
          currency: 'INR',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockRazorpayOrder);
      expect(paymentService.createRazorpayOrder).toHaveBeenCalledWith({
        orderId: 'order-123',
        amount: 500,
        currency: 'INR',
      });
    });

    it('should return 400 for missing orderId', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send({
          amount: 500,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send({
          orderId: 'order-123',
          amount: -100,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation((req: any, res, next) => {
        req.user = undefined;
        next();
        return Promise.resolve(undefined);
      });

      const response = await request(app)
        .post('/api/payments/create')
        .send({
          orderId: 'order-123',
          amount: 500,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      vi.mocked(paymentService.createRazorpayOrder).mockRejectedValue(
        new Error('Razorpay API error')
      );

      const response = await request(app)
        .post('/api/payments/create')
        .send({
          orderId: 'order-123',
          amount: 500,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create payment order');
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify payment successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-123',
        userId: 'user-123',
        status: 'PAID',
        paymentStatus: 'SUCCESS',
        totalAmount: 500,
      };

      vi.mocked(paymentService.handlePaymentCallback).mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: 'order-123',
          razorpayOrderId: 'order_razorpay_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'signature_123',
        });

      expect(response.status).toBe(200);
      expect(response.body.order).toEqual(mockOrder);
      expect(paymentService.handlePaymentCallback).toHaveBeenCalledWith({
        orderId: 'order-123',
        razorpayOrderId: 'order_razorpay_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'signature_123',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: 'order-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for invalid signature', async () => {
      vi.mocked(paymentService.handlePaymentCallback).mockRejectedValue(
        new Error('Invalid payment signature')
      );

      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: 'order-123',
          razorpayOrderId: 'order_razorpay_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'invalid_signature',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid payment signature');
    });

    it('should return 404 when order not found', async () => {
      vi.mocked(paymentService.handlePaymentCallback).mockRejectedValue(
        new Error('Order not found')
      );

      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: 'nonexistent-order',
          razorpayOrderId: 'order_razorpay_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'signature_123',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });

    it('should handle idempotent requests', async () => {
      const mockOrder = {
        id: 'order-123',
        paymentStatus: 'SUCCESS',
      };

      vi.mocked(paymentService.handlePaymentCallback).mockResolvedValue(mockOrder as any);

      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: 'order-123',
          razorpayOrderId: 'order_razorpay_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'signature_123',
        });

      expect(response.status).toBe(200);
      expect(response.body.order.paymentStatus).toBe('SUCCESS');
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process full refund successfully', async () => {
      const mockRefund = {
        refundId: 'rfnd_123',
        amount: 50000,
        currency: 'INR',
        status: 'processed',
      };

      vi.mocked(paymentService.processRefund).mockResolvedValue(mockRefund);

      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          paymentId: 'pay_123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRefund);
      expect(paymentService.processRefund).toHaveBeenCalledWith({
        paymentId: 'pay_123',
      });
    });

    it('should process partial refund successfully', async () => {
      const mockRefund = {
        refundId: 'rfnd_123',
        amount: 25000,
        currency: 'INR',
        status: 'processed',
      };

      vi.mocked(paymentService.processRefund).mockResolvedValue(mockRefund);

      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          paymentId: 'pay_123',
          amount: 250,
          reason: 'Customer requested partial refund',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRefund);
      expect(paymentService.processRefund).toHaveBeenCalledWith({
        paymentId: 'pay_123',
        amount: 250,
        reason: 'Customer requested partial refund',
      });
    });

    it('should return 400 for missing paymentId', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          amount: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          paymentId: 'pay_123',
          amount: -50,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 404 when payment not found', async () => {
      vi.mocked(paymentService.processRefund).mockRejectedValue(
        new Error('Order not found for payment ID')
      );

      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          paymentId: 'nonexistent_payment',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found for payment ID');
    });

    it('should handle refund processing errors', async () => {
      vi.mocked(paymentService.processRefund).mockRejectedValue(
        new Error('Refund processing failed: Insufficient balance')
      );

      const response = await request(app)
        .post('/api/payments/refund')
        .send({
          paymentId: 'pay_123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Refund processing failed');
    });
  });
});
