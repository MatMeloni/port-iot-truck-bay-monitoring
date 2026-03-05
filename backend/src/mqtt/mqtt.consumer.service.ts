import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import mqtt, { IClientOptions, MqttClient } from "mqtt";
import { ParkingService } from "../parking/parking.service";

const TOPIC_REGEX = /^parking\/space\/([^/]+)\/([^/]+)$/;

type MqttMetrics = {
  messagesReceived: number;
  parseErrors: number;
  reconnects: number;
};

@Injectable()
export class MqttConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttConsumerService.name);
  private client: MqttClient | null = null;
  private readonly metrics: MqttMetrics = {
    messagesReceived: 0,
    parseErrors: 0,
    reconnects: 0,
  };
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly parkingService: ParkingService,
  ) {}

  onModuleInit(): void {
    const brokerUrl = this.config.get<string>(
      "MQTT_BROKER_URL",
      "mqtt://mosquitto:1883",
    );
    const username = this.config.get<string>("MQTT_USERNAME");
    const password = this.config.get<string>("MQTT_PASSWORD");

    const options: IClientOptions = {
      reconnectPeriod: 1_500,
      connectTimeout: 10_000,
      clean: true,
      clientId: `nest-backend-${Math.random().toString(16).slice(2, 10)}`,
    };
    if (username) options.username = username;
    if (password) options.password = password;

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on("connect", () => {
      this.logger.log(`Conectado ao broker MQTT em ${brokerUrl}`);
      this.subscribeToTopics();
    });

    this.client.on("reconnect", () => {
      this.metrics.reconnects += 1;
      this.logger.warn("Reconectando no broker MQTT...");
    });

    this.client.on("error", (error) => {
      this.logger.error(`Erro MQTT: ${error.message}`);
    });

    this.client.on("message", (topic, payload) => {
      this.metrics.messagesReceived += 1;
      this.handleMessage(topic, payload);
    });

    this.metricsInterval = setInterval(() => {
      this.logger.log(
        `metricas mqtt: mensagens=${this.metrics.messagesReceived} parse_erros=${this.metrics.parseErrors} reconnects=${this.metrics.reconnects}`,
      );
    }, 30_000);
  }

  onModuleDestroy(): void {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (!this.client) return;
    this.client.end(true);
  }

  private subscribeToTopics(): void {
    if (!this.client) return;
    this.client.subscribe(
      [
        "parking/space/+/status",
        "parking/space/+/heartbeat",
        "parking/space/+/online",
      ],
      { qos: 0 },
      (error) => {
        if (error) {
          this.logger.error(`Falha ao assinar topicos MQTT: ${error.message}`);
          return;
        }
        this.logger.log("Topicos MQTT assinados com sucesso.");
      },
    );
  }

  private handleMessage(topic: string, payload: Buffer): void {
    const match = topic.match(TOPIC_REGEX);
    if (!match) return;

    const [, slotId, leaf] = match;
    const raw = payload.toString();

    if (leaf === "status") {
      this.handleStatus(slotId, raw);
      return;
    }
    if (leaf === "heartbeat") {
      this.handleHeartbeat(slotId, raw);
      return;
    }
    if (leaf === "online") {
      this.handleOnline(slotId, raw);
    }
  }

  private handleStatus(slotId: string, raw: string): void {
    try {
      if (raw === "free" || raw === "occupied") {
        void this.parkingService.applyStatus({ slotId, status: raw });
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const status = parsed.status;
      if (status !== "free" && status !== "occupied") {
        throw new Error("Campo status invalido");
      }

      void this.parkingService.applyStatus({
        slotId,
        status,
        sourceTs: toOptionalNumber(parsed.sourceTs),
        payload: parsed,
      });
    } catch {
      this.metrics.parseErrors += 1;
      this.logger.warn(`Payload status invalido para ${slotId}: ${raw}`);
    }
  }

  private handleHeartbeat(slotId: string, raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      void this.parkingService.applyHeartbeat(slotId, {
        distanceCm:
          toOptionalNumber(parsed.distanceCm) ??
          toOptionalNumber(parsed.distance_cm),
        rssi: toOptionalNumber(parsed.rssi),
        uptimeS:
          toOptionalNumber(parsed.uptimeS) ?? toOptionalNumber(parsed.uptime_s),
        sourceTs: toOptionalNumber(parsed.sourceTs),
        payload: parsed,
      });
    } catch {
      this.metrics.parseErrors += 1;
      this.logger.warn(`Payload heartbeat invalido para ${slotId}: ${raw}`);
    }
  }

  private handleOnline(slotId: string, raw: string): void {
    try {
      if (raw === "online" || raw === "offline") {
        void this.parkingService.applyOnline({
          slotId,
          online: raw === "online",
        });
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const online = toOptionalBoolean(parsed.online);
      if (online === undefined) {
        throw new Error("Campo online invalido");
      }

      void this.parkingService.applyOnline({
        slotId,
        online,
        sourceTs: toOptionalNumber(parsed.sourceTs),
        payload: parsed,
      });
    } catch {
      this.metrics.parseErrors += 1;
      this.logger.warn(`Payload online invalido para ${slotId}: ${raw}`);
    }
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}
