import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  createOrderFromCart,
  getOrderHistory,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  assignOrderToVendor,
  getOrderStatusHistory,
  updatePaymentStatus,
} from './order';
import { prisma } from '../db/prisma';

// Mock prisma
vi.mock('../db/prisma', () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrderFromCart', () => {
    it('should create order from cart items', async () => {
      const userId = 'user-123';
      const shippingAddress = {
        name: 'John Doe',
        phone: '+919876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      };

      const mockCartItems = [
        {
          id: 'cart-1',
          userId,
          designId: 'design-1',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 1000,
          design: { id: 'design-1', imageUrl: 'url1', prompt: 'prompt1' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
        },
      ];

      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-TEST-123',
        userId,
        vendorId: null,
        status: OrderStatus.PENDING,
        totalAmount: 1000,
        paymentId: null,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddress,
        trackingNumber: null,
        estimatedDelivery: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: mockCartItems.map((item) => ({
          id: 'item-1',
          orderId: 'order-123',
          designId: item.designId,
          fabricId: item.fabricId,
          gsmId: item.gsmId,
          sizeId: item.sizeId,
          colorId: item.colorId,
          quantity: item.quantity,
          price: item.price,
          createdAt: new Date(),
          design: item.design,
          fabric: item.fabric,
          gsm: item.gsm,
          size: item.size,
          color: item.color,
        })),
      };

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockCartItems as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            create: vi.fn().mockResolvedValue(mockOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await createOrderFromCart({ userId, shippingAddress });

      expect(result).toEqual(mockOrder);
      expect(prisma.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
      });
    });

    it('should throw error if cart is empty', async () => {
      const userId = 'user-123';
      const shippingAddress = {
        name: 'John Doe',
        phone: '+919876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      };

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);

      await expect(createOrderFromCart({ userId, shippingAddress })).rejects.toThrow(
        'Cart is empty'
      );
    });
  });

  describe('getOrderHistory', () => {
    it('should retrieve order history for a user', async () => {
      const userId = 'user-123';
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-1',
          userId,
          status: OrderStatus.DELIVERED,
          totalAmount: 1000,
          createdAt: new Date(),
          items: [],
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-2',
          userId,
          status: OrderStatus.SHIPPED,
          totalAmount: 1500,
          createdAt: new Date(),
          items: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const result = await getOrderHistory(userId);

      expect(result).toEqual(mockOrders);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getOrderDetails', () => {
    it('should retrieve order details', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        orderNumber: 'ORD-123',
        userId: 'user-123',
        status: OrderStatus.PAID,
        totalAmount: 1000,
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getOrderDetails(orderId);

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        include: expect.any(Object),
      });
    });

    it('should throw error if order not found', async () => {
      const orderId = 'non-existent';

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(getOrderDetails(orderId)).rejects.toThrow('Order not found');
    });

    it('should throw error if user is not authorized', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        userId: 'user-123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      await expect(getOrderDetails(orderId, 'different-user')).rejects.toThrow(
        'Unauthorized to view this order'
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status with valid transition', async () => {
      const orderId = 'order-123';
      const currentOrder = {
        id: orderId,
        status: OrderStatus.PAID,
      };
      const updatedOrder = {
        ...currentOrder,
        status: OrderStatus.ASSIGNED,
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue(updatedOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await updateOrderStatus(
        orderId,
        OrderStatus.ASSIGNED,
        'admin-123',
        'Assigned to vendor'
      );

      expect(result.status).toBe(OrderStatus.ASSIGNED);
    });

    it('should throw error for invalid status transition', async () => {
      const orderId = 'order-123';
      const currentOrder = {
        id: orderId,
        status: OrderStatus.DELIVERED,
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);

      await expect(
        updateOrderStatus(orderId, OrderStatus.PENDING, 'admin-123')
      ).rejects.toThrow('Invalid status transition');
    });

    it('should throw error if order not found', async () => {
      const orderId = 'non-existent';

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(
        updateOrderStatus(orderId, OrderStatus.ASSIGNED, 'admin-123')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const orderId = 'order-123';
      const userId = 'user-123';
      const currentOrder = {
        id: orderId,
        userId,
        status: OrderStatus.PAID,
      };
      const cancelledOrder = {
        ...currentOrder,
        status: OrderStatus.CANCELLED,
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue(cancelledOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await cancelOrder(orderId, userId, 'Changed my mind');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error if user is not authorized', async () => {
      const orderId = 'order-123';
      const currentOrder = {
        id: orderId,
        userId: 'user-123',
        status: OrderStatus.PAID,
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);

      await expect(cancelOrder(orderId, 'different-user')).rejects.toThrow(
        'Unauthorized to cancel this order'
      );
    });

    it('should throw error if order is already delivered', async () => {
      const orderId = 'order-123';
      const userId = 'user-123';
      const currentOrder = {
        id: orderId,
        userId,
        status: OrderStatus.DELIVERED,
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);

      await expect(cancelOrder(orderId, userId)).rejects.toThrow(
        'Cannot cancel order with status DELIVERED'
      );
    });
  });

  describe('assignOrderToVendor', () => {
    it('should assign order to vendor and calculate estimated delivery', async () => {
      const orderId = 'order-123';
      const vendorId = 'vendor-123';
      const mockVendor = {
        id: vendorId,
        businessName: 'Test Vendor',
        location: 'Mumbai',
        isActive: true,
      };
      const updatedOrder = {
        id: orderId,
        vendorId,
        status: OrderStatus.ASSIGNED,
        estimatedDelivery: new Date(),
        items: [],
      };

      vi.mocked(prisma.vendor.findUnique).mockResolvedValue(mockVendor as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue(updatedOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await assignOrderToVendor(orderId, vendorId, 'admin-123');

      expect(result.vendorId).toBe(vendorId);
      expect(result.status).toBe(OrderStatus.ASSIGNED);
      expect(result.estimatedDelivery).toBeDefined();
    });

    it('should throw error if vendor not found', async () => {
      const orderId = 'order-123';
      const vendorId = 'non-existent';

      vi.mocked(prisma.vendor.findUnique).mockResolvedValue(null);

      await expect(assignOrderToVendor(orderId, vendorId, 'admin-123')).rejects.toThrow(
        'Vendor not found'
      );
    });

    it('should throw error if vendor is not active', async () => {
      const orderId = 'order-123';
      const vendorId = 'vendor-123';
      const mockVendor = {
        id: vendorId,
        isActive: false,
      };

      vi.mocked(prisma.vendor.findUnique).mockResolvedValue(mockVendor as any);

      await expect(assignOrderToVendor(orderId, vendorId, 'admin-123')).rejects.toThrow(
        'Vendor is not active'
      );
    });
  });

  describe('getOrderStatusHistory', () => {
    it('should retrieve order status history', async () => {
      const orderId = 'order-123';
      const mockHistory = [
        {
          id: 'history-1',
          orderId,
          status: OrderStatus.PENDING,
          changedBy: 'user-123',
          createdAt: new Date(),
        },
        {
          id: 'history-2',
          orderId,
          status: OrderStatus.PAID,
          changedBy: 'system',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.orderStatusHistory.findMany).mockResolvedValue(mockHistory as any);

      const result = await getOrderStatusHistory(orderId);

      expect(result).toEqual(mockHistory);
      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to success and change order status to PAID', async () => {
      const orderId = 'order-123';
      const paymentId = 'pay-123';
      const currentOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };
      const updatedOrder = {
        ...currentOrder,
        paymentId,
        paymentStatus: PaymentStatus.SUCCESS,
        status: OrderStatus.PAID,
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue(updatedOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await updatePaymentStatus(orderId, paymentId, PaymentStatus.SUCCESS);

      expect(result.paymentId).toBe(paymentId);
      expect(result.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(result.status).toBe(OrderStatus.PAID);
    });

    it('should update payment status to failed without changing order status', async () => {
      const orderId = 'order-123';
      const paymentId = 'pay-123';
      const currentOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };
      const updatedOrder = {
        ...currentOrder,
        paymentId,
        paymentStatus: PaymentStatus.FAILED,
        items: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(currentOrder as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue(updatedOrder),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await updatePaymentStatus(orderId, paymentId, PaymentStatus.FAILED);

      expect(result.paymentId).toBe(paymentId);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('should throw error if order not found', async () => {
      const orderId = 'non-existent';
      const paymentId = 'pay-123';

      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(
        updatePaymentStatus(orderId, paymentId, PaymentStatus.SUCCESS)
      ).rejects.toThrow('Order not found');
    });
  });
});
