import { Router } from 'express';
import { registerUser, loginUser, verifyEmail } from '../services/auth';
import { sendOTP, verifyOTP, resendOTP } from '../services/otp';
import { authenticate, AuthRequest } from '../middleware/auth';
import { deleteSession, deleteUserSessions } from '../utils/jwt';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { authRateLimit, otpRateLimit } from '../middleware/rateLimit';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const sendOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number format'),
});

const verifyOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST /api/auth/register
 * Register new user with email and password
 */
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const result = await registerUser(validatedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await loginUser(validatedData);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

/**
 * POST /api/auth/otp/send
 * Send OTP to mobile number
 */
router.post('/otp/send', otpRateLimit, async (req, res) => {
  try {
    const validatedData = sendOTPSchema.parse(req.body);

    const result = await sendOTP(validatedData.mobile);

    res.json({
      success: true,
      data: result,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Send OTP error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    });
  }
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and authenticate user
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const validatedData = verifyOTPSchema.parse(req.body);

    const result = await verifyOTP(validatedData.mobile, validatedData.otp);

    res.json({
      success: true,
      data: result,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Verify OTP error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'OTP verification failed',
    });
  }
});

/**
 * POST /api/auth/otp/resend
 * Resend OTP to mobile number
 */
router.post('/otp/resend', otpRateLimit, async (req, res) => {
  try {
    const validatedData = sendOTPSchema.parse(req.body);

    const result = await resendOTP(validatedData.mobile);

    res.json({
      success: true,
      data: result,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Resend OTP error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend OTP',
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', authenticate, async (req: AuthRequest, res) => {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);

    await verifyEmail(req.user!.id, validatedData.token);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Email verification failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await deleteSession(token);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await deleteUserSessions(req.user!.id);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/session
 * Get current session information
 */
router.get('/session', authenticate, async (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

export { router as authRouter };
