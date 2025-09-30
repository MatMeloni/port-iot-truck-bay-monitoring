"use client";
import TopBar from "@/components/TopBar";
import SlotCard from "@/components/SlotCard";
import { useMqttParking } from "@/hooks/useMqttParking";
import { useParkingStore } from "@/store/parkingStore";

export default function Page() {
  useMqttParking();
  const { targetIds, slots } = useParkingStore();

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <TopBar />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {targetIds.map((id) => (
          <SlotCard key={id} slot={slots[id]} />
        ))}
      </div>
    </main>
  );
}
