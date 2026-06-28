import { Router, Response } from 'express';
import { designGenerationQueue } from '../queues';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

const router = Router();

/**
 * GET /api/designs/pre-prompts
 * Get pre-prompt gallery (public endpoint, no auth required)
 */
router.get('/pre-prompts', async (req, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = { isActive: true };
    
    // Add category filter if provided
    if (category && typeof category === 'string') {
      where.category = category;
    }

    const prePrompts = await prisma.prePrompt.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    // Get unique categories for filtering
    const categories = await prisma.prePrompt.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json({
      prePrompts,
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    logger.error('Failed to fetch pre-prompts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch pre-prompts' });
  }
});

// All other design routes require authentication
router.use(authenticate);

/**
 * POST /api/designs/generate
 * Queue a design generation job
 */
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Add job to queue
    const job = await designGenerationQueue.add('generate-design', {
      userId,
      prompt,
      aspectRatio: aspectRatio || '1:1',
    });

    logger.info('Design generation job queued', {
      jobId: job.id,
      userId,
    });

    res.status(202).json({
      message: 'Design generation started',
      jobId: job.id,
    });
  } catch (error) {
    logger.error('Failed to queue design generation', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to start design generation' });
  }
});

/**
 * GET /api/designs/job/:jobId
 * Get the status of a design generation job
 */
router.get('/job/:jobId', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const job = await designGenerationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if job belongs to user
    if (job.data.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      jobId: job.id,
      state,
      progress,
      result: returnValue,
      error: failedReason,
    });
  } catch (error) {
    logger.error('Failed to get job status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

/**
 * GET /api/designs
 * Get all designs for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const designs = await prisma.design.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent designs
    });

    res.json({ designs });
  } catch (error) {
    logger.error('Failed to fetch designs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

/**
 * GET /api/designs/:id
 * Get a specific design by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const design = await prisma.design.findUnique({
      where: { id },
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Check if design belongs to user
    if (design.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ design });
  } catch (error) {
    logger.error('Failed to fetch design', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});

/**
 * DELETE /api/designs/:id
 * Delete a design
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const design = await prisma.design.findUnique({
      where: { id },
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Check if design belongs to user
    if (design.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete from database
    await prisma.design.delete({
      where: { id },
    });

    logger.info('Design deleted', { designId: id, userId });

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete design', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

export { router as designsRouter };
