import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as cartService from '../services/cart';
import { logger } from '../utils/logger';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * GET /api/cart
 * Retrieve current cart for authenticated user
 * 
 * Response:
 * {
 *   cart: {
 *     items: CartItemResponse[],
 *     totalItems: number,
 *     totalPrice: number
 *   }
 * }
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cart = await cartService.getCart(userId);

    res.json({ cart });
  } catch (error) {
    logger.error('Error retrieving cart', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

/**
 * POST /api/cart/items
 * Add item to cart or update quantity if item already exists
 * 
 * Request body:
 * {
 *   designId: string,
 *   fabricId: string,
 *   gsmId: string,
 *   sizeId: string,
 *   colorId: string,
 *   quantity: number (min: 1)
 * }
 * 
 * Response:
 * {
 *   item: CartItemResponse
 * }
 */
router.post('/items', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { designId, fabricId, gsmId, sizeId, colorId, quantity } = req.body;

    // Validate required fields
    if (!designId || !fabricId || !gsmId || !sizeId || !colorId) {
      return res.status(400).json({ 
        error: 'Missing required fields: designId, fabricId, gsmId, sizeId, colorId' 
      });
    }

    // Validate field types
    if (
      typeof designId !== 'string' ||
      typeof fabricId !== 'string' ||
      typeof gsmId !== 'string' ||
      typeof sizeId !== 'string' ||
      typeof colorId !== 'string'
    ) {
      return res.status(400).json({ 
        error: 'All configuration IDs must be strings' 
      });
    }

    // Validate quantity
    const qty = quantity !== undefined ? quantity : 1;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be a positive integer' 
      });
    }

    const item = await cartService.addToCart({
      userId,
      designId,
      fabricId,
      gsmId,
      sizeId,
      colorId,
      quantity: qty,
    });

    res.status(201).json({ item });
  } catch (error: any) {
    logger.error('Error adding item to cart', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body 
    });

    // Handle validation errors from cart service
    if (error.message?.includes('not found') || 
        error.message?.includes('Invalid or inactive')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

/**
 * PUT /api/cart/items/:id
 * Update cart item quantity
 * 
 * Request body:
 * {
 *   quantity: number (min: 1)
 * }
 * 
 * Response:
 * {
 *   item: CartItemResponse
 * }
 */
router.put('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be a positive integer' 
      });
    }

    const item = await cartService.updateCartItem(id, userId, quantity);

    res.json({ item });
  } catch (error: any) {
    logger.error('Error updating cart item', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      cartItemId: req.params.id,
      body: req.body 
    });

    // Handle specific errors
    if (error.message === 'Cart item not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Unauthorized to update this cart item') {
      return res.status(403).json({ error: error.message });
    }

    if (error.message?.includes('Quantity must be')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

/**
 * DELETE /api/cart/items/:id
 * Remove cart item
 * 
 * Response:
 * {
 *   message: string
 * }
 */
router.delete('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await cartService.removeFromCart(id, userId);

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error: any) {
    logger.error('Error removing cart item', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      cartItemId: req.params.id 
    });

    // Handle specific errors
    if (error.message === 'Cart item not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Unauthorized to remove this cart item') {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

/**
 * DELETE /api/cart
 * Clear all items from cart
 * 
 * Response:
 * {
 *   message: string
 * }
 */
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await cartService.clearCart(userId);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    logger.error('Error clearing cart', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export { router as cartRouter };
