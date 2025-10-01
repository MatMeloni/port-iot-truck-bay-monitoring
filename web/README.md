# Monitoramento de vaga (web)

Aplicação Next.js que acompanha, em tempo real, uma vaga de caminhão publicada via MQTT (WebSocket). A UI exibe status (livre/ocupada), distância do sensor e métricas adicionais recebidas no heartbeat.

## Requisitos

- Node.js 20+ e npm (ou pnpm/yarn se preferir).
- Broker MQTT com suporte a WebSocket.

## Configuração

1. Copie o arquivo de exemplo e preencha seus dados locais:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Em sistemas Unix, use `cp .env.example .env.local`.

2. Edite `.env.local` e configure as variáveis abaixo:

   | Variável | Descrição |
   | -------- | --------- |
   | `NEXT_PUBLIC_MQTT_URL` | URL WebSocket do broker (ex.: `ws://192.168.1.121:9001`). |
   | `NEXT_PUBLIC_SLOT_ID` | Slot default monitorado (ex.: `bay-01`). Pode ser alterado na própria UI. |
   | `NEXT_PUBLIC_MQTT_USERNAME` | Usuário opcional do broker. Deixe vazio para conexão anônima. |
   | `NEXT_PUBLIC_MQTT_PASSWORD` | Senha opcional do broker. |

3. Instale dependências e suba o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000) para visualizar o painel.

> `.env`, `.env.local` e variantes já estão ignorados no `.gitignore`, evitando vazamento de credenciais.

## Tópicos MQTT esperados

- `parking/<slot>/status` - payload `"occupied"` ou `"free"` (retain recomendado).
- `parking/<slot>/heartbeat` - payload JSON `{"slot":"...","distance_cm":31.2,"rssi":-57,"uptime_s":123}`.

A troca de slot pela UI cancela a inscrição atual e assina automaticamente os tópicos do novo slot.

## Comportamento da UI

- **Estado da conexão**: Conectando, Conectado, Reconectando, Erro ou Demo (quando não há URL configurada).
- **Status da vaga**: badge verde (LIVRE) ou vermelha (OCUPADA).
- **Distância**: última leitura do heartbeat (mostra `-` se nenhum dado chegar em 10s).
- **Última atualização**: exibida em tempo relativo.
- **RSSI / Uptime**: preenchidos quando o heartbeat traz os campos `rssi` e `uptime_s`.
- **Histórico**: lista com as 10 leituras mais recentes.
- **Alerta retain**: banner discreto se nenhum payload retido chegar nos 3s iniciais.
- **Seleção de slot**: input no topo que substitui `NEXT_PUBLIC_SLOT_ID` em runtime, sem recarregar a página.

## Modo demo

Se `NEXT_PUBLIC_MQTT_URL` não estiver definido, o app entra em modo demo com dados simulados e um aviso visível. Configure a URL para conectar no broker real.

## Scripts úteis

- `npm run dev` - servidor de desenvolvimento.
- `npm run build` - build de produção.
- `npm run start` - executa o build.
- `npm run lint` - lint via ESLint.

## Estrutura relevante

- `src/hooks/useMqtt.ts` - hook de conexão e assinatura MQTT (WebSocket) com fallback demo.
- `src/app/page.tsx` - página principal que consome o hook e renderiza o painel.
- `.env.example` - base para configurar o ambiente local.

