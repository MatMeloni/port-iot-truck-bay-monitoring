# Backend NestJS (Ingestao MQTT + API)

Backend responsavel por:
- consumir eventos MQTT do Mosquitto,
- persistir historico no PostgreSQL,
- disponibilizar API REST e stream SSE para o frontend.

## Endpoints principais

- `GET /api/parking/health`
- `GET /api/parking/slots`
- `GET /api/parking/slots/:slotId/history?limit=20`
- `GET /api/parking/stream` (SSE)

## Variaveis de ambiente

Use `.env.example` como base.

| Variavel | Descricao |
| --- | --- |
| `PORT` | Porta HTTP do backend |
| `MQTT_BROKER_URL` | URL MQTT (ex.: `mqtt://mosquitto:1883`) |
| `MQTT_USERNAME` | Usuario MQTT opcional |
| `MQTT_PASSWORD` | Senha MQTT opcional |
| `POSTGRES_HOST` | Host PostgreSQL |
| `POSTGRES_PORT` | Porta PostgreSQL |
| `POSTGRES_USER` | Usuario PostgreSQL |
| `POSTGRES_PASSWORD` | Senha PostgreSQL |
| `POSTGRES_DB` | Banco PostgreSQL |
| `TYPEORM_SYNC` | `true` para sincronizacao automatica no MVP |

## Observabilidade minima (MVP)

- Logs estruturados do NestJS.
- Metricas basicas do consumidor MQTT a cada 30s:
  - `mensagens`,
  - `parse_erros`,
  - `reconnects`.

## Roadmap AWS IoT Core

1. Substituir `MQTT_BROKER_URL` para endpoint TLS do AWS IoT Core.
2. Habilitar autenticacao por certificados (mTLS) no cliente MQTT do backend.
3. Evoluir camada de configuracao para selecionar provider (`mosquitto` ou `aws-iot`).
4. Desligar `TYPEORM_SYNC` e aplicar migracoes versionadas.
