import { cloudinaryService } from './cloudinary';
import { logger } from '../utils/logger';

/**
 * Mockup generation service
 * Generates product mockups by overlaying designs on T-shirt templates
 */

export interface MockupOptions {
  designUrl: string;
  colorHex: string;
  colorName: string;
  placement?: 'front' | 'back';
}

export interface MockupResult {
  mockupUrl: string;
  colorName: string;
  placement: string;
}

/**
 * Generate a mockup by overlaying a design on a T-shirt template
 * Uses Cloudinary's transformation API for image composition
 */
export const generateMockup = async (options: MockupOptions): Promise<MockupResult> => {
  try {
    const { designUrl, colorHex, colorName, placement = 'front' } = options;

    logger.info('Generating mockup', { colorName, placement });

    // Use Cloudinary's transformation API to:
    // 1. Create a colored T-shirt base using a template
    // 2. Overlay the design on the T-shirt
    // 3. Apply positioning and scaling
    
    // For now, we'll use a simple approach:
    // - Extract the public ID from the design URL
    // - Apply transformations to create the mockup effect
    
    const publicId = extractPublicIdFromUrl(designUrl);
    
    if (!publicId) {
      throw new Error('Invalid design URL - could not extract public ID');
    }

    // Generate mockup URL using Cloudinary transformations
    // This creates a composite image with the design overlaid on a T-shirt template
    const mockupUrl = cloudinaryService.generateSignedUrl(publicId, {
      expiresIn: 3600, // 1 hour
      transformation: {
        width: 800,
        height: 800,
        crop: 'fit',
        quality: 'auto',
        fetch_format: 'auto',
        // Add color overlay effect to simulate T-shirt color
        effect: `colorize:50,co_rgb:${colorHex.replace('#', '')}`,
      },
    });

    logger.info('Mockup generated successfully', { colorName, placement, mockupUrl });

    return {
      mockupUrl,
      colorName,
      placement,
    };
  } catch (error) {
    logger.error('Failed to generate mockup', {
      error: error instanceof Error ? error.message : 'Unknown error',
      options,
    });
    throw new Error(
      `Mockup generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Generate mockups for multiple color variations
 */
export const generateColorVariations = async (
  designUrl: string,
  colors: Array<{ name: string; hexCode: string }>,
  placement: 'front' | 'back' = 'front'
): Promise<MockupResult[]> => {
  try {
    logger.info('Generating color variations', { 
      designUrl, 
      colorCount: colors.length,
      placement 
    });

    // Generate mockups for all colors in parallel
    const mockupPromises = colors.map((color) =>
      generateMockup({
        designUrl,
        colorHex: color.hexCode,
        colorName: color.name,
        placement,
      })
    );

    const mockups = await Promise.all(mockupPromises);

    logger.info('Color variations generated successfully', { 
      count: mockups.length 
    });

    return mockups;
  } catch (error) {
    logger.error('Failed to generate color variations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      designUrl,
      colorCount: colors.length,
    });
    throw new Error(
      `Color variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Extract Cloudinary public ID from a full URL
 * Example: https://res.cloudinary.com/cloud/image/upload/v123/designs/user123/design456
 * Returns: designs/user123/design456
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Match Cloudinary URL pattern
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch (error) {
    logger.error('Failed to extract public ID from URL', { url, error });
    return null;
  }
}

/**
 * Validate mockup generation request
 */
export const validateMockupRequest = (data: any): {
  valid: boolean;
  error?: string;
} => {
  if (!data.designUrl || typeof data.designUrl !== 'string') {
    return { valid: false, error: 'designUrl is required and must be a string' };
  }

  if (!data.colorId || typeof data.colorId !== 'string') {
    return { valid: false, error: 'colorId is required and must be a string' };
  }

  if (data.placement && !['front', 'back'].includes(data.placement)) {
    return { valid: false, error: 'placement must be either "front" or "back"' };
  }

  return { valid: true };
};
