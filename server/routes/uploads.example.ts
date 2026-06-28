/**
 * Example routes showing how to use the Cloudinary service
 * This file demonstrates integration patterns for design and print file uploads
 */

import { Router, Request, Response } from 'express';
import { cloudinaryService } from '../services/cloudinary';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Example: Upload a design image
 * POST /api/v1/uploads/design
 */
router.post('/design', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { imageData, prompt } = req.body;
    
    if (!imageData) {
      throw new AppError('Image data is required', 400);
    }

    // Generate unique design ID
    const designId = uuidv4();

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadDesignImage(
      userId,
      imageData, // Can be base64, URL, or file path
      designId
    );

    // Here you would save to database
    // await prisma.design.create({ ... })

    logger.info('Design uploaded successfully', {
      userId,
      designId,
      cloudinaryId: uploadResult.publicId,
    });

    res.json({
      success: true,
      data: {
        designId,
        imageUrl: uploadResult.secureUrl,
        cloudinaryId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (error) {
    logger.error('Design upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

/**
 * Example: Upload a print file
 * POST /api/v1/uploads/print-file
 */
router.post('/print-file', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId, pdfData } = req.body;

    if (!orderId || !pdfData) {
      throw new AppError('Order ID and PDF data are required', 400);
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadPrintFile(
      orderId,
      pdfData // Can be buffer, base64, or file path
    );

    // Here you would save to database
    // await prisma.printFile.create({ ... })

    logger.info('Print file uploaded successfully', {
      orderId,
      cloudinaryId: uploadResult.publicId,
    });

    res.json({
      success: true,
      data: {
        orderId,
        fileUrl: uploadResult.secureUrl,
        cloudinaryId: uploadResult.publicId,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    logger.error('Print file upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

/**
 * Example: Get a signed URL for a design
 * GET /api/v1/uploads/design/:designId/url
 */
router.get('/design/:designId/url', authenticate, async (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Here you would fetch from database and verify ownership
    // const design = await prisma.design.findUnique({ where: { id: designId } });
    // if (design.userId !== userId) throw new AppError('Unauthorized', 403);

    // For this example, construct the cloudinary ID
    const cloudinaryId = `designs/${userId}/${designId}`;

    // Generate signed URL (expires in 1 hour)
    const signedUrl = cloudinaryService.generateSignedUrl(cloudinaryId, {
      expiresIn: 3600,
    });

    res.json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    logger.error('Failed to generate signed URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

/**
 * Example: Get a signed URL for a print file
 * GET /api/v1/uploads/print-file/:orderId/url
 */
router.get('/print-file/:orderId/url', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Here you would verify vendor has access to this order
    // const order = await prisma.order.findUnique({ where: { id: orderId } });
    // if (order.vendorId !== req.user?.vendorId) throw new AppError('Unauthorized', 403);

    // Construct the cloudinary ID
    const cloudinaryId = `print-files/${orderId}/print-${orderId}`;

    // Generate signed URL (expires in 24 hours for vendors)
    const signedUrl = cloudinaryService.generateSignedUrl(cloudinaryId, {
      expiresIn: 86400, // 24 hours
    });

    res.json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 86400,
      },
    });
  } catch (error) {
    logger.error('Failed to generate print file URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

/**
 * Example: Delete a design image
 * DELETE /api/v1/uploads/design/:designId
 */
router.delete('/design/:designId', authenticate, async (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Here you would fetch from database and verify ownership
    // const design = await prisma.design.findUnique({ where: { id: designId } });
    // if (design.userId !== userId) throw new AppError('Unauthorized', 403);

    const cloudinaryId = `designs/${userId}/${designId}`;

    // Delete from Cloudinary
    await cloudinaryService.deleteFile(cloudinaryId, 'image');

    // Here you would delete from database
    // await prisma.design.delete({ where: { id: designId } });

    logger.info('Design deleted successfully', {
      userId,
      designId,
      cloudinaryId,
    });

    res.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error) {
    logger.error('Design deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

/**
 * Example: Get file details
 * GET /api/v1/uploads/design/:designId/details
 */
router.get('/design/:designId/details', authenticate, async (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const cloudinaryId = `designs/${userId}/${designId}`;

    // Get file details from Cloudinary
    const details = await cloudinaryService.getFileDetails(cloudinaryId, 'image');

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    logger.error('Failed to get file details', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

export { router as uploadsExampleRouter };
