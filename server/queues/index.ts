import { Queue, QueueEvents } from 'bullmq';
import { config } from '../config';
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

// Queue definitions
export const designGenerationQueue = new Queue('design-generation', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const printFileQueue = new Queue('print-files', { connection });
export const vendorAssignmentQueue = new Queue('vendor-assignment', { connection });

// Queue monitoring
const setupQueueMonitoring = (queue: Queue, queueName: string) => {
  const queueEvents = new QueueEvents(queueName, { connection });

  queueEvents.on('completed', ({ jobId }) => {
    logger.info(`Job completed`, { queue: queueName, jobId });
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed`, { queue: queueName, jobId, reason: failedReason });
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    logger.debug(`Job progress`, { queue: queueName, jobId, progress: data });
  });
};

// Setup monitoring for all queues
setupQueueMonitoring(designGenerationQueue, 'design-generation');
setupQueueMonitoring(notificationQueue, 'notifications');
setupQueueMonitoring(printFileQueue, 'print-files');
setupQueueMonitoring(vendorAssignmentQueue, 'vendor-assignment');

// Export queue utilities
export const getQueueStats = async (queue: Queue) => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
};

export const clearQueue = async (queue: Queue) => {
  await queue.drain();
  await queue.clean(0, 1000, 'completed');
  await queue.clean(0, 1000, 'failed');
};
