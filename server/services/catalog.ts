import { prisma } from '../db/prisma';
import { cacheService } from './cache';
import { logger } from '../utils/logger';

const CACHE_TTL = 3600; // 1 hour
const CACHE_KEYS = {
  FABRICS: 'catalog:fabrics',
  GSMS: 'catalog:gsms',
  SIZES: 'catalog:sizes',
  COLORS: 'catalog:colors',
  PRICING: 'catalog:pricing',
  ALL: 'catalog:all',
};

export interface CatalogData {
  fabrics: Array<{
    id: string;
    name: string;
    priceModifier: number;
    isActive: boolean;
  }>;
  gsms: Array<{
    id: string;
    value: number;
    priceModifier: number;
    isActive: boolean;
  }>;
  sizes: Array<{
    id: string;
    name: string;
    priceModifier: number;
    isActive: boolean;
  }>;
  colors: Array<{
    id: string;
    name: string;
    hexCode: string;
    priceModifier: number;
    isActive: boolean;
  }>;
  basePrice: number;
}

/**
 * Get all active fabrics
 */
export const getFabrics = async () => {
  try {
    // Try cache first
    const cached = await cacheService.get<CatalogData['fabrics']>(CACHE_KEYS.FABRICS);
    if (cached) {
      logger.debug('Returning fabrics from cache');
      return cached;
    }

    // Fetch from database
    const fabrics = await prisma.fabric.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        priceModifier: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Cache the result
    await cacheService.set(CACHE_KEYS.FABRICS, fabrics, CACHE_TTL);
    
    return fabrics;
  } catch (error) {
    logger.error('Error fetching fabrics', { error });
    throw new Error('Failed to fetch fabrics');
  }
};

/**
 * Get all active GSM options
 */
export const getGSMs = async () => {
  try {
    // Try cache first
    const cached = await cacheService.get<CatalogData['gsms']>(CACHE_KEYS.GSMS);
    if (cached) {
      logger.debug('Returning GSMs from cache');
      return cached;
    }

    // Fetch from database
    const gsms = await prisma.gSM.findMany({
      where: { isActive: true },
      select: {
        id: true,
        value: true,
        priceModifier: true,
        isActive: true,
      },
      orderBy: { value: 'asc' },
    });

    // Cache the result
    await cacheService.set(CACHE_KEYS.GSMS, gsms, CACHE_TTL);
    
    return gsms;
  } catch (error) {
    logger.error('Error fetching GSMs', { error });
    throw new Error('Failed to fetch GSM options');
  }
};

/**
 * Get all active sizes
 */
export const getSizes = async () => {
  try {
    // Try cache first
    const cached = await cacheService.get<CatalogData['sizes']>(CACHE_KEYS.SIZES);
    if (cached) {
      logger.debug('Returning sizes from cache');
      return cached;
    }

    // Fetch from database
    const sizes = await prisma.size.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        priceModifier: true,
        isActive: true,
      },
    });

    // Cache the result
    await cacheService.set(CACHE_KEYS.SIZES, sizes, CACHE_TTL);
    
    return sizes;
  } catch (error) {
    logger.error('Error fetching sizes', { error });
    throw new Error('Failed to fetch sizes');
  }
};

/**
 * Get all active colors
 */
export const getColors = async () => {
  try {
    // Try cache first
    const cached = await cacheService.get<CatalogData['colors']>(CACHE_KEYS.COLORS);
    if (cached) {
      logger.debug('Returning colors from cache');
      return cached;
    }

    // Fetch from database
    const colors = await prisma.color.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        hexCode: true,
        priceModifier: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Cache the result
    await cacheService.set(CACHE_KEYS.COLORS, colors, CACHE_TTL);
    
    return colors;
  } catch (error) {
    logger.error('Error fetching colors', { error });
    throw new Error('Failed to fetch colors');
  }
};

/**
 * Get current base price
 */
