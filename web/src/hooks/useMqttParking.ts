"use client";
import { useEffect } from "react";
import { getMqttClient } from "@/lib/mqttClient";
import { useParkingStore } from "@/store/parkingStore";

const MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function useMqttParking() {
  const setSlot = useParkingStore((s) => s.setSlot);
  const source = useParkingStore((s) => s.replicateFrom);

  useEffect(() => {
    if (MOCK) {
      // Mock simples: alterna ocupado/livre a cada 4s e distância aleatória
      const ids = ["A1"]; // fonte real (seria seu ESP)
      let occupied = false;
      const t = setInterval(() => {
        occupied = !occupied;
        const cm = occupied ? 12 + Math.random() * 4 : 40 + Math.random() * 60;
        ids.forEach((id) => {
          setSlot(id, { status: occupied ? "occupied" : "free", distance: cm, online: true });
        });
      }, 4000);
      return () => clearInterval(t);
    }

    // ====== MODO REAL (MQTT) ======
    const client = getMqttClient();
    if (!client) return;

    const onMessage = (topic: string, payload: Buffer) => {
      const msg = payload.toString();
      const parts = topic.split("/");
      const id = parts[2]; // parking/space/<id>/* 
      const leaf = parts[3];

      if (leaf === "status") {
        if (msg === "free" || msg === "occupied") setSlot(id, { status: msg });
      } else if (leaf === "distance") {
        try {
          const data = JSON.parse(msg);
          if (typeof data.cm === "number") setSlot(id, { distance: data.cm });
        } catch {}
      } else if (leaf === "online") {
        setSlot(id, { online: msg === "online" });
      }
    };

    client.on("message", onMessage);
    return () => {
      try { client.off("message", onMessage); } catch {}
    };
  }, [setSlot, source]);
}
