import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';
import { updatePaymentStatus } from './order';
import { PaymentStatus } from '@prisma/client';

// Initialize Razorpay instance only if credentials are provided
const razorpay = config.payment.razorpayKeyId && config.payment.razorpayKeySecret
  ? new Razorpay({
      key_id: config.payment.razorpayKeyId,
      key_secret: config.payment.razorpayKeySecret,
    })
  : null;

export interface CreateOrderInput {
  orderId: string;
  amount: number;
  currency?: string;
  receipt?: string;
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentCallbackInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RefundInput {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

/**
 * Create a Razorpay order for payment
 * @param input - Order creation input with orderId and amount
 * @returns Razorpay order details including order ID and key ID for frontend
 */
export const createRazorpayOrder = async (
  input: CreateOrderInput
): Promise<CreateOrderResponse> => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }

    const { orderId, amount, currency = 'INR', receipt } = input;

    // Validate amount (Razorpay expects amount in paise/smallest currency unit)
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const amountInPaise = Math.round(amount * 100);

    logger.info('Creating Razorpay order', {
      orderId,
      amount,
      amountInPaise,
      currency,
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || orderId,
      notes: {
        orderId,
      },
    });

    logger.info('Razorpay order created successfully', {
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
    });

    // Log transaction
    await logPaymentTransaction({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      razorpayPaymentId: null,
      amount,
      currency,
      status: 'created',
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
      keyId: config.payment.razorpayKeyId,
    };
  } catch (error) {
    logger.error('Failed to create Razorpay order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw new Error(
      `Razorpay order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Verify Razorpay payment signature using HMAC SHA256
 * @param input - Payment verification input with order ID, payment ID, and signature
 * @returns True if signature is valid, false otherwise
 */
export const verifyPaymentSignature = (input: VerifyPaymentInput): boolean => {
  try {
    // Check if Razorpay is configured
    if (!config.payment.razorpayKeySecret) {
      logger.error('Razorpay key secret not configured');
      return false;
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // Create HMAC SHA256 signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.payment.razorpayKeySecret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpaySignature;

    logger.info('Payment signature verification', {
      razorpayOrderId,
      razorpayPaymentId,
      isValid,
    });

    return isValid;
  } catch (error) {
    logger.error('Failed to verify payment signature', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    return false;
  }
};

/**
 * Handle payment callback with idempotency
 * @param input - Payment callback input with order ID and Razorpay details
 * @returns Updated order with payment status
 */
export const handlePaymentCallback = async (
  input: PaymentCallbackInput
): Promise<any> => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    logger.info('Processing payment callback', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // Check for duplicate callback (idempotency)
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // If payment already processed, return existing order
    if (existingOrder.paymentStatus === PaymentStatus.SUCCESS) {
      logger.info('Payment already processed (idempotent)', {
        orderId,
        paymentId: existingOrder.paymentId,
      });
      return existingOrder;
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      logger.error('Invalid payment signature', {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
      });

      // Log failed transaction
      await logPaymentTransaction({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        amount: existingOrder.totalAmount,
        currency: 'INR',
        status: 'signature_verification_failed',
      });

      throw new Error('Invalid payment signature');
    }

    // Update order payment status
    const updatedOrder = await updatePaymentStatus(
      orderId,
      razorpayPaymentId,
      PaymentStatus.SUCCESS
    );

    // Log successful transaction
    await logPaymentTransaction({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      amount: existingOrder.totalAmount,
      currency: 'INR',
      status: 'success',
    });

    // Clear cart after successful payment
    await prisma.cartItem.deleteMany({
      where: { userId: existingOrder.userId },
    });

    logger.info('Payment processed successfully', {
      orderId,
      razorpayPaymentId,
    });

    return updatedOrder;
  } catch (error) {
    logger.error('Failed to process payment callback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw error;
  }
};

/**
 * Process refund for a payment
 * @param input - Refund input with payment ID and optional amount
 * @returns Refund details
 */
export const processRefund = async (input: RefundInput): Promise<any> => {
  try {
    const { paymentId, amount, reason } = input;

    logger.info('Processing refund', {
      paymentId,
      amount,
      reason,
    });

    // Find order by payment ID
    const order = await prisma.order.findFirst({
      where: { paymentId },
    });

    if (!order) {
      throw new Error('Order not found for payment ID');
    }

    // Calculate refund amount (full refund if not specified)
    const refundAmount = amount || order.totalAmount;
    const refundAmountInPaise = Math.round(refundAmount * 100);

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmountInPaise,
      notes: {
        orderId: order.id,
        reason: reason || 'Customer requested refund',
      },
    });

    logger.info('Refund processed successfully', {
      orderId: order.id,
      paymentId,
      refundId: refund.id,
      amount: refund.amount,
    });

    // Update order payment status
    await updatePaymentStatus(order.id, paymentId, PaymentStatus.REFUNDED);

    // Log refund transaction
    await logPaymentTransaction({
      orderId: order.id,
      razorpayOrderId: order.paymentId || '',
      razorpayPaymentId: paymentId,
      amount: refundAmount,
      currency: 'INR',
      status: 'refunded',
    });

    return {
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    };
  } catch (error) {
    logger.error('Failed to process refund', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw new Error(
      `Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Log payment transaction for reconciliation
 * @param transaction - Transaction details to log
 */
export const logPaymentTransaction = async (transaction: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
}): Promise<void> => {
  try {
    logger.info('Logging payment transaction', {
      orderId: transaction.orderId,
      razorpayOrderId: transaction.razorpayOrderId,
      razorpayPaymentId: transaction.razorpayPaymentId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      timestamp: new Date().toISOString(),
    });

    // Store transaction in database for reconciliation
    // This could be a separate PaymentTransaction table in production
    // For now, we're using structured logging for audit trail
  } catch (error) {
    logger.error('Failed to log payment transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      transaction,
    });
    // Don't throw error - logging failure shouldn't break payment flow
  }
};

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export const fetchPaymentDetails = async (paymentId: string): Promise<any> => {
  try {
    logger.info('Fetching payment details', { paymentId });

    const payment = await razorpay.payments.fetch(paymentId);

    logger.info('Payment details fetched', {
      paymentId,
      status: payment.status,
      amount: payment.amount,
    });

    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: Number(payment.amount) / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(Number(payment.created_at) * 1000),
    };
  } catch (error) {
    logger.error('Failed to fetch payment details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentId,
    });
    throw new Error(
      `Failed to fetch payment details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
