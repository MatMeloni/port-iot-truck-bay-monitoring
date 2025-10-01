"use client";

import { useMemo } from "react";

import SlotCard from "@/components/SlotCard";
import TopBar from "@/components/TopBar";
import { useMqttParking } from "@/hooks/useMqttParking";
import { useParkingStore, type SlotState } from "@/store/parkingStore";

export default function Page() {
  useMqttParking();
  const { targetIds, slots, replicateFrom } = useParkingStore();

  const orderedSlots = useMemo(
    () =>
      targetIds
        .map((id) => slots[id])
        .filter((slot): slot is SlotState => Boolean(slot)),
    [targetIds, slots]
  );

  return (
    <main className="relative mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div
        className="pointer-events-none absolute inset-x-8 top-4 -z-10 h-72 rounded-[3rem] bg-gradient-to-b from-sky-100/60 via-white to-transparent blur-2xl"
        aria-hidden="true"
      />
      <div className="space-y-8">
        <TopBar />
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {orderedSlots.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-sm text-slate-500 shadow-sm">
              Nenhuma vaga configurada no momento. Ajuste a variavel NEXT_PUBLIC_SLOTS para aparecerem aqui.
            </p>
          ) : (
            orderedSlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} isPrimary={slot.id === replicateFrom} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
