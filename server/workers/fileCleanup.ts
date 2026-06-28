import { Queue, Worker } from 'bullmq';
import { redisService } from '../services/redis';
import { cloudinaryService } from '../services/cloudinary';
import { logger } from '../utils/logger';

const connection = redisService.getClient();

// Create cleanup queue
export const fileCleanupQueue = new Queue('file-cleanup', { connection });

// Job data interface
interface CleanupJobData {
  folder: string;
  daysOld: number;
}

// Worker to process cleanup jobs
export const fileCleanupWorker = new Worker<CleanupJobData>(
  'file-cleanup',
  async (job) => {
    const { folder, daysOld } = job.data;

    logger.info('Processing file cleanup job', {
      jobId: job.id,
      folder,
      daysOld,
    });

    try {
      const deletedCount = await cloudinaryService.cleanupOldFiles(
        folder,
        daysOld
      );

      logger.info('File cleanup completed', {
        jobId: job.id,
        folder,
        deletedCount,
      });

      return { success: true, deletedCount };
    } catch (error) {
      logger.error('File cleanup failed', {
        jobId: job.id,
        folder,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Process one cleanup job at a time
  }
);

// Schedule cleanup jobs
export const scheduleFileCleanup = async () => {
  try {
    // Clean up design files older than 90 days
    await fileCleanupQueue.add(
      'cleanup-designs',
      {
        folder: 'designs',
        daysOld: 90,
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Run daily at 2 AM
        },
        jobId: 'cleanup-designs-daily',
      }
    );

    // Clean up print files older than 90 days
    await fileCleanupQueue.add(
      'cleanup-print-files',
      {
        folder: 'print-files',
        daysOld: 90,
      },
      {
        repeat: {
          pattern: '0 3 * * *', // Run daily at 3 AM
        },
        jobId: 'cleanup-print-files-daily',
      }
    );

    logger.info('File cleanup jobs scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule file cleanup jobs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Worker event handlers
fileCleanupWorker.on('completed', (job) => {
  logger.info('Cleanup worker completed job', {
    jobId: job.id,
    name: job.name,
  });
});

fileCleanupWorker.on('failed', (job, err) => {
  logger.error('Cleanup worker failed job', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
  });
});

fileCleanupWorker.on('error', (err) => {
  logger.error('Cleanup worker error', {
    error: err.message,
  });
});
