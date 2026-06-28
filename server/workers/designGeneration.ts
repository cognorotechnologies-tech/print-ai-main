import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { aiDesignService } from '../services/aiDesign';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

// BullMQ requires connection options, not a Redis client instance
const connection = {
  host: config.redis.url.includes('://') 
    ? new URL(config.redis.url).hostname 
    : config.redis.url.split(':')[0],
  port: config.redis.url.includes('://') 
    ? parseInt(new URL(config.redis.url).port || '6379') 
    : parseInt(config.redis.url.split(':')[1] || '6379'),
};

export interface DesignGenerationJobData {
  userId: string;
  prompt: string;
  aspectRatio?: string;
}

export interface DesignGenerationJobResult {
  designId: string;
  imageUrl: string;
  cloudinaryId: string;
  aiProvider: string;
}

// Worker to process design generation jobs
export const designGenerationWorker = new Worker<
  DesignGenerationJobData,
  DesignGenerationJobResult
>(
  'design-generation',
  async (job: Job<DesignGenerationJobData>) => {
    const { userId, prompt, aspectRatio } = job.data;

    logger.info('Processing design generation job', {
      jobId: job.id,
      userId,
      prompt: prompt.substring(0, 50),
    });

    try {
      // Update job progress
      await job.updateProgress(10);

      // Generate design using AI service
      const result = await aiDesignService.generateDesign({
        userId,
        prompt,
        aspectRatio,
      });

      await job.updateProgress(70);

      // Save design to database
      const design = await prisma.design.create({
        data: {
          userId,
          prompt,
          imageUrl: result.imageUrl,
          cloudinaryId: result.cloudinaryId,
          aspectRatio: result.aspectRatio,
          aiProvider: result.aiProvider,
        },
      });

      await job.updateProgress(100);

      logger.info('Design generation job completed', {
        jobId: job.id,
        designId: design.id,
        provider: result.aiProvider,
      });

      return {
        designId: design.id,
        imageUrl: result.imageUrl,
        cloudinaryId: result.cloudinaryId,
        aiProvider: result.aiProvider,
      };
    } catch (error) {
      logger.error('Design generation job failed', {
        jobId: job.id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 designs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per 60 seconds
    },
  }
);

// Event handlers
designGenerationWorker.on('completed', (job) => {
  logger.info('Design generation worker completed job', {
    jobId: job.id,
  });
});

designGenerationWorker.on('failed', (job, err) => {
  logger.error('Design generation worker failed job', {
    jobId: job?.id,
    error: err.message,
  });
});

designGenerationWorker.on('error', (err) => {
  logger.error('Design generation worker error', {
    error: err.message,
  });
});

logger.info('Design generation worker started');
