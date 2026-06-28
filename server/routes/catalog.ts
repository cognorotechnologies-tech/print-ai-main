import { Router, Request, Response } from 'express';
import * as catalogService from '../services/catalog';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/catalog
 * Get complete product catalog
 * Public endpoint - no authentication required
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const catalog = await catalogService.getCatalog();
    res.json({ catalog });
  } catch (error) {
    logger.error('Error fetching catalog', { error });
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

/**
 * GET /api/v1/catalog/fabrics
 * Get all active fabric options
 * Public endpoint - no authentication required
 */
router.get('/fabrics', async (req: Request, res: Response) => {
  try {
    const fabrics = await catalogService.getFabrics();
    res.json({ fabrics });
  } catch (error) {
    logger.error('Error fetching fabrics', { error });
    res.status(500).json({ error: 'Failed to fetch fabrics' });
  }
});

/**
 * GET /api/v1/catalog/gsms
 * Get all active GSM options
 * Public endpoint - no authentication required
 */
router.get('/gsms', async (req: Request, res: Response) => {
  try {
    const gsms = await catalogService.getGSMs();
    res.json({ gsms });
  } catch (error) {
    logger.error('Error fetching GSMs', { error });
    res.status(500).json({ error: 'Failed to fetch GSM options' });
  }
});

/**
 * GET /api/v1/catalog/sizes
 * Get all active size options
 * Public endpoint - no authentication required
 */
router.get('/sizes', async (req: Request, res: Response) => {
  try {
    const sizes = await catalogService.getSizes();
    res.json({ sizes });
  } catch (error) {
    logger.error('Error fetching sizes', { error });
    res.status(500).json({ error: 'Failed to fetch sizes' });
  }
});

/**
 * GET /api/v1/catalog/colors
 * Get all active color options
 * Public endpoint - no authentication required
 */
router.get('/colors', async (req: Request, res: Response) => {
  try {
    const colors = await catalogService.getColors();
    res.json({ colors });
  } catch (error) {
    logger.error('Error fetching colors', { error });
    res.status(500).json({ error: 'Failed to fetch colors' });
  }
});

/**
 * POST /api/v1/catalog/price
 * Calculate price for a product configuration
 * Public endpoint - no authentication required
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

    // Validate quantity
    const qty = quantity !== undefined ? quantity : 1;
    if (qty < 1 || qty > 100) {
      return res.status(400).json({ 
        error: 'Quantity must be between 1 and 100' 
      });
    }

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
    
    // Handle validation errors
    if (error.message?.includes('Invalid or inactive')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

export { router as catalogRouter };
