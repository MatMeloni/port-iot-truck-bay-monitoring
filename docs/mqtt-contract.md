# Contrato MQTT (MVP)

Este documento define o contrato canônico de mensagens entre dispositivos (ESP32),
broker (Mosquitto) e backend (NestJS).

## Versão do contrato

- `schemaVersion`: `1`

## Convenções

- Prefixo de tópico: `parking/space/<slotId>/...`
- `slotId` em minúsculas, sem espaços (ex.: `bay-01`, `bay-a2`)
- QoS padrão: `0` (MVP)
- Clock de origem:
  - Quando possível, enviar `sourceTs` em epoch milliseconds.
  - Se não houver RTC/NTP no dispositivo, backend usa `ingestedAt`.

## Tópicos

### 1) Status da vaga

- Tópico: `parking/space/<slotId>/status`
- Retained: `true`
- Payload:

```json
{
  "schemaVersion": 1,
  "slotId": "bay-01",
  "status": "occupied",
  "sourceTs": 1760000000000
}
```

Campos:
- `status`: `free` | `occupied`

### 2) Telemetria/heartbeat

- Tópico: `parking/space/<slotId>/heartbeat`
- Retained: `false`
- Payload:

```json
{
  "schemaVersion": 1,
  "slotId": "bay-01",
  "distanceCm": 17.3,
  "rssi": -62,
  "uptimeS": 932,
  "sourceTs": 1760000000100
}
```

### 3) Disponibilidade (LWT)

- Tópico: `parking/space/<slotId>/online`
- Retained: `true`
- Payload online:

```json
{
  "schemaVersion": 1,
  "slotId": "bay-01",
  "online": true,
  "sourceTs": 1760000000200
}
```

- Payload offline (LWT):

```json
{
  "schemaVersion": 1,
  "slotId": "bay-01",
  "online": false,
  "sourceTs": 1760000000300
}
```

## Regras de compatibilidade (MVP)

- Backend deve tolerar payload legado:
  - `status` como string simples (`"free"` ou `"occupied"`).
  - `online` como string simples (`"online"` ou `"offline"`).
  - `heartbeat` legado com `distance_cm`.
- Publicadores novos devem usar o formato JSON canônico deste documento.
