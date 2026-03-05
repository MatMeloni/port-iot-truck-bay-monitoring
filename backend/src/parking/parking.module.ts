import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RealtimeModule } from "../realtime/realtime.module";
import { ParkingController } from "./parking.controller";
import { ParkingEventEntity } from "./entities/parking-event.entity";
import { ParkingService } from "./parking.service";

@Module({
  imports: [TypeOrmModule.forFeature([ParkingEventEntity]), RealtimeModule],
  providers: [ParkingService],
  controllers: [ParkingController],
  exports: [ParkingService],
})
export class ParkingModule {}
