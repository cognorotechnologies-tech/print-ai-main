import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config with API keys - must be before imports
vi.mock('../config', () => ({
  config: {
    ai: {
      stabilityApiKey: 'test-stability-key',
      openaiApiKey: 'test-openai-key',
    },
    cloudinary: {
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    },
  },
}));

// Mock cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
    api: {
      resource: vi.fn(),
    },
    search: {
      expression: vi.fn().mockReturnThis(),
      max_results: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    },
    url: vi.fn(),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { aiDesignService } from './aiDesign';
import { cloudinaryService } from './cloudinary';

// Mock cloudinary service methods
vi.mock('./cloudinary', () => ({
  cloudinaryService: {
    uploadDesignImage: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('AIDesignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePrompt', () => {
    it('should accept valid prompts', () => {
      const result = aiDesignService.validatePrompt('A beautiful sunset over mountains');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty prompts', () => {
      const result = aiDesignService.validatePrompt('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should reject prompts that are too short', () => {
      const result = aiDesignService.validatePrompt('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt must be at least 3 characters long');
    });

    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(1001);
      const result = aiDesignService.validatePrompt(longPrompt);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt must be less than 1000 characters');
    });

    it('should reject prompts with only invalid characters', () => {
      const result = aiDesignService.validatePrompt('<>');
      expect(result.valid).toBe(false);
      // After sanitization, '<>' becomes empty, which triggers the length check
      expect(result.error).toBe('Prompt must be at least 3 characters long');
    });
  });

  describe('sanitizePrompt', () => {
    it('should remove angle brackets', () => {
      const result = aiDesignService.sanitizePrompt('Hello <script>alert("xss")</script>');
      expect(result).toBe('Hello scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      const result = aiDesignService.sanitizePrompt('javascript:alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const result = aiDesignService.sanitizePrompt('Hello onclick=alert("xss")');
      expect(result).toBe('Hello alert("xss")');
    });

    it('should trim whitespace', () => {
      const result = aiDesignService.sanitizePrompt('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should handle normal text without changes', () => {
      const result = aiDesignService.sanitizePrompt('A beautiful sunset');
      expect(result).toBe('A beautiful sunset');
    });
  });

  describe('generateDesign', () => {
    it('should generate design with Stability AI successfully', async () => {
      // Mock Stability AI response
      const mockImageBuffer = Buffer.from('fake-image-data');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer.buffer,
      });

      // Mock Cloudinary upload
      vi.mocked(cloudinaryService.uploadDesignImage).mockResolvedValueOnce({
        publicId: 'designs/user123/design-123',
        url: 'http://cloudinary.com/image.png',
        secureUrl: 'https://cloudinary.com/image.png',
        format: 'png',
        width: 1024,
        height: 1024,
        bytes: 12345,
      });

      const result = await aiDesignService.generateDesign({
        userId: 'user123',
        prompt: 'A beautiful sunset',
        aspectRatio: '16:9',
      });

      expect(result).toEqual({
        imageUrl: 'https://cloudinary.com/image.png',
        cloudinaryId: 'designs/user123/design-123',
        aiProvider: 'stability',
        aspectRatio: '16:9',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.stability.ai/v2beta/stable-image/generate/sd3',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should fallback to DALL-E when Stability AI fails', async () => {
      // Mock Stability AI failure
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Stability AI error'))
        .mockRejectedValueOnce(new Error('Stability AI error'))
        .mockRejectedValueOnce(new Error('Stability AI error'))
        // Mock DALL-E success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                url: 'https://dalle-image.com/image.png',
              },
            ],
          }),
        });

      // Mock Cloudinary upload
      vi.mocked(cloudinaryService.uploadDesignImage).mockResolvedValueOnce({
        publicId: 'designs/user123/design-456',
        url: 'http://cloudinary.com/image.png',
        secureUrl: 'https://cloudinary.com/image.png',
        format: 'png',
        width: 1024,
        height: 1024,
        bytes: 12345,
      });

      const result = await aiDesignService.generateDesign({
        userId: 'user123',
        prompt: 'A beautiful sunset',
      });

      expect(result.aiProvider).toBe('dalle');
      expect(global.fetch).toHaveBeenCalledTimes(4); // 3 Stability retries + 1 DALL-E
    });

    it('should throw error when both providers fail', async () => {
      // Mock both providers failing
      (global.fetch as any).mockRejectedValue(new Error('API error'));

      await expect(
        aiDesignService.generateDesign({
          userId: 'user123',
          prompt: 'A beautiful sunset',
        })
      ).rejects.toThrow('Failed to generate design after 3 attempts');
    });

    it('should reject invalid prompts', async () => {
      await expect(
        aiDesignService.generateDesign({
          userId: 'user123',
          prompt: '',
        })
      ).rejects.toThrow('Prompt cannot be empty');
    });

    it('should sanitize prompts before generation', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer.buffer,
      });

      vi.mocked(cloudinaryService.uploadDesignImage).mockResolvedValueOnce({
        publicId: 'designs/user123/design-789',
        url: 'http://cloudinary.com/image.png',
        secureUrl: 'https://cloudinary.com/image.png',
        format: 'png',
        width: 1024,
        height: 1024,
        bytes: 12345,
      });

      await aiDesignService.generateDesign({
        userId: 'user123',
        prompt: 'Hello <script>alert("xss")</script>',
      });

      // Check that fetch was called with sanitized prompt
      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = fetchCall[1].body;
      expect(body.toString()).not.toContain('<script>');
    });

    it('should use default aspect ratio when not provided', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer.buffer,
      });

      vi.mocked(cloudinaryService.uploadDesignImage).mockResolvedValueOnce({
        publicId: 'designs/user123/design-999',
        url: 'http://cloudinary.com/image.png',
        secureUrl: 'https://cloudinary.com/image.png',
        format: 'png',
        width: 1024,
        height: 1024,
        bytes: 12345,
      });

      const result = await aiDesignService.generateDesign({
        userId: 'user123',
        prompt: 'A beautiful sunset',
      });

      expect(result.aspectRatio).toBe('1:1');
    });

    it('should handle Cloudinary upload failure', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer.buffer,
      });

      vi.mocked(cloudinaryService.uploadDesignImage).mockRejectedValueOnce(
        new Error('Upload failed')
      );

      await expect(
        aiDesignService.generateDesign({
          userId: 'user123',
          prompt: 'A beautiful sunset',
        })
      ).rejects.toThrow('Failed to upload generated design');
    });
  });
});
