import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as orderService from '../services/order';
import * as cartService from '../services/cart';
import { logger } from '../utils/logger';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * POST /api/orders
 * Create order from cart
 * 
 * Request body:
 * {
 *   shippingAddress: {
 *     name: string,
 *     phone: string,
 *     addressLine1: string,
 *     addressLine2?: string,
 *     city: string,
 *     state: string,
 *     pincode: string,
 *     country: string
 *   }
 * }
 * 
 * Response:
 * {
 *   order: OrderResponse
 * }
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    const requiredFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required shipping address fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate field types
    if (
      typeof shippingAddress.name !== 'string' ||
      typeof shippingAddress.phone !== 'string' ||
      typeof shippingAddress.addressLine1 !== 'string' ||
      typeof shippingAddress.city !== 'string' ||
      typeof shippingAddress.state !== 'string' ||
      typeof shippingAddress.pincode !== 'string' ||
      typeof shippingAddress.country !== 'string'
    ) {
      return res.status(400).json({ 
        error: 'All shipping address fields must be strings' 
      });
    }

    // Optional addressLine2 validation
    if (shippingAddress.addressLine2 !== undefined && typeof shippingAddress.addressLine2 !== 'string') {
      return res.status(400).json({ 
        error: 'addressLine2 must be a string if provided' 
      });
    }

    // Create order from cart
    const order = await orderService.createOrderFromCart({
      userId,
      shippingAddress,
    });

    res.status(201).json({ order });
  } catch (error: any) {
    logger.error('Error creating order', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body 
    });

    // Handle specific errors
    if (error.message === 'Cart is empty') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * GET /api/orders
 * Get order history for authenticated user
 * 
 * Response:
 * {
 *   orders: OrderResponse[]
 * }
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders = await orderService.getOrderHistory(userId);

    res.json({ orders });
  } catch (error) {
    logger.error('Error retrieving order history', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 * 
 * Response:
 * {
 *   order: OrderResponse
 * }
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await orderService.getOrderDetails(id, userId);

    res.json({ order });
  } catch (error: any) {
    logger.error('Error retrieving order details', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      orderId: req.params.id 
    });

    // Handle specific errors
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Unauthorized to view this order') {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

/**
 * PUT /api/orders/:id/cancel
 * Cancel order
 * 
 * Request body (optional):
 * {
 *   reason?: string
 * }
 * 
 * Response:
 * {
 *   order: OrderResponse
 * }
 */
router.put('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate reason if provided
    if (reason !== undefined && typeof reason !== 'string') {
      return res.status(400).json({ error: 'Reason must be a string if provided' });
    }

    const order = await orderService.cancelOrder(id, userId, reason);

    res.json({ order });
  } catch (error: any) {
    logger.error('Error cancelling order', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      orderId: req.params.id,
      body: req.body 
    });

    // Handle specific errors
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Unauthorized to cancel this order') {
      return res.status(403).json({ error: error.message });
    }

    if (error.message?.includes('Cannot cancel order')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export { router as ordersRouter };
