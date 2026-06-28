import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createAuditLog } from '../services/audit';
import { Role } from '@prisma/client';

/**
 * Middleware to log admin actions for audit trail
 */
export const auditLogger = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function (data: any) {
      // Only log if user is authenticated and is admin/super_admin
      if (
        req.user &&
        (req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN)
      ) {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const resourceId = req.params.id || req.body?.id;
          const changes = req.body;

          createAuditLog({
            userId: req.user.id,
            action,
            resource,
            resourceId,
            changes,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }).catch((error) => {
            // Log error but don't fail the request
            console.error('Audit logging failed:', error);
          });
        }
      }

      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log all admin route access
 */
export const logAdminAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (
    req.user &&
    (req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN)
  ) {
    await createAuditLog({
      userId: req.user.id,
      action: 'admin.access',
      resource: 'admin_panel',
      resourceId: req.path,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  next();
};
