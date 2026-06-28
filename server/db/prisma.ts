import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query', { query: e.query, duration: `${e.duration}ms` });
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma error', { error: e.message });
});

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Prisma warning', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };
