# Monitoramento de vagas (web)

Aplicação Next.js que consome dados do backend NestJS para exibir visão geral de vagas, detalhe por vaga e histórico recente. O frontend recebe atualizações em tempo real por SSE.

## Requisitos para desenvolvimento local

- Node.js 20+ e npm (ou pnpm/yarn se preferir).
- Backend NestJS ativo (API + stream).

## Configuração

1. Configure a URL pública da API:

   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` e configure:

   | Variável | Descrição |
   | -------- | --------- |
   | `NEXT_PUBLIC_API_BASE_URL` | Endereço da API do backend (ex.: `http://localhost:4000/api`). |

3. Instale dependências e suba o servidor:

   ```bash
   npm install
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000) para visualizar o painel.

## Comportamento da UI

- **Estado da conexão**: Conectando, Conectado ou Erro (via SSE).
- **Visão geral**: total de vagas, livres, ocupadas e dispositivos online.
- **Detalhe da vaga**: status, distância, RSSI, uptime e última atualização.
- **Histórico**: últimos eventos persistidos para a vaga selecionada.
- **Seleção de slot**: input no topo para alternar o slot consultado.

## Scripts úteis

- `npm run dev` - servidor de desenvolvimento.
- `npm run build` - build de produção.
- `npm run start` - executa o build.
- `npm run lint` - lint via ESLint.

## Estrutura relevante

- `src/app/page.tsx` - dashboard principal.
- `src/lib/backendApi.ts` - cliente HTTP/SSE para backend.
- `.env.example` - base para configurar o ambiente local.

