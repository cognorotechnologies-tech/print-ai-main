import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as catalogService from './catalog';
import { prisma } from '../db/prisma';
import { cacheService } from './cache';

vi.mock('../db/prisma', () => ({
  prisma: {
    fabric: { findMany: vi.fn(), findUnique: vi.fn() },
    gSM: { findMany: vi.fn(), findUnique: vi.fn() },
    size: { findMany: vi.fn(), findUnique: vi.fn() },
    color: { findMany: vi.fn(), findUnique: vi.fn() },
    pricing: { findFirst: vi.fn() },
  },
}));

vi.mock('./cache', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('Catalog Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFabrics', () => {
    it('should return fabrics from cache if available', async () => {
      const mockFabrics = [
        { id: '1', name: 'Cotton', priceModifier: 0, isActive: true },
        { id: '2', name: 'Polyester', priceModifier: 50, isActive: true },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(mockFabrics);

      const result = await catalogService.getFabrics();

      expect(result).toEqual(mockFabrics);
      expect(cacheService.get).toHaveBeenCalledWith('catalog:fabrics');
      expect(prisma.fabric.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockFabrics = [
        { id: '1', name: 'Cotton', priceModifier: 0, isActive: true },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.fabric.findMany).mockResolvedValue(mockFabrics as any);

      const result = await catalogService.getFabrics();

      expect(result).toEqual(mockFabrics);
      expect(prisma.fabric.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true, name: true, priceModifier: true, isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(cacheService.set).toHaveBeenCalledWith('catalog:fabrics', mockFabrics, 3600);
    });
  });

  describe('getGSMs', () => {
    it('should return GSMs from cache if available', async () => {
      const mockGSMs = [
        { id: '1', value: 160, priceModifier: 0, isActive: true },
        { id: '2', value: 180, priceModifier: 20, isActive: true },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(mockGSMs);

      const result = await catalogService.getGSMs();

      expect(result).toEqual(mockGSMs);
      expect(cacheService.get).toHaveBeenCalledWith('catalog:gsms');
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockGSMs = [{ id: '1', value: 160, priceModifier: 0, isActive: true }];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.gSM.findMany).mockResolvedValue(mockGSMs as any);

      const result = await catalogService.getGSMs();

      expect(result).toEqual(mockGSMs);
      expect(cacheService.set).toHaveBeenCalledWith('catalog:gsms', mockGSMs, 3600);
    });
  });

  describe('getSizes', () => {
    it('should return sizes from cache if available', async () => {
      const mockSizes = [
        { id: '1', name: 'M', priceModifier: 0, isActive: true },
        { id: '2', name: 'L', priceModifier: 0, isActive: true },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(mockSizes);

      const result = await catalogService.getSizes();

      expect(result).toEqual(mockSizes);
    });
  });

  describe('getColors', () => {
    it('should return colors from cache if available', async () => {
      const mockColors = [
        { id: '1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true },
        { id: '2', name: 'Black', hexCode: '#000000', priceModifier: 0, isActive: true },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(mockColors);

      const result = await catalogService.getColors();

      expect(result).toEqual(mockColors);
    });
  });

  describe('getBasePrice', () => {
    it('should return base price from cache if available', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(299);

      const result = await catalogService.getBasePrice();

      expect(result).toBe(299);
      expect(prisma.pricing.findFirst).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.pricing.findFirst).mockResolvedValue({ basePrice: 299 } as any);

      const result = await catalogService.getBasePrice();

      expect(result).toBe(299);
      expect(cacheService.set).toHaveBeenCalledWith('catalog:pricing', 299, 3600);
    });

    it('should throw error if no active pricing found', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.pricing.findFirst).mockResolvedValue(null);

      await expect(catalogService.getBasePrice()).rejects.toThrow('Failed to fetch base price');
    });
  });

  describe('getCatalog', () => {
    it('should return complete catalog from cache if available', async () => {
      const mockCatalog = {
        fabrics: [{ id: '1', name: 'Cotton', priceModifier: 0, isActive: true }],
        gsms: [{ id: '1', value: 160, priceModifier: 0, isActive: true }],
        sizes: [{ id: '1', name: 'M', priceModifier: 0, isActive: true }],
        colors: [{ id: '1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true }],
        basePrice: 299,
      };

      vi.mocked(cacheService.get).mockResolvedValue(mockCatalog);

      const result = await catalogService.getCatalog();

      expect(result).toEqual(mockCatalog);
      expect(cacheService.get).toHaveBeenCalledWith('catalog:all');
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price correctly for valid configuration', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ priceModifier: 0, isActive: true } as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue({ priceModifier: 20, isActive: true } as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue({ priceModifier: 50, isActive: true } as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue({ priceModifier: 0, isActive: true } as any);
      vi.mocked(prisma.pricing.findFirst).mockResolvedValue({ basePrice: 299 } as any);

      const result = await catalogService.calculatePrice('fabric1', 'gsm1', 'size1', 'color1', 2);

      // Base: 299, Fabric: 0, GSM: 20, Size: 50, Color: 0 = 369 per item
      // Total: 369 * 2 = 738
      expect(result).toBe(738);
    });

    it('should throw error for inactive fabric', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ priceModifier: 0, isActive: false } as any);
      vi.mocked(prisma.pricing.findFirst).mockResolvedValue({ basePrice: 299 } as any);

      await expect(
        catalogService.calculatePrice('fabric1', 'gsm1', 'size1', 'color1', 1)
      ).rejects.toThrow('Invalid or inactive fabric');
    });

    it('should throw error for invalid GSM', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ priceModifier: 0, isActive: true } as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.pricing.findFirst).mockResolvedValue({ basePrice: 299 } as any);

      await expect(
        catalogService.calculatePrice('fabric1', 'gsm1', 'size1', 'color1', 1)
      ).rejects.toThrow('Invalid or inactive GSM');
    });
  });

  describe('invalidateCatalogCache', () => {
    it('should invalidate all catalog cache keys', async () => {
      await catalogService.invalidateCatalogCache();

      expect(cacheService.del).toHaveBeenCalledTimes(6);
      expect(cacheService.del).toHaveBeenCalledWith('catalog:fabrics');
      expect(cacheService.del).toHaveBeenCalledWith('catalog:gsms');
      expect(cacheService.del).toHaveBeenCalledWith('catalog:sizes');
      expect(cacheService.del).toHaveBeenCalledWith('catalog:colors');
      expect(cacheService.del).toHaveBeenCalledWith('catalog:pricing');
      expect(cacheService.del).toHaveBeenCalledWith('catalog:all');
    });
  });
});
