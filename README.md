# Port IoT - Truck Bay Monitoring (ESP32 + MQTT + NestJS + Next.js)

Sistema de **monitoramento de baias de caminhões** em ambientes portuários usando:
- **ESP32 + HC-SR04** para detecção de ocupação
- **MQTT (Mosquitto)** para telemetria
- **NestJS** para ingestão MQTT, API e stream em tempo real
- **Next.js** para dashboard web
- **PostgreSQL** para histórico de eventos

## Arquitetura (visão rápida)
ESP32 -> MQTT (Mosquitto) -> NestJS (ingestão + API + SSE) -> Next.js
                                    |
                                    -> PostgreSQL

## Contrato MQTT
- Documento canônico: `docs/mqtt-contract.md`
- Prefixo único de tópicos: `parking/space/<slotId>/...`
- Eventos usados no MVP:
  - `status` (retain = true)
  - `heartbeat` (retain = false)
  - `online` (retain = true, com LWT)

## Pastas
- `broker/` – Docker Compose + `mosquitto.conf`
- `backend/` – API NestJS + ingestão MQTT + PostgreSQL
- `web/` – Dashboard Next.js
- `firmware/` – Código do ESP32 (Arduino)
- `docs/` – Diagramas, anotações e relatórios

## Como rodar (resumo)
1. `docker compose up --build`
2. Acessar dashboard em `http://localhost:3000`
3. API NestJS em `http://localhost:4000/api`
4. Broker MQTT em `localhost:1883`
5. ESP32 deve publicar seguindo `docs/mqtt-contract.md`

## Endpoints do backend
- `GET /api/parking/health`
- `GET /api/parking/slots`
- `GET /api/parking/slots/:slotId/history?limit=20`
- `GET /api/parking/stream` (SSE)

## Observabilidade (MVP)
- Logs do NestJS para conexao MQTT e processamento de eventos.
- Metricas do consumidor MQTT no log a cada 30s:
  - mensagens recebidas,
  - erros de parse,
  - reconexoes.

## Roadmap de migracao para AWS IoT Core
1. Trocar `MQTT_BROKER_URL` para endpoint TLS do AWS IoT Core.
2. Ativar autenticacao por certificados para o cliente MQTT do backend.
3. Manter o frontend inalterado (continua consumindo API/stream do NestJS).
4. Introduzir migracoes versionadas no banco e desligar sync automatico.

## Roadmap
- [ ] Histórico e gráficos
- [ ] Autenticação MQTT + TLS
- [ ] Multi-dispositivo (IDs A1, A2, …)
- [ ] Migração para AWS IoT Core
