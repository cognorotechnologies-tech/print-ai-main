import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../db/prisma';
import * as cartService from './cart';
import * as catalogService from './catalog';

// Mock dependencies
vi.mock('../db/prisma', () => ({
  prisma: {
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    design: {
      findUnique: vi.fn(),
    },
    fabric: {
      findUnique: vi.fn(),
    },
    gSM: {
      findUnique: vi.fn(),
    },
    size: {
      findUnique: vi.fn(),
    },
    color: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('./catalog', () => ({
  calculatePrice: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Cart Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addToCart', () => {
    const mockInput = {
      userId: 'user-123',
      designId: 'design-123',
      fabricId: 'fabric-123',
      gsmId: 'gsm-123',
      sizeId: 'size-123',
      colorId: 'color-123',
      quantity: 2,
    };

    const mockDesign = { id: 'design-123', imageUrl: 'url', prompt: 'test' };
    const mockFabric = { id: 'fabric-123', name: 'Cotton', isActive: true };
    const mockGsm = { id: 'gsm-123', value: 180, isActive: true };
    const mockSize = { id: 'size-123', name: 'M', isActive: true };
    const mockColor = { id: 'color-123', name: 'Black', hexCode: '#000000', isActive: true };

    it('should add new item to cart', async () => {
      // Mock validation queries
      vi.mocked(prisma.design.findUnique).mockResolvedValue(mockDesign as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue(mockFabric as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue(mockGsm as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue(mockSize as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);

      // Mock price calculation
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(500);

      // Mock no existing item
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      // Mock cart item creation
      const mockCartItem = {
        id: 'cart-item-123',
        ...mockInput,
        price: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        design: mockDesign,
        fabric: mockFabric,
        gsm: mockGsm,
        size: mockSize,
        color: mockColor,
      };
      vi.mocked(prisma.cartItem.create).mockResolvedValue(mockCartItem as any);

      const result = await cartService.addToCart(mockInput);

      expect(result).toEqual(mockCartItem);
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          userId: mockInput.userId,
          designId: mockInput.designId,
          fabricId: mockInput.fabricId,
          gsmId: mockInput.gsmId,
          sizeId: mockInput.sizeId,
          colorId: mockInput.colorId,
          quantity: mockInput.quantity,
          price: 1000,
        },
        include: expect.any(Object),
      });
    });

    it('should update quantity if item already exists', async () => {
      // Mock validation queries
      vi.mocked(prisma.design.findUnique).mockResolvedValue(mockDesign as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue(mockFabric as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue(mockGsm as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue(mockSize as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue(mockColor as any);

      // Mock price calculation
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(500);

      // Mock existing item
      const existingItem = {
        id: 'cart-item-123',
        ...mockInput,
        quantity: 3,
        price: 1500,
      };
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as any);

      // Mock cart item update
      const updatedItem = {
        ...existingItem,
        quantity: 5,
        price: 2500,
        design: mockDesign,
        fabric: mockFabric,
        gsm: mockGsm,
        size: mockSize,
        color: mockColor,
      };
      vi.mocked(prisma.cartItem.update).mockResolvedValue(updatedItem as any);

      const result = await cartService.addToCart(mockInput);

      expect(result.quantity).toBe(5);
      expect(result.price).toBe(2500);
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'cart-item-123' },
        data: {
          quantity: 5,
          price: 2500,
        },
        include: expect.any(Object),
      });
    });

    it('should throw error if quantity is less than 1', async () => {
      const invalidInput = { ...mockInput, quantity: 0 };

      await expect(cartService.addToCart(invalidInput)).rejects.toThrow(
        'Quantity must be at least 1'
      );
    });

    it('should throw error if design not found', async () => {
      vi.mocked(prisma.design.findUnique).mockResolvedValue(null);

      await expect(cartService.addToCart(mockInput)).rejects.toThrow('Design not found');
    });

    it('should throw error if fabric is inactive', async () => {
      vi.mocked(prisma.design.findUnique).mockResolvedValue(mockDesign as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue(null);

      await expect(cartService.addToCart(mockInput)).rejects.toThrow(
        'Invalid or inactive fabric'
      );
    });

    it('should throw error if GSM is inactive', async () => {
      vi.mocked(prisma.design.findUnique).mockResolvedValue(mockDesign as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue(mockFabric as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue(null);

      await expect(cartService.addToCart(mockInput)).rejects.toThrow(
        'Invalid or inactive GSM'
      );
    });
  });

  describe('getCart', () => {
    it('should return cart with items and totals', async () => {
      const mockItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          quantity: 2,
          price: 1000,
          design: { id: 'design-1', imageUrl: 'url1', prompt: 'prompt1' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'item-2',
          userId: 'user-123',
          quantity: 1,
          price: 600,
          design: { id: 'design-2', imageUrl: 'url2', prompt: 'prompt2' },
          fabric: { id: 'fabric-2', name: 'Polyester' },
          gsm: { id: 'gsm-2', value: 200 },
          size: { id: 'size-2', name: 'L' },
          color: { id: 'color-2', name: 'White', hexCode: '#FFFFFF' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockItems as any);

      const result = await cartService.getCart('user-123');

      expect(result.items).toEqual(mockItems);
      expect(result.totalItems).toBe(3); // 2 + 1
      expect(result.totalPrice).toBe(1600); // 1000 + 600
    });

    it('should return empty cart for user with no items', async () => {
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);

      const result = await cartService.getCart('user-123');

      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity and price', async () => {
      const existingItem = {
        id: 'cart-item-123',
        userId: 'user-123',
        fabricId: 'fabric-123',
        gsmId: 'gsm-123',
        sizeId: 'size-123',
        colorId: 'color-123',
        quantity: 2,
        price: 1000,
        fabric: { isActive: true },
        gsm: { isActive: true },
        size: { isActive: true },
        color: { isActive: true },
      };

      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as any);
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(500);

      const updatedItem = {
        ...existingItem,
        quantity: 5,
        price: 2500,
        design: { id: 'design-1', imageUrl: 'url', prompt: 'test' },
        fabric: { id: 'fabric-1', name: 'Cotton' },
        gsm: { id: 'gsm-1', value: 180 },
        size: { id: 'size-1', name: 'M' },
        color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
      };
      vi.mocked(prisma.cartItem.update).mockResolvedValue(updatedItem as any);

      const result = await cartService.updateCartItem('cart-item-123', 'user-123', 5);

      expect(result.quantity).toBe(5);
      expect(result.price).toBe(2500);
    });

    it('should throw error if quantity is less than 1', async () => {
      await expect(
        cartService.updateCartItem('cart-item-123', 'user-123', 0)
      ).rejects.toThrow('Quantity must be at least 1');
    });

    it('should throw error if cart item not found', async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      await expect(
        cartService.updateCartItem('cart-item-123', 'user-123', 5)
      ).rejects.toThrow('Cart item not found');
    });

    it('should throw error if user does not own cart item', async () => {
      const existingItem = {
        id: 'cart-item-123',
        userId: 'other-user',
        fabricId: 'fabric-123',
        gsmId: 'gsm-123',
        sizeId: 'size-123',
        colorId: 'color-123',
      };

      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as any);

      await expect(
        cartService.updateCartItem('cart-item-123', 'user-123', 5)
      ).rejects.toThrow('Unauthorized to update this cart item');
    });
  });

  describe('removeFromCart', () => {
    it('should remove cart item', async () => {
      const existingItem = {
        id: 'cart-item-123',
        userId: 'user-123',
      };

      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as any);
      vi.mocked(prisma.cartItem.delete).mockResolvedValue(existingItem as any);

      await cartService.removeFromCart('cart-item-123', 'user-123');

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'cart-item-123' },
      });
    });

    it('should throw error if cart item not found', async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      await expect(
        cartService.removeFromCart('cart-item-123', 'user-123')
      ).rejects.toThrow('Cart item not found');
    });

    it('should throw error if user does not own cart item', async () => {
      const existingItem = {
        id: 'cart-item-123',
        userId: 'other-user',
      };

      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as any);

      await expect(
        cartService.removeFromCart('cart-item-123', 'user-123')
      ).rejects.toThrow('Unauthorized to remove this cart item');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 3 } as any);

      await cartService.clearCart('user-123');

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('validateCart', () => {
    it('should return valid for cart with available items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 1000,
          design: { id: 'design-1', imageUrl: 'url', prompt: 'test' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockItems as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(1000);

      const result = await cartService.validateCart('user-123');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for empty cart', async () => {
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);

      const result = await cartService.validateCart('user-123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cart is empty');
    });

    it('should return invalid if fabric is no longer active', async () => {
      const mockItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 1000,
          design: { id: 'design-1', imageUrl: 'url', prompt: 'test' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockItems as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ isActive: false } as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue({ isActive: true } as any);

      const result = await cartService.validateCart('user-123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Fabric "Cotton" is no longer available');
    });

    it('should return invalid if price has changed', async () => {
      const mockItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          fabricId: 'fabric-1',
          gsmId: 'gsm-1',
          sizeId: 'size-1',
          colorId: 'color-1',
          quantity: 2,
          price: 1000,
          design: { id: 'design-1', imageUrl: 'url', prompt: 'test' },
          fabric: { id: 'fabric-1', name: 'Cotton' },
          gsm: { id: 'gsm-1', value: 180 },
          size: { id: 'size-1', name: 'M' },
          color: { id: 'color-1', name: 'Black', hexCode: '#000000' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockItems as any);
      vi.mocked(prisma.fabric.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.gSM.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.size.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(prisma.color.findUnique).mockResolvedValue({ isActive: true } as any);
      vi.mocked(catalogService.calculatePrice).mockResolvedValue(1200); // Price changed

      const result = await cartService.validateCart('user-123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Price for item has changed. Please review your cart.');
    });
  });
});
