import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MqttModule } from "./mqtt/mqtt.module";
import { ParkingEventEntity } from "./parking/entities/parking-event.entity";
import { ParkingModule } from "./parking/parking.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST", "postgres"),
        port: Number(config.get<string>("POSTGRES_PORT", "5432")),
        username: config.get<string>("POSTGRES_USER", "portiot"),
        password: config.get<string>("POSTGRES_PASSWORD", "portiot"),
        database: config.get<string>("POSTGRES_DB", "portiot"),
        entities: [ParkingEventEntity],
        synchronize: config.get<string>("TYPEORM_SYNC", "true") === "true",
      }),
    }),
    RealtimeModule,
    ParkingModule,
    MqttModule,
  ],
})
export class AppModule {}
