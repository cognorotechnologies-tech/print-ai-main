import { Router, Request, Response } from 'express';
import * as catalogService from '../services/catalog';
import * as mockupService from '../services/mockup';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

const router = Router();

/**
 * GET /api/products/catalog
 * Get complete product catalog
 * Public endpoint - no authentication required
 * 
 * This is an alias for /api/v1/catalog for backward compatibility
 * with the design document specification
 */
router.get('/catalog', async (req: Request, res: Response) => {
  try {
    const catalog = await catalogService.getCatalog();
    res.json({ catalog });
  } catch (error) {
    logger.error('Error fetching catalog', { error });
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

/**
 * GET /api/products/options
 * Get all configuration options (alias for catalog)
 * Public endpoint - no authentication required
 */
router.get('/options', async (req: Request, res: Response) => {
  try {
    const catalog = await catalogService.getCatalog();
    res.json({ options: catalog });
  } catch (error) {
    logger.error('Error fetching product options', { error });
    res.status(500).json({ error: 'Failed to fetch product options' });
  }
});

/**
 * POST /api/products/price
 * Calculate price for a product configuration
 * Public endpoint - no authentication required
 * 
 * Request body:
 * {
 *   fabricId: string,
 *   gsmId: string,
 *   sizeId: string,
 *   colorId: string,
 *   quantity?: number (default: 1, min: 1, max: 100)
 * }
 * 
 * Response:
 * {
 *   price: number,
 *   quantity: number,
 *   pricePerItem: number
 * }
 */
router.post('/price', async (req: Request, res: Response) => {
  try {
    const { fabricId, gsmId, sizeId, colorId, quantity } = req.body;

    // Validate required fields
    if (!fabricId || !gsmId || !sizeId || !colorId) {
      return res.status(400).json({ 
        error: 'Missing required fields: fabricId, gsmId, sizeId, colorId' 
      });
    }

    // Validate field types
    if (typeof fabricId !== 'string' || typeof gsmId !== 'string' || 
        typeof sizeId !== 'string' || typeof colorId !== 'string') {
      return res.status(400).json({ 
        error: 'All configuration IDs must be strings' 
      });
    }

    // Validate quantity
    const qty = quantity !== undefined ? quantity : 1;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ 
        error: 'Quantity must be an integer between 1 and 100' 
      });
    }

    // Calculate price using catalog service
    const totalPrice = await catalogService.calculatePrice(
      fabricId,
      gsmId,
      sizeId,
      colorId,
      qty
    );

    res.json({ 
      price: totalPrice,
      quantity: qty,
      pricePerItem: totalPrice / qty
    });
  } catch (error: any) {
    logger.error('Error calculating price', { error, body: req.body });
    
    // Handle validation errors from catalog service
    if (error.message?.includes('Invalid or inactive')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

/**
 * POST /api/products/mockup
 * Generate mockup preview with design overlay
 * Public endpoint - no authentication required
 * 
 * Request body:
 * {
 *   designUrl: string,      // URL of the design image
 *   colorId: string,        // Color ID from catalog
 *   placement?: 'front' | 'back' (default: 'front')
 * }
 * 
 * Response:
 * {
 *   mockup: {
 *     mockupUrl: string,
 *     colorName: string,
 *     placement: string
 *   }
 * }
 */
router.post('/mockup', async (req: Request, res: Response) => {
  try {
    const { designUrl, colorId, placement = 'front' } = req.body;

    // Validate request
    const validation = mockupService.validateMockupRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Fetch color details from catalog
    const color = await prisma.color.findUnique({
      where: { id: colorId },
      select: {
        name: true,
        hexCode: true,
        isActive: true,
      },
    });

    if (!color) {
      return res.status(404).json({ error: 'Color not found' });
    }

    if (!color.isActive) {
      return res.status(400).json({ error: 'Color is not active' });
    }

    // Generate mockup
    const mockup = await mockupService.generateMockup({
      designUrl,
      colorHex: color.hexCode,
      colorName: color.name,
      placement,
    });

    res.json({ mockup });
  } catch (error: any) {
    logger.error('Error generating mockup', { error, body: req.body });
    res.status(500).json({ error: 'Failed to generate mockup' });
  }
});

export { router as productsRouter };
