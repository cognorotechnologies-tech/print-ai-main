import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as paymentService from './payment';
import { prisma } from '../db/prisma';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../db/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('./order', () => ({
  updatePaymentStatus: vi.fn(),
}));

vi.mock('razorpay', () => {
  return {
    default: function MockRazorpay() {
      return {
        orders: {
          create: vi.fn(),
        },
        payments: {
          fetch: vi.fn(),
          refund: vi.fn(),
        },
      };
    },
  };
});

vi.mock('../config', () => ({
  config: {
    payment: {
      razorpayKeyId: 'test_key_id',
      razorpayKeySecret: 'test_secret',
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

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRazorpayOrder', () => {
    it('should throw error for invalid amount', async () => {
      const input = {
        orderId: 'order-123',
        amount: 0,
      };

      await expect(paymentService.createRazorpayOrder(input)).rejects.toThrow(
        'Amount must be greater than zero'
      );
    });
  });

  describe('verifyPaymentSignature', () => {
    it('should verify valid payment signature', () => {
      const razorpayOrderId = 'order_test123';
      const razorpayPaymentId = 'pay_test456';
      const secret = 'test_secret'; // Use the mocked secret

      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const razorpaySignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const result = paymentService.verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      expect(result).toBe(true);
    });

    it('should reject invalid payment signature', () => {
      const result = paymentService.verifyPaymentSignature({
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test456',
        razorpaySignature: 'invalid_signature',
      });

      expect(result).toBe(false);
    });

    it('should handle verification errors gracefully', () => {
      const result = paymentService.verifyPaymentSignature({
        razorpayOrderId: '',
        razorpayPaymentId: '',
        razorpaySignature: '',
      });

      expect(result).toBe(false);
    });
  });

  describe('handlePaymentCallback', () => {
    it('should process payment callback successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        totalAmount: 500,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.PENDING,
      };

      const mockUpdatedOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.SUCCESS,
        status: OrderStatus.PAID,
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      const { updatePaymentStatus } = await import('./order');
      (updatePaymentStatus as any).mockResolvedValue(mockUpdatedOrder);
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 2 });

      const razorpayOrderId = 'order_test123';
      const razorpayPaymentId = 'pay_test456';
      const secret = 'test_secret'; // Use the mocked secret
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const razorpaySignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const input = {
        orderId: 'order-123',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      };

      const result = await paymentService.handlePaymentCallback(input);

      expect(result.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(updatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        razorpayPaymentId,
        PaymentStatus.SUCCESS
      );
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should handle idempotent callback (already processed)', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        totalAmount: 500,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentId: 'pay_test456',
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const input = {
        orderId: 'order-123',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test456',
        razorpaySignature: 'any_signature',
      };

      const result = await paymentService.handlePaymentCallback(input);

      expect(result.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(result.paymentId).toBe('pay_test456');
    });

    it('should reject callback with invalid signature', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        totalAmount: 500,
        paymentStatus: PaymentStatus.PENDING,
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const input = {
        orderId: 'order-123',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test456',
        razorpaySignature: 'invalid_signature',
      };

      await expect(paymentService.handlePaymentCallback(input)).rejects.toThrow(
        'Invalid payment signature'
      );
    });

    it('should throw error if order not found', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      const input = {
        orderId: 'order-123',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test456',
        razorpaySignature: 'any_signature',
      };

      await expect(paymentService.handlePaymentCallback(input)).rejects.toThrow(
        'Order not found'
      );
    });
  });

  describe('processRefund', () => {
    it('should throw error if order not found', async () => {
      (prisma.order.findFirst as any).mockResolvedValue(null);

      const input = {
        paymentId: 'pay_test456',
      };

      await expect(paymentService.processRefund(input)).rejects.toThrow(
        'Order not found for payment ID'
      );
    });
  });

  describe('logPaymentTransaction', () => {
    it('should log payment transaction without throwing errors', async () => {
      const transaction = {
        orderId: 'order-123',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test456',
        amount: 500,
        currency: 'INR',
        status: 'success',
      };

      await expect(
        paymentService.logPaymentTransaction(transaction)
      ).resolves.not.toThrow();
    });

    it('should not throw error even if logging fails', async () => {
      const transaction = {
        orderId: 'order-123',
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: null,
        amount: 500,
        currency: 'INR',
        status: 'created',
      };

      await expect(
        paymentService.logPaymentTransaction(transaction)
      ).resolves.not.toThrow();
    });
  });

  describe('fetchPaymentDetails', () => {
    it('should handle fetch errors', async () => {
      await expect(
        paymentService.fetchPaymentDetails('pay_invalid')
      ).rejects.toThrow('Failed to fetch payment details');
    });
  });
});
