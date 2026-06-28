import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mockupService from './mockup';
import { cloudinaryService } from './cloudinary';

// Mock cloudinary service
vi.mock('./cloudinary', () => ({
  cloudinaryService: {
    generateSignedUrl: vi.fn(),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Mockup Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMockup', () => {
    it('should generate a mockup with valid inputs', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      const result = await mockupService.generateMockup({
        designUrl: 'https://res.cloudinary.com/test/image/upload/v123/designs/user123/design456.jpg',
        colorHex: '#FF0000',
        colorName: 'Red',
        placement: 'front',
      });

      expect(result).toEqual({
        mockupUrl: mockSignedUrl,
        colorName: 'Red',
        placement: 'front',
      });

      expect(cloudinaryService.generateSignedUrl).toHaveBeenCalledWith(
        'designs/user123/design456',
        expect.objectContaining({
          expiresIn: 3600,
          transformation: expect.objectContaining({
            width: 800,
            height: 800,
            crop: 'fit',
          }),
        })
      );
    });

    it('should use default placement when not specified', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      const result = await mockupService.generateMockup({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorHex: '#0000FF',
        colorName: 'Blue',
      });

      expect(result.placement).toBe('front');
    });

    it('should handle design URLs without version number', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      const result = await mockupService.generateMockup({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorHex: '#00FF00',
        colorName: 'Green',
        placement: 'back',
      });

      expect(result).toBeDefined();
      expect(cloudinaryService.generateSignedUrl).toHaveBeenCalledWith(
        'designs/user123/design456',
        expect.any(Object)
      );
    });

    it('should throw error for invalid design URL', async () => {
      await expect(
        mockupService.generateMockup({
          designUrl: 'invalid-url',
          colorHex: '#FF0000',
          colorName: 'Red',
        })
      ).rejects.toThrow('Invalid design URL');
    });

    it('should apply color overlay transformation', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      await mockupService.generateMockup({
        designUrl: 'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colorHex: '#FF5733',
        colorName: 'Orange',
      });

      expect(cloudinaryService.generateSignedUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transformation: expect.objectContaining({
            effect: 'colorize:50,co_rgb:FF5733',
          }),
        })
      );
    });
  });

  describe('generateColorVariations', () => {
    it('should generate mockups for multiple colors', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      const colors = [
        { name: 'Red', hexCode: '#FF0000' },
        { name: 'Blue', hexCode: '#0000FF' },
        { name: 'Green', hexCode: '#00FF00' },
      ];

      const results = await mockupService.generateColorVariations(
        'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colors,
        'front'
      );

      expect(results).toHaveLength(3);
      expect(results[0].colorName).toBe('Red');
      expect(results[1].colorName).toBe('Blue');
      expect(results[2].colorName).toBe('Green');
      expect(cloudinaryService.generateSignedUrl).toHaveBeenCalledTimes(3);
    });

    it('should use default placement when not specified', async () => {
      const mockSignedUrl = 'https://res.cloudinary.com/test/mockup-url';
      vi.mocked(cloudinaryService.generateSignedUrl).mockReturnValue(mockSignedUrl);

      const colors = [{ name: 'Red', hexCode: '#FF0000' }];

      const results = await mockupService.generateColorVariations(
        'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        colors
      );

      expect(results[0].placement).toBe('front');
    });

    it('should handle empty color array', async () => {
      const results = await mockupService.generateColorVariations(
        'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
        []
      );

      expect(results).toHaveLength(0);
      expect(cloudinaryService.generateSignedUrl).not.toHaveBeenCalled();
    });

    it('should propagate errors from individual mockup generation', async () => {
      vi.mocked(cloudinaryService.generateSignedUrl).mockImplementation(() => {
        throw new Error('Cloudinary error');
      });

      const colors = [{ name: 'Red', hexCode: '#FF0000' }];

      await expect(
        mockupService.generateColorVariations(
          'https://res.cloudinary.com/test/image/upload/designs/user123/design456.jpg',
          colors
        )
      ).rejects.toThrow();
    });
  });

  describe('validateMockupRequest', () => {
    it('should validate valid request', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 'color-123',
        placement: 'front',
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing designUrl', () => {
      const result = mockupService.validateMockupRequest({
        colorId: 'color-123',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('designUrl');
    });

    it('should reject invalid designUrl type', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 123,
        colorId: 'color-123',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('designUrl');
    });

    it('should reject missing colorId', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('colorId');
    });

    it('should reject invalid colorId type', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 123,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('colorId');
    });

    it('should reject invalid placement value', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 'color-123',
        placement: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('placement');
    });

    it('should accept valid placement values', () => {
      const frontResult = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 'color-123',
        placement: 'front',
      });

      const backResult = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 'color-123',
        placement: 'back',
      });

      expect(frontResult.valid).toBe(true);
      expect(backResult.valid).toBe(true);
    });

    it('should accept request without placement', () => {
      const result = mockupService.validateMockupRequest({
        designUrl: 'https://example.com/design.jpg',
        colorId: 'color-123',
      });

      expect(result.valid).toBe(true);
    });
  });
});
