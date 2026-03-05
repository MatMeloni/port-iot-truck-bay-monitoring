import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

export type ParkingEventType = "status" | "heartbeat" | "online";
export type ParkingStatus = "free" | "occupied";

@Entity({ name: "parking_events" })
@Index(["slotId", "ingestedAt"])
export class ParkingEventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "slot_id", type: "varchar", length: 64 })
  slotId!: string;

  @Column({ name: "event_type", type: "varchar", length: 32 })
  eventType!: ParkingEventType;

  @Column({ type: "varchar", length: 16, nullable: true })
  status!: ParkingStatus | null;

  @Column({ type: "boolean", nullable: true })
  online!: boolean | null;

  @Column({ name: "distance_cm", type: "double precision", nullable: true })
  distanceCm!: number | null;

  @Column({ type: "int", nullable: true })
  rssi!: number | null;

  @Column({ name: "uptime_s", type: "int", nullable: true })
  uptimeS!: number | null;

  @Column({ name: "source_ts", type: "bigint", nullable: true })
  sourceTs!: string | null;

  @Column({ type: "jsonb", nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "ingested_at", type: "timestamptz" })
  ingestedAt!: Date;
}
