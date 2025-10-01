"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMqtt } from "@/hooks/useMqtt";
import type { ClientState, SlotStatus } from "@/hooks/useMqtt";

const CLIENT_STATE_LABEL: Record<ClientState, string> = {
  demo: "Demo",
  connecting: "Conectando",
  connected: "Conectado",
  reconnecting: "Reconectando",
  error: "Erro",
};

const CLIENT_STATE_STYLE: Record<ClientState, string> = {
  demo: "bg-slate-200 text-slate-700",
  connecting: "bg-amber-100 text-amber-700",
  connected: "bg-emerald-100 text-emerald-700",
  reconnecting: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<SlotStatus, { label: string; className: string }> = {
  occupied: {
    label: "OCUPADA",
    className: "bg-red-500 text-white border-transparent",
  },
  free: {
    label: "LIVRE",
    className: "bg-emerald-500 text-white border-transparent",
  },
  unknown: {
    label: "-",
    className: "bg-slate-200 text-slate-600 border-transparent",
  },
};

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "-";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 1) return "agora";
  if (diffSeconds < 60) return `há ${diffSeconds}s`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `há ${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const restMinutes = minutes % 60;
    return restMinutes > 0 ? `há ${hours}h ${restMinutes}min` : `há ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatDistance(value?: number): string {
  if (value === undefined) return "-";
  return `${value.toFixed(1)} cm`;
}

function formatUptime(seconds?: number): string {
  if (seconds === undefined) return "-";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}min`);
  if (!hours && !minutes) {
    parts.push(`${secs}s`);
  } else if (secs && parts.length < 2) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ") || "0s";
}

export default function Page() {
  const {
    clientState,
    status,
    distance,
    rssi,
    uptime,
    lastUpdated,
    history,
    slotId,
    setSlotId,
    retainWarning,
    error,
    isDemo,
  } = useMqtt();

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  const historyItems = useMemo(() => history.slice(-10).reverse(), [history]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Monitoramento da vaga</h1>
            <p className="text-sm text-slate-500">
              Status da vaga, distância e métricas de telemetria via MQTT.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-slate-600" htmlFor="slot-id">
              Slot monitorado
            </label>
            <Input
              id="slot-id"
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-400">
              Override em runtime de <code>NEXT_PUBLIC_SLOT_ID</code>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${CLIENT_STATE_STYLE[clientState]} border-transparent`}>
            {CLIENT_STATE_LABEL[clientState]}
          </Badge>
          {isDemo && (
            <span className="text-xs text-amber-600">
              Modo demo ativo - defina <code>NEXT_PUBLIC_MQTT_URL</code> para conectar no broker.
            </span>
          )}
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {retainWarning && !isDemo && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Nenhum payload retido recebido em até 3s. Verifique se os tópicos usam retain.
          </div>
        )}
      </section>

      <Card>
        <CardHeader className="items-start gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">Vaga {slotId}</CardTitle>
            <CardDescription>Status atual do sensor e detalhes de telemetria.</CardDescription>
          </div>
          <CardAction>
            <p className="text-xs font-medium uppercase text-slate-500">Última atualização</p>
            <p className="text-sm text-slate-700">{formatRelativeTime(lastUpdated)}</p>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <Badge className={`${statusStyle.className} mt-1`}>{statusStyle.label}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Distância</p>
                <p className="text-3xl font-semibold text-slate-900">{formatDistance(distance)}</p>
                <p className="text-xs text-slate-400">
                  {distance === undefined
                    ? "Sem nova leitura há pelo menos 10s."
                    : "Última leitura vinda do heartbeat."}
                </p>
              </div>
              <div className="flex gap-6 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-500">RSSI</p>
                  <p>{rssi !== undefined ? `${Math.round(rssi)} dBm` : "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Uptime</p>
                  <p>{formatUptime(uptime)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Histórico recente</p>
              {historyItems.length === 0 ? (
                <p className="text-sm text-slate-500">Sem leituras registradas ainda.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                  {historyItems.map((point) => (
                    <li key={point.t} className="flex items-center justify-between gap-4">
                      <span>{formatRelativeTime(point.t)}</span>
                      <span className="font-medium text-slate-900">
                        {point.d.toFixed(1)} cm
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-4 text-sm text-slate-500">
            <div>
              <p className="font-medium text-slate-600">Conexão</p>
              <p>{CLIENT_STATE_LABEL[clientState]}</p>
            </div>
            <div>
              <p className="font-medium text-slate-600">Tópicos monitorados</p>
              <p className="font-mono text-xs text-slate-600">{`parking/${slotId}/status`}</p>
              <p className="font-mono text-xs text-slate-600">{`parking/${slotId}/heartbeat`}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
