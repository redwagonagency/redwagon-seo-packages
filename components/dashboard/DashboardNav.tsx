"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavChild {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  children?: NavChild[];
}

interface NavSection {
  sectionLabel?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", icon: "⊞", label: "Overview" },
      { href: "/dashboard/projects", icon: "📁", label: "Projects" },
    ],
  },
  {
    sectionLabel: "SEO RESEARCH",
    items: [
      {
        href: "/dashboard/keyword-research",
        icon: "🔍",
        label: "Keyword Research",
        children: [
          { href: "/dashboard/keyword-research", label: "Keyword Overview" },
          { href: "/dashboard/keyword-research/magic", label: "Keyword Discovery" },
          { href: "/dashboard/keyword-research/gap", label: "Keyword Gap" },
        ],
      },
      { href: "/dashboard/local-seo/product-keywords", icon: "🛍️", label: "Product Keywords" },
      { href: "/dashboard/domain-analytics", icon: "🏢", label: "Domain Analytics" },
      { href: "/dashboard/competitors", icon: "🏆", label: "Competitors" },
    ],
  },
  {
    sectionLabel: "TECHNICAL SEO",
    items: [
      {
        href: "/dashboard/site-audit",
        icon: "🛠",
        label: "Site Audit",
        children: [
          { href: "/dashboard/site-audit", label: "Overview" },
          { href: "/dashboard/site-audit/on-page", label: "On-Page Opt." },
        ],
      },
    ],
  },
  {
    sectionLabel: "RANKINGS",
    items: [
      { href: "/dashboard/rank-tracking", icon: "📈", label: "Rank Tracking" },
      { href: "/dashboard/llm-visibility", icon: "🤖", label: "AI Visibility" },
    ],
  },
  {
    sectionLabel: "BACKLINKS",
    items: [
      {
        href: "/dashboard/backlinks",
        icon: "🔗",
        label: "Backlinks",
        children: [
          { href: "/dashboard/backlinks", label: "Analytics" },
          { href: "/dashboard/backlinks/gap", label: "Backlink Gap" },
          { href: "/dashboard/backlinks/outreach", label: "Link Building" },
        ],
      },
    ],
  },
  {
    sectionLabel: "LOCAL SEO",
    items: [
      {
        href: "/dashboard/local-seo",
        icon: "📍",
        label: "Local SEO",
        children: [
          { href: "/dashboard/local-seo", label: "Map Rankings" },
          { href: "/dashboard/local-seo/product-keywords", label: "Product Keywords" },
          { href: "/dashboard/citations", label: "Citations / NAP" },
        ],
      },
    ],
  },
  {
    sectionLabel: "ECOMMERCE",
    items: [
      { href: "/dashboard/merchant", icon: "🛒", label: "Merchant Rankings" },
    ],
  },
  {
    sectionLabel: "ACCOUNT",
    items: [
      { href: "/dashboard/integrations", icon: "🔌", label: "Integrations" },
      { href: "/dashboard/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

// Flat list of all items for expanded-state initialization
const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

interface Props {
  userName: string;
  userEmail: string;
  userRole?: string;
}

export default function DashboardNav({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const isJoeSuperAdmin = userEmail.toLowerCase() === "joe@redwagon.agency";

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of ALL_ITEMS) {
      if (item.children && pathname.startsWith(item.href)) {
        init[item.href] = true;
      }
    }
    return init;
  });

  const toggle = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 7,
    marginBottom: 1,
    textDecoration: "none",
    color: active ? "#ffffff" : "#94a3b8",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
  });

  return (
    <aside
      style={{
        width: 240,
        background: "#0d1b2a",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg,#1a56db,#06b6d4)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>
            SearchAudit<span style={{ color: "#06b6d4" }}>Pro</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.sectionLabel && (
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#334155",
                  letterSpacing: "0.08em",
                  padding: "14px 12px 4px",
                  textTransform: "uppercase",
                }}
              >
                {section.sectionLabel}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href + "/"));
              const isExpanded = expanded[item.href] ?? false;

              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={linkStyle(isActive)}
                  >
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.href} style={{ marginBottom: 1 }}>
                  <button
                    onClick={() => toggle(item.href)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 7,
                      background: isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: isActive ? "#ffffff" : "#94a3b8",
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(90deg)" : "none",
                        color: "#475569",
                      }}
                    >
                      ▶
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      style={{
                        marginLeft: 22,
                        marginTop: 2,
                        marginBottom: 4,
                      }}
                    >
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "6px 12px",
                              borderRadius: 6,
                              marginBottom: 1,
                              textDecoration: "none",
                              color: childActive ? "#06b6d4" : "#64748b",
                              background: childActive
                                ? "rgba(6,182,212,0.1)"
                                : "transparent",
                              fontSize: 12.5,
                              fontWeight: childActive ? 600 : 400,
                              borderLeft: "2px solid",
                              borderLeftColor: childActive
                                ? "#06b6d4"
                                : "rgba(100,116,139,0.3)",
                            }}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {section.sectionLabel === "ACCOUNT" && isJoeSuperAdmin ? (
              <Link
                href="/superadmin"
                style={linkStyle(pathname === "/superadmin")}
              >
                <span style={{ fontSize: 14 }}>🛡️</span>
                Superadmin
              </Link>
            ) : null}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg,#1a56db,#7c3aed)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {(userName || userEmail || "U")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName || "User"}
          </p>
          <p style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </p>
        </div>
        <Link href="/api/auth/signout" style={{ fontSize: 11, color: "#475569", textDecoration: "none" }}>
          Sign out
        </Link>
      </div>
    </aside>
  );
}
