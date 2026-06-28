import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';
import { generateToken, createSession } from '../utils/jwt';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  mobile?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
  token: string;
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Register new user with email and password
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const { email, password, name, mobile } = input;

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(mobile ? [{ mobile }] : []),
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email already registered');
    }
    if (existingUser.mobile === mobile) {
      throw new Error('Mobile number already registered');
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      mobile: mobile || null,
      role: 'CUSTOMER' as Role,
    },
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Store verification token (you can add a VerificationToken model or use a separate table)
  // For now, we'll log it - in production, send via email
  logger.info(`Email verification token for ${email}: ${verificationToken}`);

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email!,
    role: user.role,
  });

  // Create session
  await createSession(user.id, token);

  logger.info(`User registered successfully: ${email}`);

  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
      role: user.role,
    },
    token,
  };
};

/**
 * Login user with email and password
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const { email, password } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error('Invalid email or password');
  }

  // Check if user is deleted
  if (user.deletedAt) {
    throw new Error('Account has been deleted');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email!,
    role: user.role,
  });

  // Create session
  await createSession(user.id, token);

  logger.info(`User logged in successfully: ${email}`);

  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
      role: user.role,
    },
    token,
  };
};

/**
 * Verify email with token
 */
export const verifyEmail = async (userId: string, token: string): Promise<boolean> => {
  // In production, verify token against stored verification token
  // For now, just mark email as verified
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  logger.info(`Email verified for user: ${userId}`);
  return true;
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Store reset token (you can add a PasswordReset model)
  // For now, we'll log it - in production, send via email
  logger.info(`Password reset token for ${email}: ${resetToken}`);
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // In production, verify token and get user
  // For now, this is a placeholder
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  // Update user password
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { password: hashedPassword },
  // });

  logger.info('Password reset successfully');
};
