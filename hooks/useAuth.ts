'use client';

import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    role: session?.user?.role,
  };
}

export function useRequireAuth(requiredRole?: Role) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasRequiredRole = requiredRole
    ? user?.role === requiredRole || user?.role === Role.SUPER_ADMIN
    : true;

  return {
    user,
    isAuthenticated,
    isLoading,
    hasAccess: isAuthenticated && hasRequiredRole,
  };
}
