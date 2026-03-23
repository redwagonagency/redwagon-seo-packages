"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Detects ?autoConnect=ga4|gsc in the URL after a Google OAuth redirect
 * and automatically calls /api/sites/connect so the user doesn't have to
 * click the connect button a second time.
 */
export default function AutoConnectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const type = searchParams.get("autoConnect") as "ga4" | "gsc" | null;
    if (!type || (type !== "ga4" && type !== "gsc")) return;

    fetch("/api/sites/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).finally(() => {
      // Remove query param regardless of success/failure
      router.replace("/dashboard");
    });
  }, [searchParams, router]);

  return null;
}
