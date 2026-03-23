import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function difficultyColor(kd: number | null | undefined): string {
  if (!kd) return "text-gray-400";
  if (kd < 30) return "text-green-500";
  if (kd < 60) return "text-yellow-500";
  return "text-red-500";
}

export function difficultyBg(kd: number | null | undefined): string {
  if (!kd) return "bg-gray-200";
  if (kd < 30) return "bg-green-500";
  if (kd < 60) return "bg-yellow-500";
  return "bg-red-500";
}

export function intentColor(intent: string | null | undefined): string {
  switch (intent) {
    case "informational": return "bg-blue-100 text-blue-700";
    case "transactional": return "bg-green-100 text-green-700";
    case "navigational": return "bg-purple-100 text-purple-700";
    case "commercial": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export function intentBadgeVariant(
  intent: string | null | undefined
): "blue" | "green" | "purple" | "orange" | "slate" {
  switch (intent) {
    case "informational": return "blue";
    case "transactional": return "green";
    case "navigational": return "purple";
    case "commercial": return "orange";
    default: return "slate";
  }
}
