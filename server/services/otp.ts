import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { config } from '../config';
import crypto from 'crypto';
import { generateToken, createSession } from '../utils/jwt';

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN';

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * Generate 6-digit OTP
 */
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Check rate limit for OTP requests
 */
const checkRateLimit = (mobile: string): boolean => {
  const now = new Date();
  const rateLimit = rateLimitStore.get(mobile);

  if (!rateLimit || rateLimit.resetAt < now) {
    rateLimitStore.set(mobile, {
      count: 1,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
    });
    return true;
  }

  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  rateLimit.count++;
  return true;
};

/**
 * Send OTP to mobile number via MSG91
 */
const sendOTPViaMSG91 = async (mobile: string, otp: string): Promise<void> => {
  // In production, integrate with MSG91 API
  // For now, just log the OTP
  logger.info(`OTP for ${mobile}: ${otp}`);

  // Example MSG91 integration:
  // const response = await fetch('https://api.msg91.com/api/v5/otp', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'authkey': config.notifications.msg91AuthKey,
  //   },
  //   body: JSON.stringify({
  //     mobile,
  //     otp,
  //     template_id: 'YOUR_TEMPLATE_ID',
  //   }),
  // });

  // if (!response.ok) {
  //   throw new Error('Failed to send OTP');
  // }
};

/**
 * Send OTP to mobile number
 */
export const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  // Validate mobile number format (basic validation)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile)) {
    throw new Error('Invalid mobile number format');
  }

  // Check rate limit
  if (!checkRateLimit(mobile)) {
    throw new Error('Too many OTP requests. Please try again later.');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Store OTP
  otpStore.set(mobile, {
    otp,
    expiresAt,
    attempts: 0,
  });

  // Send OTP via MSG91
  try {
    await sendOTPViaMSG91(mobile, otp);
    logger.info(`OTP sent to ${mobile}`);

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    logger.error('Failed to send OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP and authenticate user
 */
export const verifyOTP = async (
  mobile: string,
  otp: string
): Promise<{
  user: {
    id: string;
    mobile: string;
    name: string | null;
    role: Role;
  };
  token: string;
  isNewUser: boolean;
}> => {
  // Get stored OTP
  const storedOTP = otpStore.get(mobile);

  if (!storedOTP) {
    throw new Error('OTP not found or expired');
  }

  // Check expiry
  if (storedOTP.expiresAt < new Date()) {
    otpStore.delete(mobile);
    throw new Error('OTP has expired');
  }

  // Check attempts
  if (storedOTP.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(mobile);
    throw new Error('Maximum OTP verification attempts exceeded');
  }

  // Verify OTP
  if (storedOTP.otp !== otp) {
    storedOTP.attempts++;
    throw new Error('Invalid OTP');
  }

  // OTP verified, remove from store
  otpStore.delete(mobile);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { mobile },
  });

  let isNewUser = false;

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        mobile,
        role: 'CUSTOMER' as Role,
      },
    });
    isNewUser = true;
    logger.info(`New user created via OTP: ${mobile}`);
  } else if (user.deletedAt) {
    throw new Error('Account has been deleted');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email || '',
    role: user.role,
  });

  // Create session
  await createSession(user.id, token);

  logger.info(`User authenticated via OTP: ${mobile}`);

  return {
    user: {
      id: user.id,
      mobile: user.mobile!,
      name: user.name,
      role: user.role,
    },
    token,
    isNewUser,
  };
};

/**
 * Resend OTP
 */
export const resendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  // Check if there's an existing OTP
  const existingOTP = otpStore.get(mobile);
  
  if (existingOTP && existingOTP.expiresAt > new Date()) {
    // Delete existing OTP before sending new one
    otpStore.delete(mobile);
  }

  return await sendOTP(mobile);
};

/**
 * Clean up expired OTPs (should be run periodically)
 */
export const cleanupExpiredOTPs = (): void => {
  const now = new Date();
  
  // Clean up OTP entries
  Array.from(otpStore.entries()).forEach(([mobile, data]) => {
    if (data.expiresAt < now) {
      otpStore.delete(mobile);
    }
  });

  // Clean up rate limit entries
  Array.from(rateLimitStore.entries()).forEach(([mobile, data]) => {
    if (data.resetAt < now) {
      rateLimitStore.delete(mobile);
    }
  });
};
