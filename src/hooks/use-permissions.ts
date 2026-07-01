"use client";

import { useMemo } from "react";
import { useERPStore, getRolePermissions } from "@/lib/store";

/**
 * usePermissions — role-based permissions hook.
 *
 * Returns:
 *  - isDemoMode:  true when running in a read-only demo/sandbox environment
 *  - canExport:   false in demo mode (exporting/printing is blocked)
 *  - canEdit:     based on user role (admin/manager can edit, others based on role)
 *  - role:        the active role string from current user
 *
 * Permissions are now role-based (not just demo-mode based).
 * Admin and Manager roles always have canEdit=true.
 * Other roles have canEdit based on their ROLE_DEFINITIONS.
 */
export interface Permissions {
  isDemoMode: boolean;
  canExport: boolean;
  canEdit: boolean;
  role: string;
}

export function usePermissions(): Permissions {
  const currentUser = useERPStore((state) => state.currentUser);
  const isViewOnly = useERPStore((state) => state.isViewOnly);

  return useMemo(() => {
    const role = currentUser?.role || "employee";
    const rolePerms = getRolePermissions(role);

    // View-only (demo login) restricts exports but allows editing in sandbox
    const isDemoMode = isViewOnly;

    return {
      isDemoMode,
      canExport: !isDemoMode,
      // canEdit is true if: user has any edit permission from their role
      // (canEditContent, canManageEmployees, canApprove, canPublish, etc.)
      canEdit: rolePerms.canEditContent || rolePerms.canManageEmployees || rolePerms.canApprove || rolePerms.canPublish || rolePerms.canMoveStage || role === 'admin' || role === 'manager',
      role,
    };
  }, [currentUser, isViewOnly]);
}

export default usePermissions;
