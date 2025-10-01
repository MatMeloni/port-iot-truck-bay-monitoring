"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

export type ClientState = "demo" | "connecting" | "connected" | "reconnecting" | "error";
export type SlotStatus = "free" | "occupied" | "unknown";
export type HistoryPoint = { t: number; d: number };

const url = process.env.NEXT_PUBLIC_MQTT_URL;
const defaultSlot = process.env.NEXT_PUBLIC_SLOT_ID ?? "bay-01";
const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined;
const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined;

const HEARTBEAT_TIMEOUT_MS = 10_000;
const RETAIN_WARNING_MS = 3_000;
const HISTORY_SIZE = 20;

export type UseMqttState = {
  clientState: ClientState;
  status: SlotStatus;
  distance?: number;
  rssi?: number;
  uptime?: number;
  lastUpdated?: number;
  history: HistoryPoint[];
  slotId: string;
  setSlotId: (next: string) => void;
  retainWarning: boolean;
  error?: string;
  isDemo: boolean;
};

function sanitiseSlotId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : defaultSlot;
}

function getTopics(slotId: string) {
  const normalized = sanitiseSlotId(slotId);
  return {
    status: `parking/${normalized}/status`,
    heartbeat: `parking/${normalized}/heartbeat`,
  } as const;
}

export function useMqtt(): UseMqttState {
  const isDemo = !url;
  const [clientState, setClientState] = useState<ClientState>(isDemo ? "demo" : "connecting");
  const [status, setStatus] = useState<SlotStatus>("unknown");
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [rssi, setRssi] = useState<number | undefined>(undefined);
  const [uptime, setUptime] = useState<number | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [slotId, setSlotIdState] = useState<string>(defaultSlot);
  const [retainWarning, setRetainWarning] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const clientRef = useRef<MqttClient | null>(null);
  const lastDistanceTimestampRef = useRef<number | null>(null);
  const retainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetainTimer = useCallback(() => {
    if (retainTimerRef.current) {
      clearTimeout(retainTimerRef.current);
      retainTimerRef.current = null;
    }
  }, []);

  const markUpdate = useCallback(() => {
    clearRetainTimer();
    setRetainWarning(false);
    setLastUpdated(Date.now());
  }, [clearRetainTimer]);

  const setSlotId = useCallback((next: string) => {
    setSlotIdState(sanitiseSlotId(next));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isDemo) {
      return;
    }

    setClientState("connecting");
    setError(undefined);

    const client = mqtt.connect(url!, {
      reconnectPeriod: 2_000,
      connectTimeout: 8_000,
      clean: true,
      username,
      password,
    });

    clientRef.current = client;

    const handleConnect = () => {
      setClientState("connected");
      setError(undefined);
    };
    const handleReconnect = () => {
      setClientState((prev) => (prev === "error" ? "error" : "reconnecting"));
    };
    const handleClose = () => {
      setClientState((prev) => (prev === "error" ? "error" : "reconnecting"));
    };
    const handleError = (event: Error) => {
      setClientState("error");
      setError(event?.message ?? "Erro de conexao MQTT");
    };

    client.on("connect", handleConnect);
    client.on("reconnect", handleReconnect);
    client.on("close", handleClose);
    client.on("offline", handleReconnect);
    client.on("error", handleError);

    return () => {
      client.off("connect", handleConnect);
      client.off("reconnect", handleReconnect);
      client.off("close", handleClose);
      client.off("offline", handleReconnect);
      client.off("error", handleError);
      try {
        client.end(true);
      } catch (err) {
        console.warn("[mqtt] Falha ao encerrar cliente", err);
      }
      clientRef.current = null;
    };
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      const tickInterval = 5_000;
      let counter = 0;
      setClientState("demo");
      setStatus("unknown");
      setDistance(undefined);
      setRssi(undefined);
      setUptime(undefined);
      setLastUpdated(undefined);
      setHistory([]);
      let uptimeValue = 0;

      const tick = () => {
        counter += 1;
        const occupied = counter % 2 === 0;
        const now = Date.now();
        const simulatedDistance = occupied
          ? 20 + Math.random() * 8
          : 80 + Math.random() * 40;
        uptimeValue += tickInterval / 1_000;

        setStatus(occupied ? "occupied" : "free");
        setDistance(Number(simulatedDistance.toFixed(1)));
        setRssi(-45 - Math.round(Math.random() * 15));
        setUptime(Math.round(uptimeValue));
        setLastUpdated(now);
        setHistory((prev) => {
          const base = prev.slice(-HISTORY_SIZE + 1);
          return [...base, { t: now, d: Number(simulatedDistance.toFixed(1)) }];
        });
      };

      const interval = setInterval(tick, tickInterval);
      tick();

      return () => {
        clearInterval(interval);
      };
    }
  }, [isDemo, slotId]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    const client = clientRef.current;
    if (!client) {
      return;
    }

    const topics = getTopics(slotId);

    setStatus("unknown");
    setDistance(undefined);
    setRssi(undefined);
    setUptime(undefined);
    setLastUpdated(undefined);
    setHistory([]);
    lastDistanceTimestampRef.current = null;
    setRetainWarning(false);
    clearRetainTimer();

    client.subscribe([topics.status, topics.heartbeat], (subscribeError) => {
      if (subscribeError) {
        console.warn("[mqtt] Falha ao assinar topicos", subscribeError);
        setError("Nao foi possivel assinar os topicos MQTT");
      }
    });

    retainTimerRef.current = setTimeout(() => {
      setRetainWarning(true);
    }, RETAIN_WARNING_MS);

    const handleMessage = (topic: string, payload: Buffer) => {
      if (topic !== topics.status && topic !== topics.heartbeat) {
        return;
      }

      const raw = typeof payload === "string" ? payload : payload.toString();

      if (topic === topics.status) {
        if (raw === "occupied" || raw === "free") {
          setStatus(raw);
          markUpdate();
        }
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        let updated = false;
        if (typeof parsed.distance_cm === "number") {
          const numericDistance = Number(parsed.distance_cm);
          setDistance(numericDistance);
          lastDistanceTimestampRef.current = Date.now();
          setHistory((prev) => {
            const base = prev.slice(-HISTORY_SIZE + 1);
            return [...base, { t: Date.now(), d: numericDistance }];
          });
          updated = true;
        }
        if (typeof parsed.rssi === "number") {
          setRssi(parsed.rssi);
          updated = true;
        }
        if (typeof parsed.uptime_s === "number") {
          setUptime(parsed.uptime_s);
          updated = true;
        }
        if (updated) {
          markUpdate();
        }
      } catch (parseError) {
        console.warn("[mqtt] Payload heartbeat invalido", parseError);
      }
    };

    client.on("message", handleMessage);

    return () => {
      client.off("message", handleMessage);
      try {
        client.unsubscribe([topics.status, topics.heartbeat]);
      } catch (unsubscribeError) {
        console.warn("[mqtt] Falha ao cancelar inscricao", unsubscribeError);
      }
      clearRetainTimer();
    };
  }, [slotId, isDemo, markUpdate, clearRetainTimer]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    const interval = setInterval(() => {
      if (!lastDistanceTimestampRef.current) {
        return;
      }
      const age = Date.now() - lastDistanceTimestampRef.current;
      if (age > HEARTBEAT_TIMEOUT_MS) {
        lastDistanceTimestampRef.current = null;
        setDistance((current) => (current === undefined ? current : undefined));
      }
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [isDemo]);

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
