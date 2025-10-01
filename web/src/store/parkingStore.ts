import { create } from "zustand";

export type SlotState = {
  id: string;
  status: "free" | "occupied";
  distance?: number;
  online?: boolean;
  updatedAt?: number;
};

type ParkingStore = {
  slots: Record<string, SlotState>;
  setSlot: (id: string, partial: Partial<SlotState>) => void;
  replicateFrom: string | null; // ex.: "A1" para replicar A1 em todas
  setReplicateFrom: (id: string | null) => void;
  targetIds: string[]; // vem do .env
};

// Le a lista de vagas do .env (ex.: "A1,A2,A3,B1,B2,B3")
const targetIds =
  (process.env.NEXT_PUBLIC_SLOTS || "A1,A2,A3").split(",").map((s) => s.trim());

export const useParkingStore = create<ParkingStore>((set, get) => ({
  // Inicializa todas as vagas como "free"
  slots: Object.fromEntries(
    targetIds.map((id) => [id, { id, status: "free" as const }])
  ),
  targetIds,
  replicateFrom: "A1", // por padrao replica A1
  setReplicateFrom: (id) => set({ replicateFrom: id }),

  setSlot: (id, partial) => {
    const timestamp = Date.now();
    const curr = get().slots[id] || { id, status: "free" as const };
    const updated = { ...curr, ...partial, updatedAt: timestamp };

    // Atualiza a vaga de origem
    const base = { ...get().slots, [id]: updated };

    // Se estiver com replicacao ativa e a origem for "id", replica para todas
    const src = get().replicateFrom;
    if (src && src === id) {
      const out: Record<string, SlotState> = { ...base };
      for (const tid of get().targetIds) {
        const current = out[tid] || { id: tid, status: "free" as const };
        out[tid] = { ...current, ...partial, updatedAt: timestamp };
      }
      set({ slots: out });
      return;
    }

    set({ slots: base });
  },
}));
