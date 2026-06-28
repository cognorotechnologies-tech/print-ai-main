import { Role } from '@prisma/client';

/**
 * Permission definitions for each role
 */
export const permissions = {
  [Role.CUSTOMER]: [
    'designs:create',
    'designs:read:own',
    'designs:delete:own',
    'cart:manage:own',
    'orders:create',
    'orders:read:own',
    'orders:cancel:own',
  ],
  [Role.VENDOR]: [
    'orders:read:assigned',
    'orders:accept',
    'orders:reject',
    'orders:update:assigned',
    'printfiles:download:assigned',
  ],
  [Role.ADMIN]: [
    'orders:read:all',
    'orders:update:all',
    'orders:reassign',
    'vendors:create',
    'vendors:read:all',
    'vendors:update:all',
    'vendors:activate',
    'vendors:deactivate',
    'catalog:manage',
    'analytics:view',
    'notifications:view:all',
    'audit:view',
  ],
  [Role.SUPER_ADMIN]: [
    // Super admin has all permissions
    '*',
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: string): boolean => {
  const rolePermissions = permissions[role];

  // Super admin has all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }

  return rolePermissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: Role, permissionList: string[]): boolean => {
  return permissionList.some((permission) => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: Role, permissionList: string[]): boolean => {
  return permissionList.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): string[] => {
  return permissions[role];
};

/**
 * Check if user can access a resource
 */
export const canAccessResource = (
  userRole: Role,
  userId: string,
  resourceOwnerId: string,
  permission: string
): boolean => {
  // Super admin can access everything
  if (userRole === Role.SUPER_ADMIN) {
    return true;
  }

  // Admin can access most things
  if (userRole === Role.ADMIN && hasPermission(userRole, permission)) {
    return true;
  }

  // Check if user has permission and owns the resource
  if (hasPermission(userRole, permission) && userId === resourceOwnerId) {
    return true;
  }

  return false;
};

/**
 * Check if user can perform action on order
 */
export const canAccessOrder = (
  userRole: Role,
  userId: string,
  order: { userId: string; vendorId?: string | null }
): boolean => {
  // Super admin and admin can access all orders
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    return true;
  }

  // Customer can access their own orders
  if (userRole === Role.CUSTOMER && order.userId === userId) {
    return true;
  }

  // Vendor can access assigned orders
  if (userRole === Role.VENDOR && order.vendorId === userId) {
    return true;
  }

  return false;
};
