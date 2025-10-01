"use client";

import { useMemo } from "react";
import { CarFront, GaugeCircle, Wifi, type LucideIcon } from "lucide-react";

import { StatusDot } from "@/components/StatusDot";
import { cn } from "@/lib/utils";
import { useParkingStore } from "@/store/parkingStore";

type MetricProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
};

function MetricCard({ label, value, icon: Icon, accent }: MetricProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-black/5">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border border-transparent",
          accent
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="space-y-0.5">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </dt>
        <dd className="text-lg font-semibold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

export default function TopBar() {
  const { slots } = useParkingStore();

  const { occupied, free, online, lastUpdated } = useMemo(() => {
    const list = Object.values(slots);
    let occupiedCount = 0;
    let onlineCount = 0;
    let newest = 0;

    for (const slot of list) {
      if (slot.status === "occupied") occupiedCount += 1;
      if (slot.online) onlineCount += 1;
      if (slot.updatedAt && slot.updatedAt > newest) newest = slot.updatedAt;
    }

    return {
      occupied: occupiedCount,
      free: Math.max(list.length - occupiedCount, 0),
      online: onlineCount,
      lastUpdated: newest,
    };
  }, [slots]);

  const statusLabel = online > 0 ? "Conectado" : "Aguardando conexao";
  const formattedUpdate = lastUpdated
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastUpdated))
    : null;

  return (
    <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-black/5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
            Painel de vagas
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Port IoT - Monitoramento das docas
          </h1>
          <p className="text-sm text-slate-500">
            Acompanhe a ocupacao, distancia de sensores e disponibilidade em tempo real.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
          <StatusDot ok={online > 0} />
          {statusLabel}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Vagas livres"
          value={free}
          icon={GaugeCircle}
          accent="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Vagas ocupadas"
          value={occupied}
          icon={CarFront}
          accent="bg-rose-50 text-rose-600"
        />
        <MetricCard
          label="Dispositivos online"
          value={online}
          icon={Wifi}
          accent="bg-sky-50 text-sky-600"
        />
      </dl>

      {formattedUpdate ? (
        <p className="mt-4 text-xs text-slate-400">
          Ultima atualizacao recebida as {formattedUpdate}
        </p>
      ) : null}
    </header>
  );
}
