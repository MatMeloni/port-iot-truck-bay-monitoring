import {
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Query,
  Sse,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import { RealtimeService } from "../realtime/realtime.service";
import { ParkingService } from "./parking.service";

@Controller("parking")
export class ParkingController {
  constructor(
    private readonly parkingService: ParkingService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Get("health")
  health() {
    return { ok: true, service: "backend", ts: Date.now() };
  }

  @Get("slots")
  slots() {
    return this.parkingService.listSlots();
  }

  @Get("slots/:slotId/history")
  history(
    @Param("slotId") slotId: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.parkingService.getHistory(slotId, limit ?? 50);
  }

  @Sse("stream")
  stream(): Observable<MessageEvent> {
    return this.realtimeService
      .events()
      .pipe(map((payload) => ({ type: payload.event, data: payload.data })));
  }
}
