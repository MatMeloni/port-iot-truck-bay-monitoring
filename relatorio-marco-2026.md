# Relatório de Marco – 2026
## Sistema de Controle e Monitoramento de Filas de Caminhões (Porto de Santos)

Documento de progresso da pesquisa em relação ao Relatório Trimestral – Novembro 2025 (Porto de Santos) e às alterações implementadas no repositório.

---

## 1. Implementação efetiva do backend NestJS

No relatório de novembro o backend em NestJS era descrito como parte da arquitetura; o diagnóstico apontou que não existia backend no repositório.  
**Progresso:** Backend NestJS criado em `backend/`, com ingestão MQTT, API REST e stream SSE, atuando como intermediário entre broker e frontend.

---

## 2. Persistência em PostgreSQL em operação

O relatório já justificava a escolha do PostgreSQL em relação a Firestore/DynamoDB; a persistência não estava implementada.  
**Progresso:** Uso de PostgreSQL com TypeORM, entidade `parking_events`, persistência de status, heartbeat e online, com consulta de histórico por vaga (`/api/parking/slots/:slotId/history`).

---

## 3. Contrato MQTT único e documentado

O diagnóstico apontou divergência de tópicos entre README, firmware e frontend.  
**Progresso:** Contrato formal em `docs/mqtt-contract.md` com tópicos `parking/space/<slotId>/status`, `heartbeat` e `online`, payload JSON versionado (`schemaVersion`) e compatibilidade com formato legado; firmware ajustado para esse padrão.

---

## 4. Pipeline completo em ambiente reproduzível

O relatório descrevia as camadas (ESP32 → MQTT → backend → frontend) sem um ambiente único de validação.  
**Progresso:** Stack completa orquestrada com Docker Compose (Mosquitto, PostgreSQL, backend, web), executável com `docker compose up --build`, permitindo validar o fluxo da borda ao dashboard.

---

## 5. Tempo real via backend (SSE) em vez de MQTT no browser

Antes o frontend podia depender de conexão MQTT direta (WebSocket) no navegador.  
**Progresso:** Dashboard Next.js consome apenas o backend (REST + SSE em `/api/parking/stream`), com ingestão MQTT concentrada no NestJS, o que melhora segurança, escalabilidade e prepara migração para AWS IoT Core sem alterar o frontend.

---

## 6. API de histórico e base para análises

O relatório citava dados históricos e futura IA, sem API de histórico disponível.  
**Progresso:** Endpoint `GET /api/parking/slots/:slotId/history` implementado, fornecendo trilha temporal de eventos por vaga e base para indicadores e futuros modelos (ex.: SageMaker).

---

## 7. Observabilidade e preparação para migração (AWS)

O relatório falava em Amazon IoT Core e evolução, sem descrever métricas ou passos concretos.  
**Progresso:** Logs estruturados e métricas básicas do consumidor MQTT (mensagens recebidas, erros de parse, reconexões) a cada 30s; configuração do broker por variáveis de ambiente e documentação do roadmap de migração para AWS IoT Core no README e no `backend/README.md`.

---

## 8. Alinhamento entre relatório e repositório

O diagnóstico indicava que o que estava no relatório (backend NestJS, PostgreSQL, arquitetura unificada) não tinha correspondência no código.  
**Progresso:** Arquitetura descrita no relatório de novembro passou a ter implementação rastreável no repositório (backend, banco, contrato MQTT, dashboard via API), reduzindo a lacuna documento–código.

---

## Sugestão de redação para o novo relatório (Resultados / Avanços no período)

- **Infraestrutura de software:** Implementação do backend NestJS com ingestão MQTT, persistência em PostgreSQL e API REST (estado atual das vagas e histórico por vaga), com atualizações em tempo real via Server-Sent Events (SSE).
- **Protocolo e integração:** Definição e documentação de um contrato MQTT único (`docs/mqtt-contract.md`) e alinhamento do firmware ESP32 a esse contrato, garantindo interoperabilidade entre dispositivo, broker e backend.
- **Ambiente de validação:** Orquestração da stack (broker Mosquitto, PostgreSQL, backend e frontend) em Docker Compose, permitindo validação ponta a ponta e reprodutibilidade.
- **Observabilidade e evolução:** Registro de métricas do consumidor MQTT e documentação do roadmap para migração futura ao AWS IoT Core, mantendo o frontend inalterado.