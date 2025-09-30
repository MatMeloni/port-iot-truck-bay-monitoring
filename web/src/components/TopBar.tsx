"use client";
import { useParkingStore } from "@/store/parkingStore";

export default function TopBar() {
  const { slots } = useParkingStore();
  const anyOnline = Object.values(slots).some((s) => s.online);
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Painel de Vagas • Port IoT</h1>
      <span className="text-sm">{anyOnline ? "Conectado" : "Aguardando…"}</span>
    </div>
  );
}
