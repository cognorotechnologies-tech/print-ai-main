import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.API_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  auth: {
    jwtSecret: process.env.NEXTAUTH_SECRET || 'dev-secret',
    jwtExpiresIn: '7d',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  ai: {
    stabilityApiKey: process.env.STABILITY_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  },
  
  payment: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  
  notifications: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
    watiApiKey: process.env.WATI_API_KEY || '',
    watiApiEndpoint: process.env.WATI_API_ENDPOINT || '',
  },
};
