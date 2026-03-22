import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "blue" | "purple" | "orange" | "green" | "red" | "slate";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-indigo-100 text-indigo-700": variant === "default",
          "bg-blue-100 text-blue-700": variant === "blue",
          "bg-purple-100 text-purple-700": variant === "purple",
          "bg-orange-100 text-orange-700": variant === "orange",
          "bg-green-100 text-green-700": variant === "green",
          "bg-red-100 text-red-700": variant === "red",
          "bg-slate-100 text-slate-600": variant === "slate",
        },
        className
      )}
      {...props}
    />
  );
}
