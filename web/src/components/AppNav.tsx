"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Container,
  LayoutDashboard,
  Radio,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Monitoramento",
    icon: <Activity className="size-4" />,
    badge: "live",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="size-4" />,
  },
];

export function AppNav() {
  const path = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-600">
            <Container className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Port IoT</p>
            <p className="text-[10px] text-slate-400 leading-tight">Porto de Santos</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV.map((item) => {
            const isActive =
              item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Status chip */}
        <div className="flex items-center gap-2">
          <Radio className="size-3.5 text-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">SSE conectado</span>
        </div>
      </div>
    </nav>
  );
}
