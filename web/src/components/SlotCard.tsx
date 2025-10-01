"use client";

import { CarFront, GaugeCircle, Wifi, type LucideIcon } from "lucide-react";

import { StatusDot } from "@/components/StatusDot";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SlotState } from "@/store/parkingStore";

type SlotCardProps = {
  slot: SlotState;
  isPrimary?: boolean;
};

type InfoRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
};

function InfoRow({ icon: Icon, label, value, accent }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border text-slate-600",
          accent
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function formatRelative(timestamp?: number) {
  if (!timestamp) return "Sem atualizacoes";
  const diff = Date.now() - timestamp;
  if (diff < 5_000) return "Agora mesmo";
  if (diff < 60_000) return "Ha " + Math.round(diff / 1_000) + " s";
  if (diff < 3_600_000) return "Ha " + Math.round(diff / 60_000) + " min";
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return "Hoje, " + formatter.format(new Date(timestamp));
}

export default function SlotCard({ slot, isPrimary = false }: SlotCardProps) {
  const isOccupied = slot.status === "occupied";
  const distanceLabel =
    typeof slot.distance === "number" ? slot.distance.toFixed(1) + " cm" : "Sem leitura";
  const onlineLabel = slot.online ? "Online" : "Offline";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-white/85 shadow-md shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        isOccupied ? "border-rose-100" : "border-emerald-100"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          isOccupied ? "bg-rose-500" : "bg-emerald-500"
        )}
        aria-hidden="true"
      />

      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Vaga
          </span>
          <CardTitle className="text-xl font-semibold text-slate-900">
            {slot.id}
          </CardTitle>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPrimary ? (
            <Badge className="border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-700">
              Origem
            </Badge>
          ) : null}
          <Badge
            className={cn(
              "border text-xs font-semibold",
              isOccupied
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
            )}
          >
            {isOccupied ? "Ocupada" : "Livre"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-slate-600">
        <InfoRow
          icon={GaugeCircle}
          label="Distancia"
          value={distanceLabel}
          accent={
            isOccupied
              ? "border-rose-100 bg-rose-50/60 text-rose-600"
              : "border-emerald-100 bg-emerald-50/60 text-emerald-600"
          }
        />
        <InfoRow
          icon={Wifi}
          label="Dispositivo"
          value={onlineLabel}
          accent={slot.online ? "border-sky-100 bg-sky-50 text-sky-600" : "border-slate-200 bg-slate-100"}
        />
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <StatusDot ok={slot.online} />
            {slot.online ? "Responsivo" : "Sem resposta"}
          </span>
          <CarFront className="ml-auto size-5 text-slate-400" strokeWidth={1.75} />
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 pt-3 text-xs text-slate-400">
        Atualizado: {formatRelative(slot.updatedAt)}
      </CardFooter>
    </Card>
  );
}
