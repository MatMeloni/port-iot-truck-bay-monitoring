"use client";

export function StatusDot({ ok }: { ok?: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-zinc-400"
      }`}
      aria-label={ok ? "online" : "offline"}
      title={ok ? "online" : "offline"}
    />
  );
}
