"use client";

import { useMemo } from "react";

/**
 * usePermissions — a lightweight permissions / demo-mode hook.
 *
 * Returns:
 *  - isDemoMode:  true when running in a read-only demo/sandbox environment
 *  - canExport:   false in demo mode (exporting/printing is blocked)
 *  - canEdit:     false in demo mode (write actions are blocked)
 *  - role:        the active role string ("admin" by default)
 *
 * The hook reads from the VITE/NEXT public env flag NEXT_PUBLIC_DEMO_MODE
 * (defaults to true in the sandbox) and falls back to a permissive config
 * outside of demo environments.
 */
export interface Permissions {
  isDemoMode: boolean;
  canExport: boolean;
  canEdit: boolean;
  role: string;
}

export function usePermissions(): Permissions {
  return useMemo(() => {
    // In the cloud sandbox we treat the app as a demo (read-only export).
    // Outside the sandbox the env flag can be set to "false" to allow exports.
    const demoFlag =
      typeof process !== "undefined" && process.env
        ? process.env.NEXT_PUBLIC_DEMO_MODE
        : undefined;
    const isDemoMode = demoFlag === undefined ? true : demoFlag === "true";

    return {
      isDemoMode,
      canExport: !isDemoMode,
      canEdit: !isDemoMode,
      role: "admin",
    };
  }, []);
}

export default usePermissions;
