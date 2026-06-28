import { config } from '../config';
import { logger } from '../utils/logger';
import { cloudinaryService } from './cloudinary';

export interface DesignGenerationOptions {
  prompt: string;
  aspectRatio?: string;
  userId: string;
}

export interface DesignGenerationResult {
  imageUrl: string;
  cloudinaryId: string;
  aiProvider: 'stability' | 'dalle';
  aspectRatio: string;
}

class AIDesignService {
  private readonly TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Validate and sanitize prompt to prevent injection attacks
   */
  validatePrompt(prompt: string): { valid: boolean; error?: string } {
    // Check if prompt is empty
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, error: 'Prompt cannot be empty' };
    }

    // Check prompt length (max 1000 characters)
    if (prompt.length > 1000) {
      return { valid: false, error: 'Prompt must be less than 1000 characters' };
    }

    // Check for minimum length
    if (prompt.trim().length < 3) {
      return { valid: false, error: 'Prompt must be at least 3 characters long' };
    }

    // Sanitize: Remove potentially harmful characters
    const sanitized = prompt
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();

    if (sanitized.length === 0) {
      return { valid: false, error: 'Prompt contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Sanitize prompt by removing harmful content
   */
  sanitizePrompt(prompt: string): string {
    return prompt
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  /**
   * Generate design using Stability AI SDXL
   */
  private async generateWithStability(
    prompt: string,
    aspectRatio: string
  ): Promise<Buffer> {
    const apiKey = config.ai.stabilityApiKey;
    
    if (!apiKey) {
      throw new Error('Stability AI API key not configured');
    }

    logger.info('Generating design with Stability AI', { prompt, aspectRatio });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(
        'https://api.stability.ai/v2beta/stable-image/generate/sd3',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/*',
          },
          body: new URLSearchParams({
            prompt,
            aspect_ratio: aspectRatio,
            output_format: 'png',
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Stability AI API error', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`Stability AI error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Design generation timed out after 30 seconds');
      }
      
      throw error;
    }
  }

  /**
   * Generate design using DALL-E 3
   */
  private async generateWithDallE(prompt: string): Promise<string> {
    const apiKey = config.ai.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    logger.info('Generating design with DALL-E 3', { prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('DALL-E API error', {
          status: response.status,
          error: errorData,
        });
        throw new Error(`DALL-E error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from DALL-E API');
      }

      return data.data[0].url;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Design generation timed out after 30 seconds');
      }
      
      throw error;
    }
  }

  /**
   * Generate design with retry logic
   */
  async generateDesign(
    options: DesignGenerationOptions
  ): Promise<DesignGenerationResult> {
    // Validate prompt
    const validation = this.validatePrompt(options.prompt);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Sanitize prompt
    const sanitizedPrompt = this.sanitizePrompt(options.prompt);
    const aspectRatio = options.aspectRatio || '1:1';

    let lastError: Error | null = null;
    let imageBuffer: Buffer | null = null;
    let imageUrl: string | null = null;
    let provider: 'stability' | 'dalle' = 'stability';

    // Try Stability AI first with retries
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        logger.info('Attempting design generation with Stability AI', {
          attempt,
          maxRetries: this.MAX_RETRIES,
        });

        imageBuffer = await this.generateWithStability(sanitizedPrompt, aspectRatio);
        provider = 'stability';
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn('Stability AI generation failed', {
          attempt,
          error: lastError.message,
        });

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If Stability AI failed, try DALL-E as fallback
    if (!imageBuffer) {
      logger.info('Falling back to DALL-E 3');
      
      try {
        imageUrl = await this.generateWithDallE(sanitizedPrompt);
        provider = 'dalle';
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.error('DALL-E generation failed', { error: lastError.message });
        
        throw new Error(
          `Failed to generate design after ${this.MAX_RETRIES} attempts. Last error: ${lastError.message}`
        );
      }
    }

    // Upload to Cloudinary
    try {
      const designId = `design-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      let uploadResult;
      if (imageBuffer) {
        // Upload buffer from Stability AI
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        uploadResult = await cloudinaryService.uploadDesignImage(
          options.userId,
          base64Image,
          designId
        );
      } else if (imageUrl) {
        // Upload URL from DALL-E
        uploadResult = await cloudinaryService.uploadDesignImage(
          options.userId,
          imageUrl,
          designId
        );
      } else {
        throw new Error('No image data available for upload');
      }

      logger.info('Design generated and uploaded successfully', {
        provider,
        cloudinaryId: uploadResult.publicId,
      });

      return {
        imageUrl: uploadResult.secureUrl,
        cloudinaryId: uploadResult.publicId,
        aiProvider: provider,
        aspectRatio,
      };
    } catch (error) {
      logger.error('Failed to upload design to Cloudinary', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to upload generated design');
    }
  }
}

export const aiDesignService = new AIDesignService();
