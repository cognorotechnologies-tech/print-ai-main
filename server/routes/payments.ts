import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as paymentService from '../services/payment';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().optional(),
  receipt: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive('Amount must be greater than zero').optional(),
  reason: z.string().optional(),
});

/**
 * POST /api/payments/create
 * Create Razorpay order for payment
 * 
 * Request body:
 * {
 *   orderId: string,
 *   amount: number,
 *   currency?: string,
 *   receipt?: string
 * }
 * 
 * Response:
 * {
 *   razorpayOrderId: string,
 *   amount: number,
 *   currency: string,
 *   keyId: string
 * }
 */
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = createOrderSchema.parse(req.body);

    // Create Razorpay order
    const razorpayOrder = await paymentService.createRazorpayOrder(validatedData);

    res.status(201).json(razorpayOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error creating Razorpay order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body,
    });

    // Handle specific errors
    if (error instanceof Error && error.message.includes('Amount must be greater than zero')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment callback from Razorpay
 * 
 * Request body:
 * {
 *   orderId: string,
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string
 * }
 * 
 * Response:
 * {
 *   order: OrderResponse
 * }
 */
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = verifyPaymentSchema.parse(req.body);

    // Handle payment callback with idempotency
    const order = await paymentService.handlePaymentCallback(validatedData);

    res.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error verifying payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body,
    });

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message === 'Invalid payment signature') {
        return res.status(400).json({ error: error.message });
      }
    }

    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * POST /api/payments/refund
 * Process refund for a payment
 * 
 * Request body:
 * {
 *   paymentId: string,
 *   amount?: number,
 *   reason?: string
 * }
 * 
 * Response:
 * {
 *   refundId: string,
 *   amount: number,
 *   currency: string,
 *   status: string
 * }
 */
router.post('/refund', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = refundSchema.parse(req.body);

    // Process refund
    const refund = await paymentService.processRefund(validatedData);

    res.json(refund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error processing refund', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body,
    });

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Order not found for payment ID') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Refund processing failed')) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.status(500).json({ error: 'Failed to process refund' });
  }
});

export { router as paymentsRouter };
