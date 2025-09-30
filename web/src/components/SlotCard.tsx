"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlotState } from "@/store/parkingStore";

export default function SlotCard({ slot }: { slot: SlotState }) {
  const isOcc = slot.status === "occupied";
  return (
    <Card className={isOcc ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Vaga {slot.id}</span>
          <Badge variant={isOcc ? "destructive" : "secondary"}>
            {isOcc ? "Ocupada" : "Livre"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div>Distância: {slot.distance !== undefined ? `${slot.distance.toFixed(1)} cm` : "—"}</div>
        <div>Dispositivo: {slot.online ? "Online" : "Offline"}</div>
      </CardContent>
    </Card>
  );
}
