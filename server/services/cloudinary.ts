import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadOptions {
  folder: string;
  publicId?: string;
  tags?: string[];
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
  transformation?: Record<string, any>;
}

class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   * @param file - File path or buffer or base64 string
   * @param options - Upload options including folder and tags
   * @returns Upload result with public ID and URLs
   */
  async uploadFile(
    file: string | Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const uploadOptions: any = {
        folder: options.folder,
        resource_type: options.resourceType || 'auto',
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options.tags && options.tags.length > 0) {
        uploadOptions.tags = options.tags;
      }

      logger.info('Uploading file to Cloudinary', {
        folder: options.folder,
        resourceType: options.resourceType,
      });

      const result = await cloudinary.uploader.upload(
        file.toString(),
        uploadOptions
      );

      logger.info('File uploaded successfully', {
        publicId: result.public_id,
        url: result.secure_url,
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      logger.error('Failed to upload file to Cloudinary', {
        error: error instanceof Error ? error.message : 'Unknown error',
        folder: options.folder,
      });
      throw new Error(
        `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload a design image for a user
   * @param userId - User ID for folder organization
   * @param file - Image file or URL
   * @param designId - Design ID for naming
   * @returns Upload result
   */
  async uploadDesignImage(
    userId: string,
    file: string | Buffer,
    designId: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `designs/${userId}`,
      publicId: designId,
      tags: ['design', userId],
      resourceType: 'image',
    });
  }

  /**
   * Upload a print file PDF for an order
   * @param orderId - Order ID for folder organization
   * @param file - PDF file path or buffer
   * @returns Upload result
   */
  async uploadPrintFile(
    orderId: string,
    file: string | Buffer
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `print-files/${orderId}`,
      publicId: `print-${orderId}`,
      tags: ['print-file', orderId],
      resourceType: 'raw',
    });
  }

  /**
   * Generate a signed URL for secure file access
   * @param publicId - Cloudinary public ID
   * @param options - Signed URL options
   * @returns Signed URL
   */
  generateSignedUrl(
    publicId: string,
    options: SignedUrlOptions = {}
  ): string {
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + (options.expiresIn || 3600);

      const signedUrl = cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: expiresAt,
        transformation: options.transformation,
      });

      logger.debug('Generated signed URL', {
        publicId,
        expiresAt,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicId,
      });
      throw new Error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Cloudinary public ID
   * @param resourceType - Resource type (image, raw, video)
   * @returns Deletion result
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image'
  ): Promise<{ result: string }> {
    try {
      logger.info('Deleting file from Cloudinary', { publicId, resourceType });

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      logger.info('File deleted successfully', {
        publicId,
        result: result.result,
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicId,
      });
      throw new Error(
        `Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete files older than specified days
   * @param folder - Folder to clean up
   * @param daysOld - Number of days old
   * @returns Number of files deleted
   */
  async cleanupOldFiles(folder: string, daysOld: number): Promise<number> {
    try {
      logger.info('Starting cleanup of old files', { folder, daysOld });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Search for resources in the folder
      const result = await cloudinary.search
        .expression(`folder:${folder}/*`)
        .max_results(500)
        .execute();

      let deletedCount = 0;

      for (const resource of result.resources) {
        const createdAt = new Date(resource.created_at);
        if (createdAt < cutoffDate) {
          await this.deleteFile(resource.public_id, resource.resource_type);
          deletedCount++;
        }
      }

      logger.info('Cleanup completed', {
        folder,
        daysOld,
        deletedCount,
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        folder,
      });
      throw new Error(
        `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get file details from Cloudinary
   * @param publicId - Cloudinary public ID
   * @param resourceType - Resource type
   * @returns File details
   */
  async getFileDetails(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image'
  ) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.url,
        secureUrl: result.secure_url,
        createdAt: result.created_at,
      };
    } catch (error) {
      logger.error('Failed to get file details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicId,
      });
      throw new Error(
        `Failed to get file details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const cloudinaryService = new CloudinaryService();
