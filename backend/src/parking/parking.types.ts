import { ParkingStatus } from "./entities/parking-event.entity";

export type SlotSnapshot = {
  slotId: string;
  status: ParkingStatus | "unknown";
  online: boolean;
  distanceCm?: number;
  rssi?: number;
  uptimeS?: number;
  sourceTs?: number;
  ingestedAt: number;
};

export type StreamEvent = {
  event: "slot_update";
  data: SlotSnapshot;
};
