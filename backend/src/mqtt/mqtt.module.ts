import { Module } from "@nestjs/common";
import { ParkingModule } from "../parking/parking.module";
import { MqttConsumerService } from "./mqtt.consumer.service";

@Module({
  imports: [ParkingModule],
  providers: [MqttConsumerService],
})
export class MqttModule {}
