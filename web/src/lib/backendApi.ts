export type SlotStatus = "free" | "occupied" | "unknown";

export type SlotSnapshot = {
  slotId: string;
  status: SlotStatus;
  online: boolean;
  distanceCm?: number;
  rssi?: number;
  uptimeS?: number;
  sourceTs?: number;
  ingestedAt: number;
};

export type ParkingHistoryEvent = {
  id: number;
  slotId: string;
  eventType: "status" | "heartbeat" | "online";
  status: "free" | "occupied" | null;
  online: boolean | null;
  distanceCm: number | null;
  rssi: number | null;
  uptimeS: number | null;
  sourceTs: string | null;
  ingestedAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function endpoint(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchSlots(signal?: AbortSignal): Promise<SlotSnapshot[]> {
  const response = await fetch(endpoint("/parking/slots"), { signal });
  if (!response.ok) {
    throw new Error(`Falha ao buscar slots (${response.status})`);
  }
  return (await response.json()) as SlotSnapshot[];
}

export async function fetchSlotHistory(
  slotId: string,
  limit = 30,
  signal?: AbortSignal,
): Promise<ParkingHistoryEvent[]> {
  const response = await fetch(
    endpoint(`/parking/slots/${encodeURIComponent(slotId)}/history?limit=${limit}`),
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Falha ao buscar historico (${response.status})`);
  }
  return (await response.json()) as ParkingHistoryEvent[];
}

export function createParkingStream(): EventSource {
  return new EventSource(endpoint("/parking/stream"));
}
