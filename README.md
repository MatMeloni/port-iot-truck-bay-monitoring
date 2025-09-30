# Port IoT – Truck Bay Monitoring (ESP32 + MQTT + Next.js)

Sistema de **monitoramento de baias de caminhões** em ambientes portuários usando:
- **ESP32 + HC-SR04** para detecção de ocupação
- **MQTT (Mosquitto)** para telemetria
- **Next.js** para dashboard web (WebSocket MQTT)

## Arquitetura (visão rápida)
ESP32  →  MQTT (broker)  →  Next.js (WebSockets MQTT)

**Tópicos MQTT** (retidos):
- `parking/space/<ID>/status` → `occupied` | `free`
- `parking/space/<ID>/distance` → `{"cm": 17.3, "ts": 1712345678}`
- `parking/space/<ID>/online` → `online` | `offline` (LWT)

## Pastas
- `broker/` – Docker Compose + `mosquitto.conf`
- `web/` – Dashboard Next.js
- `firmware/` – Código do ESP32 (Arduino)
- `docs/` – Diagramas, anotações e relatórios

## Como rodar (resumo)
1. **Broker**: `cd broker && docker compose up -d`
2. **Web**: `cd web && npm i && npm run dev` (configurar `.env.local`)
3. **ESP32**: gravar firmware apontando para o host/porta do broker.

## Roadmap
- [ ] Histórico e gráficos
- [ ] Autenticação MQTT + TLS
- [ ] Multi-dispositivo (IDs A1, A2, …)
- [ ] Deploy (Vercel + broker gerenciado)
