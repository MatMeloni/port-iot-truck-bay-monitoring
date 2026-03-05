import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ParkingEventEntity,
  ParkingStatus,
} from "./entities/parking-event.entity";
import { RealtimeService } from "../realtime/realtime.service";
import { SlotSnapshot } from "./parking.types";

type HeartbeatData = {
  distanceCm?: number;
  rssi?: number;
  uptimeS?: number;
  sourceTs?: number;
  payload?: Record<string, unknown>;
};

@Injectable()
export class ParkingService implements OnModuleInit {
  private readonly logger = new Logger(ParkingService.name);
  private readonly currentState = new Map<string, SlotSnapshot>();

  constructor(
    @InjectRepository(ParkingEventEntity)
    private readonly eventsRepository: Repository<ParkingEventEntity>,
    private readonly realtimeService: RealtimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    const events = await this.eventsRepository.find({
      order: { slotId: "ASC", ingestedAt: "DESC", id: "DESC" },
      take: 500,
    });

    const seen = new Set<string>();
    for (const e of events) {
      if (seen.has(e.slotId)) continue;
      seen.add(e.slotId);
      const snapshot: SlotSnapshot = {
        slotId: e.slotId,
        status: (e.status as SlotSnapshot["status"]) ?? "unknown",
        online: Boolean(e.online ?? false),
        distanceCm: toOptionalNumber(e.distanceCm),
        rssi: toOptionalNumber(e.rssi),
        uptimeS: toOptionalNumber(e.uptimeS),
        sourceTs: e.sourceTs ? Number(e.sourceTs) : undefined,
        ingestedAt: new Date(e.ingestedAt).getTime(),
      };
      this.currentState.set(snapshot.slotId, snapshot);
    }

    this.logger.log(
      `Estado inicial carregado para ${this.currentState.size} vaga(s).`,
    );
  }

  async applyStatus(args: {
    slotId: string;
    status: ParkingStatus;
    sourceTs?: number;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const event = this.eventsRepository.create({
      slotId: args.slotId,
      eventType: "status",
      status: args.status,
      sourceTs: args.sourceTs ? String(args.sourceTs) : null,
      payload: args.payload ?? null,
    });
    const saved = await this.eventsRepository.save(event);
    this.upsertSnapshot(args.slotId, {
      status: args.status,
      sourceTs: args.sourceTs,
      ingestedAt: saved.ingestedAt.getTime(),
    });
  }

  async applyOnline(args: {
    slotId: string;
    online: boolean;
    sourceTs?: number;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const event = this.eventsRepository.create({
      slotId: args.slotId,
      eventType: "online",
      online: args.online,
      sourceTs: args.sourceTs ? String(args.sourceTs) : null,
      payload: args.payload ?? null,
    });
    const saved = await this.eventsRepository.save(event);
    this.upsertSnapshot(args.slotId, {
      online: args.online,
      sourceTs: args.sourceTs,
      ingestedAt: saved.ingestedAt.getTime(),
    });
  }

  async applyHeartbeat(slotId: string, data: HeartbeatData): Promise<void> {
    const event = this.eventsRepository.create({
      slotId,
      eventType: "heartbeat",
      distanceCm: data.distanceCm ?? null,
      rssi: data.rssi ?? null,
      uptimeS: data.uptimeS ?? null,
      sourceTs: data.sourceTs ? String(data.sourceTs) : null,
      payload: data.payload ?? null,
    });
    const saved = await this.eventsRepository.save(event);
    this.upsertSnapshot(slotId, {
      distanceCm: data.distanceCm,
      rssi: data.rssi,
      uptimeS: data.uptimeS,
      sourceTs: data.sourceTs,
      ingestedAt: saved.ingestedAt.getTime(),
    });
  }

  listSlots(): SlotSnapshot[] {
    return [...this.currentState.values()].sort((a, b) =>
      a.slotId.localeCompare(b.slotId),
    );
  }

  async getHistory(slotId: string, limit = 50): Promise<ParkingEventEntity[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), 500);
    return this.eventsRepository.find({
      where: { slotId },
      order: { ingestedAt: "DESC", id: "DESC" },
      take: boundedLimit,
    });
  }

  private upsertSnapshot(
    slotId: string,
    patch: Partial<SlotSnapshot> & { ingestedAt: number },
  ): void {
    const current = this.currentState.get(slotId) ?? {
      slotId,
      status: "unknown" as const,
      online: false,
      ingestedAt: patch.ingestedAt,
    };
    const next: SlotSnapshot = {
      ...current,
      ...patch,
      slotId,
    };
    this.currentState.set(slotId, next);
    this.realtimeService.emit({ event: "slot_update", data: next });
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}
