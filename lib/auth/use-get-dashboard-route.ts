"use client";

import { useMemo } from "react";
import { getUserRole } from "@/lib/auth/store";

/**
 * Hook that returns the correct dashboard route based on user role
 * - Admin users → /admin
 * - Regular users → /dashboard
 */
export function useGetDashboardRoute(): string {
  const role = getUserRole();

  return useMemo(() => {
    if (role === "admin") {
      return "/admin";
    }
    return "/dashboard";
  }, [role]);
}
