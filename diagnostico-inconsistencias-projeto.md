# Diagnóstico de Inconsistências e Plano de Melhoria
## Projeto: Sistema de Controle e Monitoramento de Filas de Caminhões (IoT + MQTT)

## Escopo da análise
Foram analisados os conteúdos disponíveis nas pastas:

- `certificados/`
- `documentação/`
- `relatorios/`

Também foi realizado cruzamento com a estrutura de código atual do repositório para verificar aderência técnica entre documentação e implementação.

---

## Documentos analisados

### Certificados
- `certificados/ACFROG~1.PDF`
- `certificados/Certificado CNIT - 2024.pdf`
- `certificados/Certificado CNIT - 2025.pdf`
- `certificados/cfc92ac4-bd93-4ac6-aa2f-b2b0cdeaf8ba.pdf`

### Normas
- `documentação/Normas Relatório Trimestral CENEP 2025.pdf`

### Relatórios
- `relatorios/Banner_InovaMack.pdf`
- `relatorios/Relatorio_Trimestral - Novembro 2025 - Porto de Santos.pdf`
- `relatorios/Relatorio_Final - Agosto 2025 - Mackenzie.pdf`

### Limitação de leitura nesta sessão
- `relatorios/APRESENTAÇÃO CENEP.pptx` (formato binário não extraído nesta sessão)
- `relatorios/Relatorio_Trimestral - Junho 2025.docx` (formato binário não extraído nesta sessão)

---

## Principais inconsistências identificadas

### 1) Arquitetura declarada vs código real
Nos relatórios há menção a backend em NestJS e persistência (PostgreSQL em um documento, DynamoDB em outro).  
No repositório atual, o que se observa de forma clara é:

- frontend em Next.js (`web/`)
- firmware ESP32 (`firmware/`)
- broker Mosquitto (`broker/`)

Não foi identificada evidência concreta de um backend NestJS implementado no estado atual do código.

### 2) Divergência de tópicos MQTT
Há conflito entre padrões de tópicos documentados e utilizados no código:

- `README.md`: `parking/space/<ID>/...`
- `firmware/esp32_parking.ino`: `parking/<ID>/status`, `parking/<ID>/heartbeat`, `parking/<ID>/lwt`
- `web/src/hooks/useMqttParking.ts`: espera `parking/space/<id>/status|distance|online`

Impacto: risco de incompatibilidade entre publisher (ESP32) e subscriber (dashboard).

### 3) Segurança: documentação x execução
Relatórios descrevem uso de AWS IoT Core com certificados/TLS/policies.  
Configuração local atual do broker (`broker/mosquitto.conf`) está com:

- `allow_anonymous true`
- sem TLS habilitado

Impacto: lacuna entre o cenário acadêmico descrito e o ambiente operacional real local.

### 4) Persistência de dados sem definição única
Há alternância de narrativa entre PostgreSQL e DynamoDB sem decisão final consolidada, gerando ambiguidade para continuidade técnica e para o novo relatório.

### 5) Inconsistência temporal de eventos
Existem divergências pontuais de datas de apresentação (ex.: InovaMack), exigindo revisão final com base nos certificados anexados.

### 6) Falta de métricas quantitativas fortes
Afirmações como “baixa latência”, “estável” e “escalável” aparecem sem KPI claro (p95 de latência, taxa de perda, uptime, erro de detecção, etc.).

---

## Oportunidades de melhoria para o novo relatório

### 1) Definir uma arquitetura oficial por fase
Separar claramente:

- **Fase atual implementada**
- **Fase em desenvolvimento**
- **Fase futura (planejada)**

### 2) Padronizar contrato MQTT
Documentar formalmente:

- nome de tópicos
- formato de payload
- política de retain
- uso de heartbeat/LWT
- regras de QoS

### 3) Distinguir “implementado” de “proposto”
Evitar que funcionalidades futuras (IA, backend completo, banco definitivo) apareçam como concluídas.

### 4) Incluir seção de evidências experimentais
Adicionar tabelas com:

- latência média e p95
- disponibilidade por período
- taxa de reconexão MQTT
- acurácia de detecção por faixa de distância

### 5) Consolidar decisão de banco de dados
Escolher e justificar tecnicamente (PostgreSQL ou DynamoDB) com critérios objetivos:

- tipo de consulta
- custo
- escalabilidade
- complexidade operacional
- rastreabilidade para IA futura

### 6) Revisar consistência bibliográfica e anexos
Garantir conformidade com as normas CENEP e ABNT, além de consistência entre texto principal, referências e anexos.

---

## Plano sugerido para preparar a parte de código

### Sprint 1 — Estabilização de protocolo
- unificar tópicos MQTT entre firmware, web e documentação
- padronizar payloads e eventos
- garantir compatibilidade de subscribe/publish ponta a ponta

### Sprint 2 — Confiabilidade e segurança
- habilitar autenticação MQTT
- planejar/implantar TLS
- registrar e monitorar reconexões, offline/online e heartbeat

### Sprint 3 — Persistência e rastreabilidade
- fechar banco alvo (PostgreSQL ou DynamoDB)
- modelar esquema mínimo de telemetria e eventos
- criar base histórica para indicadores e IA

### Sprint 4 — Métricas e validação científica
- dashboard com KPIs técnicos
- protocolo de teste reproduzível
- resultados comparáveis (antes/depois)

---

## Conclusão
O projeto apresenta base técnica promissora e relevância aplicada ao cenário portuário, porém ainda com inconsistências documentais e de alinhamento entre texto e implementação.  
A principal prioridade é consolidar uma versão única de arquitetura, padronizar o contrato MQTT e sustentar os resultados com métricas objetivas. Isso aumenta a qualidade do novo relatório e reduz retrabalho na evolução do código.

---

## Próximo passo recomendado
Montar uma matriz de rastreabilidade no próprio relatório com o formato:

`Objetivo -> Implementação atual -> Evidência -> Lacuna -> Ação corretiva`

Isso facilita auditoria técnica, revisão acadêmica e priorização das próximas entregas.