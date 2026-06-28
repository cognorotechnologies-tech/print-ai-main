import winston from 'winston';
import { config } from '../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = config.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Mask sensitive data in logs
const maskSensitiveData = (info: any) => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  const masked = { ...info };

  const maskObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '***MASKED***';
      } else if (typeof obj[key] === 'object') {
        maskObject(obj[key]);
      }
    }
    return obj;
  };

  return maskObject(masked);
};

// Custom format for masking sensitive data
const maskFormat = winston.format((info) => {
  return maskSensitiveData(info);
});

// Define formats
const formats = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  maskFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message} ${
          Object.keys(info).length > 3 ? JSON.stringify(
            Object.fromEntries(
              Object.entries(info).filter(([key]) => !['timestamp', 'level', 'message'].includes(key))
            )
          ) : ''
        }`
      )
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: formats,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
