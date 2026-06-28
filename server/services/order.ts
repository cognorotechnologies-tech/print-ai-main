import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface CreateOrderInput {
  userId: string;
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  vendorId: string | null;
  status: OrderStatus;
  totalAmount: number;
  paymentId: string | null;
  paymentStatus: PaymentStatus;
  shippingAddress: any;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  designId: string;
  fabricId: string;
  gsmId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
  price: number;
  design: { id: string; imageUrl: string; prompt: string };
  fabric: { id: string; name: string };
  gsm: { id: string; value: number };
  size: { id: string; name: string };
  color: { id: string; name: string; hexCode: string };
}


const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  ASSIGNED: [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  IN_PRODUCTION: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const calculateEstimatedDelivery = (vendorLocation?: string): Date => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  return deliveryDate;
};

const isValidTransition = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
};


export const createOrderFromCart = async (input: CreateOrderInput): Promise<OrderResponse> => {
  try {
    const { userId, shippingAddress } = input;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        design: { select: { id: true, imageUrl: true, prompt: true } },
        fabric: { select: { id: true, name: true } },
        gsm: { select: { id: true, value: true } },
        size: { select: { id: true, name: true } },
        color: { select: { id: true, name: true, hexCode: true } },
      },
    });
    if (cartItems.length === 0) throw new Error('Cart is empty');
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
    const orderNumber = generateOrderNumber();
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber, userId, status: OrderStatus.PENDING,
          totalAmount, paymentStatus: PaymentStatus.PENDING, shippingAddress,
          items: {
            create: cartItems.map((item) => ({
              designId: item.designId, fabricId: item.fabricId,
              gsmId: item.gsmId, sizeId: item.sizeId,
              colorId: item.colorId, quantity: item.quantity, price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              design: { select: { id: true, imageUrl: true, prompt: true } },
              fabric: { select: { id: true, name: true } },
              gsm: { select: { id: true, value: true } },
              size: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, hexCode: true } },
            },
          },
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: newOrder.id, status: OrderStatus.PENDING, changedBy: userId, notes: 'Order created' },
      });
      return newOrder;
    });
    logger.info('Order created from cart', { orderId: order.id, orderNumber: order.orderNumber, userId, totalAmount, itemCount: cartItems.length });
    return order;
  } catch (error) {
    logger.error('Error creating order from cart', { error, input });
    throw error;
  }
};


export const getOrderHistory = async (userId: string): Promise<OrderResponse[]> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            design: { select: { id: true, imageUrl: true, prompt: true } },
            fabric: { select: { id: true, name: true } },
            gsm: { select: { id: true, value: true } },
            size: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, hexCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    logger.debug('Order history retrieved', { userId, orderCount: orders.length });
    return orders;
  } catch (error) {
    logger.error('Error retrieving order history', { error, userId });
    throw new Error('Failed to retrieve order history');
  }
};

export const getOrderDetails = async (orderId: string, userId?: string): Promise<OrderResponse> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            design: { select: { id: true, imageUrl: true, prompt: true } },
            fabric: { select: { id: true, name: true } },
            gsm: { select: { id: true, value: true } },
            size: { select: { id: true, name: true } },
            color: { select: { id: true, name: true, hexCode: true } },
          },
        },
      },
    });
    if (!order) throw new Error('Order not found');
    if (userId && order.userId !== userId) throw new Error('Unauthorized to view this order');
    logger.debug('Order details retrieved', { orderId });
    return order;
  } catch (error) {
    logger.error('Error retrieving order details', { error, orderId, userId });
    throw error;
  }
};


