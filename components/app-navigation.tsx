"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LAST_AVAILABLE_ROUTE_STORAGE_KEY,
  isAvailableProductRoute,
  resolveAvailableReturnRoute,
} from "./app-routes";

export function AppRouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isAvailableProductRoute(pathname)) return;
    try {
      window.sessionStorage.setItem(LAST_AVAILABLE_ROUTE_STORAGE_KEY, pathname);
    } catch {
      // Navigation still has a safe Spot fallback when storage is unavailable.
    }
  }, [pathname]);

  return null;
}

export function AppBackButton() {
  const router = useRouter();

  function goBack() {
    let candidate: string | null = null;
    try {
      candidate = window.sessionStorage.getItem(LAST_AVAILABLE_ROUTE_STORAGE_KEY);
    } catch {
      // Use the shared Spot fallback below.
    }
    router.replace(resolveAvailableReturnRoute(candidate));
  }

  return (
    <button className="trade-button trade-button--primary trade-button--lg app-status-action" type="button" onClick={goBack}>
      Go back
    </button>
  );
}