export const getBasePrice = async (): Promise<number> => {
  try {
    // Try cache first
    const cached = await cacheService.get<number>(CACHE_KEYS.PRICING);
    if (cached !== null) {
      logger.debug('Returning base price from cache');
      return cached;
    }

    // Fetch from database
    const pricing = await prisma.pricing.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
      select: { basePrice: true },
    });

    if (!pricing) {
      throw new Error('No active pricing found');
    }

    // Cache the result
    await cacheService.set(CACHE_KEYS.PRICING, pricing.basePrice, CACHE_TTL);
    
    return pricing.basePrice;
  } catch (error) {
    logger.error('Error fetching base price', { error });
    throw new Error('Failed to fetch base price');
  }
};

/**
 * Get complete catalog data (all options)
 */
export const getCatalog = async (): Promise<CatalogData> => {
  try {
    // Try cache first
    const cached = await cacheService.get<CatalogData>(CACHE_KEYS.ALL);
    if (cached) {
      logger.debug('Returning complete catalog from cache');
      return cached;
    }

    // Fetch all catalog data in parallel
    const [fabrics, gsms, sizes, colors, basePrice] = await Promise.all([
      getFabrics(),
      getGSMs(),
      getSizes(),
      getColors(),
      getBasePrice(),
    ]);

    const catalog: CatalogData = {
      fabrics,
      gsms,
      sizes,
      colors,
      basePrice,
    };

    // Cache the complete catalog
    await cacheService.set(CACHE_KEYS.ALL, catalog, CACHE_TTL);
    
    return catalog;
  } catch (error) {
    logger.error('Error fetching catalog', { error });
    throw new Error('Failed to fetch catalog');
  }
};

/**
 * Calculate price for a product configuration
 */
export const calculatePrice = async (
  fabricId: string,
  gsmId: string,
  sizeId: string,
  colorId: string,
  quantity: number = 1
): Promise<number> => {
  try {
    // Fetch all required data in parallel
    const [fabric, gsm, size, color, basePrice] = await Promise.all([
      prisma.fabric.findUnique({ where: { id: fabricId }, select: { priceModifier: true, isActive: true } }),
      prisma.gSM.findUnique({ where: { id: gsmId }, select: { priceModifier: true, isActive: true } }),
      prisma.size.findUnique({ where: { id: sizeId }, select: { priceModifier: true, isActive: true } }),
      prisma.color.findUnique({ where: { id: colorId }, select: { priceModifier: true, isActive: true } }),
      getBasePrice(),
    ]);

    // Validate all options exist and are active
    if (!fabric || !fabric.isActive) {
      throw new Error('Invalid or inactive fabric');
    }
    if (!gsm || !gsm.isActive) {
      throw new Error('Invalid or inactive GSM');
    }
    if (!size || !size.isActive) {
      throw new Error('Invalid or inactive size');
    }
    if (!color || !color.isActive) {
      throw new Error('Invalid or inactive color');
    }

    // Calculate total price
    const itemPrice = basePrice + fabric.priceModifier + gsm.priceModifier + size.priceModifier + color.priceModifier;
    const totalPrice = itemPrice * quantity;

    return totalPrice;
  } catch (error) {
    logger.error('Error calculating price', { error, fabricId, gsmId, sizeId, colorId, quantity });
    throw error;
  }
};

/**
 * Invalidate catalog cache (called when catalog is updated)
 */
export const invalidateCatalogCache = async (): Promise<void> => {
  try {
    await Promise.all([
      cacheService.del(CACHE_KEYS.FABRICS),
      cacheService.del(CACHE_KEYS.GSMS),
      cacheService.del(CACHE_KEYS.SIZES),
      cacheService.del(CACHE_KEYS.COLORS),
      cacheService.del(CACHE_KEYS.PRICING),
      cacheService.del(CACHE_KEYS.ALL),
    ]);
    logger.info('Catalog cache invalidated');
  } catch (error) {
    logger.error('Error invalidating catalog cache', { error });
  }
};
