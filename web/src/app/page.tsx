"use client";

import { useEffect, useMemo, useState } from "react";

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
import {
  createParkingStream,
  fetchSlotHistory,
  fetchSlots,
  type ParkingHistoryEvent,
  type SlotSnapshot,
  type SlotStatus,
} from "@/lib/backendApi";

type ClientState = "connecting" | "connected" | "error";

const CLIENT_STATE_LABEL: Record<ClientState, string> = {
  connecting: "Conectando",
  connected: "Conectado",
  error: "Erro",
};

const CLIENT_STATE_STYLE: Record<ClientState, string> = {
  connecting: "bg-amber-100 text-amber-700",
  connected: "bg-emerald-100 text-emerald-700",
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

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
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
  if (secs && parts.length < 2) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ") || "0s";
}

function formatOnline(value?: boolean): string {
  if (value === undefined) return "-";
  return value ? "Sim" : "Nao";
}

function formatHistoryValue(event: ParkingHistoryEvent): string {
  if (event.eventType === "heartbeat") {
    return `${event.distanceCm?.toFixed(1) ?? "-"} cm`;
  }
  if (event.eventType === "status") {
    return event.status ?? "-";
  }
  return event.online ? "online" : "offline";
}

export default function Page() {
  const [clientState, setClientState] = useState<ClientState>("connecting");
  const [error, setError] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<Record<string, SlotSnapshot>>({});
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [history, setHistory] = useState<ParkingHistoryEvent[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchSlots(abortController.signal)
      .then((items) => {
        const normalized = Object.fromEntries(items.map((slot) => [slot.slotId, slot]));
        setSlots(normalized);
        setSelectedSlot((current) => current || items[0]?.slotId || "");
      })
      .catch((fetchError: unknown) => {
        const message =
          fetchError instanceof Error ? fetchError.message : "Falha ao carregar slots";
        setError(message);
      });

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    const eventSource = createParkingStream();

    eventSource.onopen = () => {
      setClientState("connected");
      setError(undefined);
    };

    eventSource.onerror = () => {
      setClientState("error");
      setError("Falha na conexao em tempo real com o backend.");
    };

    eventSource.addEventListener("slot_update", (evt) => {
      try {
        const parsed = JSON.parse((evt as MessageEvent<string>).data) as SlotSnapshot;
        setSlots((current) => ({ ...current, [parsed.slotId]: parsed }));
      } catch {
        setError("Evento recebido com formato invalido.");
      }
    });

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (!selectedSlot) {
      setHistory([]);
      return;
    }
    const abortController = new AbortController();
    fetchSlotHistory(selectedSlot, 20, abortController.signal)
      .then((items) => setHistory(items))
      .catch((fetchError: unknown) => {
        const message =
          fetchError instanceof Error ? fetchError.message : "Falha ao carregar historico";
        setError(message);
      });
    return () => abortController.abort();
  }, [selectedSlot]);

  const slotList = useMemo(
    () => Object.values(slots).sort((a, b) => a.slotId.localeCompare(b.slotId)),
    [slots],
  );

  const selected = useMemo(
    () => (selectedSlot ? slots[selectedSlot] : undefined),
    [selectedSlot, slots],
  );

  const statusStyle = STATUS_STYLES[selected?.status ?? "unknown"] ?? STATUS_STYLES.unknown;
  const overview = useMemo(() => {
    let occupied = 0;
    let online = 0;
    for (const slot of slotList) {
      if (slot.status === "occupied") occupied += 1;
      if (slot.online) online += 1;
    }
    return {
      total: slotList.length,
      occupied,
      free: Math.max(slotList.length - occupied, 0),
      online,
    };
  }, [slotList]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Monitoramento das vagas</h1>
            <p className="text-sm text-slate-500">
              Dados publicados no Mosquitto, processados no backend NestJS e exibidos em tempo real.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-slate-600" htmlFor="slot-id">
              Slot selecionado
            </label>
            <Input
              id="slot-id"
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
              className="mt-1"
              placeholder={slotList[0]?.slotId ?? "bay-01"}
            />
            <p className="mt-1 text-xs text-slate-400">
              Slots conhecidos: {slotList.map((slot) => slot.slotId).join(", ") || "nenhum"}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${CLIENT_STATE_STYLE[clientState]} border-transparent`}>
            {CLIENT_STATE_LABEL[clientState]}
          </Badge>
          <span className="text-xs text-slate-500">Fonte: stream SSE do backend (`/api/parking/stream`).</span>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Vagas totais</CardDescription>
            <CardTitle className="text-2xl">{overview.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vagas livres</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{overview.free}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vagas ocupadas</CardDescription>
            <CardTitle className="text-2xl text-rose-600">{overview.occupied}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Dispositivos online</CardDescription>
            <CardTitle className="text-2xl text-sky-600">{overview.online}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="items-start gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Vaga {selectedSlot || "-"}
            </CardTitle>
            <CardDescription>Status atual, telemetria e ultimo evento recebido.</CardDescription>
          </div>
          <CardAction>
            <p className="text-xs font-medium uppercase text-slate-500">Última atualização</p>
            <p className="text-sm text-slate-700">
              {selected?.ingestedAt ? formatRelativeTime(selected.ingestedAt) : "-"}
            </p>
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
                <p className="text-3xl font-semibold text-slate-900">
                  {formatDistance(selected?.distanceCm)}
                </p>
                <p className="text-xs text-slate-400">Atualizada por eventos de heartbeat.</p>
              </div>
              <div className="flex gap-6 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-500">RSSI</p>
                  <p>
                    {typeof selected?.rssi === "number"
                      ? `${Math.round(selected.rssi)} dBm`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Uptime</p>
                  <p>{formatUptime(selected?.uptimeS)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Online</p>
                  <p>{formatOnline(selected?.online)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Histórico recente</p>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">Sem leituras registradas ainda.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                  {history.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-4">
                      <span>{formatDateTime(new Date(event.ingestedAt).getTime())}</span>
                      <span className="font-medium text-slate-900">{formatHistoryValue(event)}</span>
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
              <p className="font-mono text-xs text-slate-600">
                {`parking/space/${selectedSlot || "<slotId>"}/status`}
              </p>
              <p className="font-mono text-xs text-slate-600">
                {`parking/space/${selectedSlot || "<slotId>"}/heartbeat`}
              </p>
              <p className="font-mono text-xs text-slate-600">
                {`parking/space/${selectedSlot || "<slotId>"}/online`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