export const updateOrderStatus = async (
  orderId: string, newStatus: OrderStatus, changedBy: string, notes?: string, trackingNumber?: string
): Promise<OrderResponse> => {
  try {
    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder) throw new Error('Order not found');
    if (!isValidTransition(currentOrder.status, newStatus)) {
      throw new Error(`Invalid status transition from ${currentOrder.status} to ${newStatus}`);
    }
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(trackingNumber && { trackingNumber }),
          ...(newStatus === OrderStatus.DELIVERED && { estimatedDelivery: new Date() }),
        },
        include: {
          items: {
            include: {
              design: { select: { id: true, imageUrl: true, prompt: true } },
              fabric: { select: { id: true, name: true } },
              gsm: { select: { id: true, value: true } },
              size: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, hexCode: true } },
            },
          },
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: newStatus, changedBy, notes },
      });
      return order;
    });
    logger.info('Order status updated', { orderId, oldStatus: currentOrder.status, newStatus, changedBy });
    return updatedOrder;
  } catch (error) {
    logger.error('Error updating order status', { error, orderId, newStatus, changedBy });
    throw error;
  }
};

export const cancelOrder = async (orderId: string, userId: string, reason?: string): Promise<OrderResponse> => {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.userId !== userId) throw new Error('Unauthorized to cancel this order');
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new Error(`Cannot cancel order with status ${order.status}`);
    }
    const cancelledOrder = await updateOrderStatus(orderId, OrderStatus.CANCELLED, userId, reason || 'Cancelled by customer');
    logger.info('Order cancelled', { orderId, userId, reason });
    return cancelledOrder;
  } catch (error) {
    logger.error('Error cancelling order', { error, orderId, userId });
    throw error;
  }
};


export const assignOrderToVendor = async (orderId: string, vendorId: string, assignedBy: string): Promise<OrderResponse> => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');
    if (!vendor.isActive) throw new Error('Vendor is not active');
    const estimatedDelivery = calculateEstimatedDelivery(vendor.location);
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { vendorId, status: OrderStatus.ASSIGNED, estimatedDelivery },
        include: {
          items: {
            include: {
              design: { select: { id: true, imageUrl: true, prompt: true } },
              fabric: { select: { id: true, name: true } },
              gsm: { select: { id: true, value: true } },
              size: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, hexCode: true } },
            },
          },
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.ASSIGNED, changedBy: assignedBy, notes: `Assigned to vendor ${vendor.businessName}` },
      });
      return order;
    });
    logger.info('Order assigned to vendor', { orderId, vendorId, estimatedDelivery, assignedBy });
    return updatedOrder;
  } catch (error) {
    logger.error('Error assigning order to vendor', { error, orderId, vendorId });
    throw error;
  }
};

export const getOrderStatusHistory = async (orderId: string): Promise<any[]> => {
  try {
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    logger.debug('Order status history retrieved', { orderId, entryCount: history.length });
    return history;
  } catch (error) {
    logger.error('Error retrieving order status history', { error, orderId });
    throw new Error('Failed to retrieve order status history');
  }
};

export const updatePaymentStatus = async (orderId: string, paymentId: string, paymentStatus: PaymentStatus): Promise<OrderResponse> => {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentId, paymentStatus,
          ...(paymentStatus === PaymentStatus.SUCCESS && { status: OrderStatus.PAID }),
        },
        include: {
          items: {
            include: {
              design: { select: { id: true, imageUrl: true, prompt: true } },
              fabric: { select: { id: true, name: true } },
              gsm: { select: { id: true, value: true } },
              size: { select: { id: true, name: true } },
              color: { select: { id: true, name: true, hexCode: true } },
            },
          },
        },
      });
      if (paymentStatus === PaymentStatus.SUCCESS) {
        await tx.orderStatusHistory.create({
          data: { orderId, status: OrderStatus.PAID, changedBy: 'system', notes: 'Payment successful' },
        });
      }
      return updated;
    });
    logger.info('Payment status updated', { orderId, paymentId, paymentStatus });
    return updatedOrder;
  } catch (error) {
    logger.error('Error updating payment status', { error, orderId, paymentId, paymentStatus });
    throw error;
  }
};
