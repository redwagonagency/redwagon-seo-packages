"use client";

import { usePathname } from "next/navigation";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function FooterMount() {
  const pathname = usePathname();
  const hideFooter =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/superadmin");

  if (hideFooter) return null;
  return <MarketingFooter />;
}
