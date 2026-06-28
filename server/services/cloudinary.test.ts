import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cloudinaryService } from './cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
    url: vi.fn(),
    api: {
      resource: vi.fn(),
    },
    search: {
      expression: vi.fn().mockReturnThis(),
      max_results: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    },
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

// Mock config
vi.mock('../config', () => ({
  config: {
    cloudinary: {
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    },
  },
}));

describe('CloudinaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockResult = {
        public_id: 'test/image123',
        url: 'http://cloudinary.com/test/image123',
        secure_url: 'https://cloudinary.com/test/image123',
        format: 'jpg',
        width: 1024,
        height: 768,
        bytes: 102400,
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await cloudinaryService.uploadFile('test-file.jpg', {
        folder: 'test',
        publicId: 'image123',
        tags: ['test'],
        resourceType: 'image',
      });

      expect(result).toEqual({
        publicId: 'test/image123',
        url: 'http://cloudinary.com/test/image123',
        secureUrl: 'https://cloudinary.com/test/image123',
        format: 'jpg',
        width: 1024,
        height: 768,
        bytes: 102400,
      });

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'test-file.jpg',
        expect.objectContaining({
          folder: 'test',
          public_id: 'image123',
          tags: ['test'],
          resource_type: 'image',
        })
      );
    });

    it('should throw error when upload fails', async () => {
      vi.mocked(cloudinary.uploader.upload).mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(
        cloudinaryService.uploadFile('test-file.jpg', {
          folder: 'test',
        })
      ).rejects.toThrow('Cloudinary upload failed: Upload failed');
    });
  });

  describe('uploadDesignImage', () => {
    it('should upload design image with correct folder structure', async () => {
      const mockResult = {
        public_id: 'designs/user123/design456',
        url: 'http://cloudinary.com/designs/user123/design456',
        secure_url: 'https://cloudinary.com/designs/user123/design456',
        format: 'png',
        width: 2048,
        height: 2048,
        bytes: 204800,
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await cloudinaryService.uploadDesignImage(
        'user123',
        'design-image.png',
        'design456'
      );

      expect(result.publicId).toBe('designs/user123/design456');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'design-image.png',
        expect.objectContaining({
          folder: 'designs/user123',
          public_id: 'design456',
          tags: ['design', 'user123'],
          resource_type: 'image',
        })
      );
    });
  });

  describe('uploadPrintFile', () => {
    it('should upload print file with correct folder structure', async () => {
      const mockResult = {
        public_id: 'print-files/order789/print-order789',
        url: 'http://cloudinary.com/print-files/order789/print-order789',
        secure_url: 'https://cloudinary.com/print-files/order789/print-order789',
        format: 'pdf',
        bytes: 512000,
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await cloudinaryService.uploadPrintFile(
        'order789',
        'print-file.pdf'
      );

      expect(result.publicId).toBe('print-files/order789/print-order789');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'print-file.pdf',
        expect.objectContaining({
          folder: 'print-files/order789',
          public_id: 'print-order789',
          tags: ['print-file', 'order789'],
          resource_type: 'raw',
        })
      );
    });
  });

  describe('generateSignedUrl', () => {
    it('should generate signed URL with default expiration', () => {
      const mockUrl = 'https://cloudinary.com/signed/test/image123';
      vi.mocked(cloudinary.url).mockReturnValue(mockUrl);

      const result = cloudinaryService.generateSignedUrl('test/image123');

      expect(result).toBe(mockUrl);
      expect(cloudinary.url).toHaveBeenCalledWith(
        'test/image123',
        expect.objectContaining({
          sign_url: true,
          type: 'authenticated',
          expires_at: expect.any(Number),
        })
      );
    });

    it('should generate signed URL with custom expiration', () => {
      const mockUrl = 'https://cloudinary.com/signed/test/image123';
      vi.mocked(cloudinary.url).mockReturnValue(mockUrl);

      const result = cloudinaryService.generateSignedUrl('test/image123', {
        expiresIn: 7200,
      });

      expect(result).toBe(mockUrl);
    });

    it('should throw error when URL generation fails', () => {
      vi.mocked(cloudinary.url).mockImplementation(() => {
        throw new Error('URL generation failed');
      });

      expect(() =>
        cloudinaryService.generateSignedUrl('test/image123')
      ).toThrow('Failed to generate signed URL: URL generation failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockResult = { result: 'ok' };
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue(mockResult as any);

      const result = await cloudinaryService.deleteFile('test/image123');

      expect(result).toEqual({ result: 'ok' });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test/image123',
        { resource_type: 'image' }
      );
    });

    it('should delete raw file with correct resource type', async () => {
      const mockResult = { result: 'ok' };
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue(mockResult as any);

      await cloudinaryService.deleteFile('test/file.pdf', 'raw');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test/file.pdf',
        { resource_type: 'raw' }
      );
    });

    it('should throw error when deletion fails', async () => {
      vi.mocked(cloudinary.uploader.destroy).mockRejectedValue(
        new Error('Deletion failed')
      );

      await expect(
        cloudinaryService.deleteFile('test/image123')
      ).rejects.toThrow('Cloudinary deletion failed: Deletion failed');
    });
  });

  describe('cleanupOldFiles', () => {
    it('should cleanup files older than specified days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 50);

      const mockSearchResult = {
        resources: [
          {
            public_id: 'test/old-file',
            created_at: oldDate.toISOString(),
            resource_type: 'image',
          },
          {
            public_id: 'test/recent-file',
            created_at: recentDate.toISOString(),
            resource_type: 'image',
          },
        ],
      };

      vi.mocked(cloudinary.search.execute).mockResolvedValue(mockSearchResult as any);
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      const deletedCount = await cloudinaryService.cleanupOldFiles('test', 90);

      expect(deletedCount).toBe(1);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test/old-file',
        { resource_type: 'image' }
      );
    });

    it('should not delete files newer than cutoff date', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);

      const mockSearchResult = {
        resources: [
          {
            public_id: 'test/recent-file',
            created_at: recentDate.toISOString(),
            resource_type: 'image',
          },
        ],
      };

      vi.mocked(cloudinary.search.execute).mockResolvedValue(mockSearchResult as any);

      const deletedCount = await cloudinaryService.cleanupOldFiles('test', 90);

      expect(deletedCount).toBe(0);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should throw error when cleanup fails', async () => {
      vi.mocked(cloudinary.search.execute).mockRejectedValue(
        new Error('Search failed')
      );

      await expect(
        cloudinaryService.cleanupOldFiles('test', 90)
      ).rejects.toThrow('Cleanup failed: Search failed');
    });
  });

  describe('getFileDetails', () => {
    it('should get file details successfully', async () => {
      const mockDetails = {
        public_id: 'test/image123',
        format: 'jpg',
        width: 1024,
        height: 768,
        bytes: 102400,
        url: 'http://cloudinary.com/test/image123',
        secure_url: 'https://cloudinary.com/test/image123',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(cloudinary.api.resource).mockResolvedValue(mockDetails as any);

      const result = await cloudinaryService.getFileDetails('test/image123');

      expect(result).toEqual({
        publicId: 'test/image123',
        format: 'jpg',
        width: 1024,
        height: 768,
        bytes: 102400,
        url: 'http://cloudinary.com/test/image123',
        secureUrl: 'https://cloudinary.com/test/image123',
        createdAt: '2024-01-01T00:00:00Z',
      });

      expect(cloudinary.api.resource).toHaveBeenCalledWith('test/image123', {
        resource_type: 'image',
      });
    });

    it('should throw error when getting details fails', async () => {
      vi.mocked(cloudinary.api.resource).mockRejectedValue(
        new Error('Resource not found')
      );

      await expect(
        cloudinaryService.getFileDetails('test/image123')
      ).rejects.toThrow('Failed to get file details: Resource not found');
    });
  });
});
