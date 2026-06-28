import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { scheduleFileCleanup } from './workers/fileCleanup';
import './workers/designGeneration'; // Initialize design generation worker

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, async () => {
  logger.info(`API server running on port ${PORT}`);
  
  // Initialize file cleanup scheduler
  try {
    await scheduleFileCleanup();
    logger.info('File cleanup scheduler initialized');
  } catch (error) {
    logger.error('Failed to initialize file cleanup scheduler', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default app;
