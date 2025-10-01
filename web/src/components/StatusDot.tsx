"use client";

import { cn } from "@/lib/utils";

type StatusDotProps = {
  ok?: boolean;
  className?: string;
};

export function StatusDot({ ok = false, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-2.5 w-2.5 items-center justify-center rounded-full",
        ok ? "bg-emerald-500" : "bg-rose-500",
        className
      )}
      aria-label={ok ? "online" : "offline"}
      title={ok ? "online" : "offline"}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full transition-opacity",
          ok ? "animate-ping bg-emerald-400/40" : "bg-rose-400/40"
        )}
        aria-hidden="true"
      />
    </span>
  );
}
