import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export interface AuditLogInput {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (input: AuditLogInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    logger.info(`Audit log created: ${input.action} on ${input.resource} by user ${input.userId}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main flow
  }
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  const { limit = 50, offset = 0, startDate, endDate } = options || {};

  return await prisma.auditLog.findMany({
    where: {
      userId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
};

/**
 * Get audit logs for a resource
 */
export const getResourceAuditLogs = async (
  resource: string,
  resourceId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) => {
  const { limit = 50, offset = 0 } = options || {};

  return await prisma.auditLog.findMany({
    where: {
      resource,
      resourceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Get all audit logs (admin only)
 */
export const getAllAuditLogs = async (options?: {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  resource?: string;
  userId?: string;
}) => {
  const {
    limit = 100,
    offset = 0,
    startDate,
    endDate,
    action,
    resource,
    userId,
  } = options || {};

  return await prisma.auditLog.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(action ? { action } : {}),
      ...(resource ? { resource } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Audit actions enum for consistency
 */
export const AuditAction = {
  // User actions
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Order actions
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_CANCEL: 'order.cancel',
  ORDER_REASSIGN: 'order.reassign',
  ORDER_STATUS_CHANGE: 'order.status_change',

  // Vendor actions
  VENDOR_CREATE: 'vendor.create',
  VENDOR_UPDATE: 'vendor.update',
  VENDOR_ACTIVATE: 'vendor.activate',
  VENDOR_DEACTIVATE: 'vendor.deactivate',
  VENDOR_ORDER_ACCEPT: 'vendor.order_accept',
  VENDOR_ORDER_REJECT: 'vendor.order_reject',

  // Catalog actions
  CATALOG_CREATE: 'catalog.create',
  CATALOG_UPDATE: 'catalog.update',
  CATALOG_DELETE: 'catalog.delete',

  // Admin actions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_SETTINGS_UPDATE: 'admin.settings_update',
} as const;

/**
 * Resource types enum for consistency
 */
export const AuditResource = {
  USER: 'user',
  ORDER: 'order',
  VENDOR: 'vendor',
  DESIGN: 'design',
  CATALOG: 'catalog',
  SETTINGS: 'settings',
} as const;
