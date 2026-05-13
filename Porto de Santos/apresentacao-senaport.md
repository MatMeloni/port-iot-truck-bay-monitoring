# Sistema de Controle e Monitoramento de Filas de Caminhões
## Porto de Santos

**Matheus Barbosa Meloni**
Orientador: Prof. Dr. Victor Inácio de Oliveira

Escola de Engenharia Mackenzie · MackPesquisa · CENEP · Autoridade Portuária de Santos

SENAPORT 2026

---

# O Problema: Gargalos Logísticos no Porto de Santos

O **Porto de Santos** é o maior porto da América Latina em volume de cargas movimentadas — e ainda enfrenta gargalos críticos na gestão das suas baias de carga e descarga

### O cenário atual sem monitoramento automatizado

- Caminhões formam filas extensas sem informação sobre disponibilidade de baias
- Motoristas desconhecem o horário e o local exato da descarga
- Operadores não têm visibilidade em tempo real do estado de cada baia
- Ausência de dados históricos impede análise de picos e otimização contínua

### Os prejuízos concretos

- Atrasos operacionais e perda de produtividade
- Elevado consumo de combustível com motores ociosos em fila
- Aumento de emissões de poluentes em área urbana portuária
- Impacto negativo na competitividade da cadeia de suprimentos nacional

> *"Como saber onde está exatamente o caminhão? Como direcioná-lo ao local correto?"*

---

# Contexto: O Mundo Já Respondeu com IoT

Portos de referência mundial já modernizaram suas operações com IoT

### Experiências internacionais

**Porto de Hamburgo** (Alemanha) e **Porto de Roterdã** (Holanda) demonstram como sensores conectados e análise de dados em tempo real transformam a eficiência operacional portuária

### A oportunidade para Santos

A IoT permite a **coleta em tempo real** de dados do ambiente físico via sensores conectados à internet, possibilitando decisões mais rápidas, precisas e baseadas em evidências

O Porto de Santos tem porte e relevância estratégica para **liderar a adoção dessas tecnologias** no Brasil

---

# Objetivo

Desenvolver e validar um **sistema inteligente de monitoramento de baias de caminhões** em sistemas portuários, integrando hardware IoT, nuvem e interface web — preparando o terreno para aplicação futura de inteligência artificial preditiva

### Objetivos específicos

- Detectar automaticamente a presença de caminhões nas baias com sensores ultrassônicos
- Transmitir dados em tempo real via protocolo MQTT para a nuvem (AWS IoT Core)
- Disponibilizar um dashboard web com status atualizado de cada baia
- Persistir histórico de ocupação como base para análises e modelos preditivos
- Validar a solução em ambiente simulado e em protótipo físico funcional

---

# Metodologia: Três Etapas de Desenvolvimento

O projeto foi estruturado em etapas progressivas, cada uma validando componentes específicos antes de avançar

### Etapa 1 — Prototipagem e validação física

Montagem com ESP32 + HC-SR04, validação inicial via simulador **Wokwi**, depois protótipo físico com protoboard, calibração de sensores e testes de leitura

### Etapa 2 — Integração com nuvem (AWS IoT Core)

Configuração do protocolo MQTT com certificados digitais e políticas de acesso no **Amazon IoT Core**, garantindo comunicação segura e escalável entre dispositivos e a nuvem

### Etapa 3 — Infraestrutura de software escalável

Backend **NestJS**, banco de dados **Amazon DynamoDB**, frontend **Next.js + Shadcn UI** — arquitetura modular pronta para múltiplos dispositivos e IA futura

---

# Camada de Hardware

### ESP32 + Sensor Ultrassônico HC-SR04

O **ESP32** é um microcontrolador Wi-Fi de baixo custo, ideal para aplicações IoT embarcadas em ambientes industriais

**Componentes por baia monitorada:**

| Componente | Função |
|---|---|
| ESP32 | Processamento + conectividade Wi-Fi |
| HC-SR04 | Detecção de presença por ultrassom |
| LED verde | Indicação visual: baia **livre** |
| LED vermelho | Indicação visual: baia **ocupada** |

### Validação em dois ambientes

**Wokwi** (simulador online) → validação das conexões e lógica antes do hardware físico

**Protótipo físico** com protoboard → confirmação da viabilidade técnica em ambiente real

---

# Lógica de Detecção: Estabilidade e Precisão

### Histerese: eliminando leituras instáveis

Para evitar "flapping" (mudanças rápidas e falsas de estado), o firmware usa **dois limiares distintos**:

| Transição | Limiar | Significado |
|---|---|---|
| Livre → Ocupado | distância < **20 cm** | Caminhão detectado |
| Ocupado → Livre | distância > **25 cm** | Baia liberada |

### Média de 5 amostras

Cada leitura é calculada como a média de 5 medições consecutivas, eliminando ruído do sensor

### Publicação inteligente

O status MQTT só é enviado quando o **estado muda** — economia de banda e carga no broker

> Heartbeat a cada **30 segundos** reporta distância, RSSI e uptime do dispositivo para monitoramento de saúde

---

# Protocolo MQTT e AWS IoT Core

### MQTT: padrão leve para IoT

O protocolo MQTT foi escolhido por sua **eficiência em redes com limitações de banda** — ideal para dispositivos embarcados

### Tópicos padronizados

| Tópico | Retain | Conteúdo |
|---|---|---|
| `parking/space/<id>/status` | ✅ | Estado atual (libre/ocupado) |
| `parking/space/<id>/heartbeat` | ❌ | Telemetria periódica |
| `parking/space/<id>/online` | ✅ | Disponibilidade (LWT) |

### Segurança via AWS IoT Core

- Autenticação por **certificados digitais** (mTLS)
- **Políticas de acesso** por dispositivo e tópico
- Comunicação criptografada (TLS)
- Gerenciamento centralizado de múltiplos dispositivos

> Last Will Testament (LWT): se o ESP32 cair abruptamente, o broker publica automaticamente `online: false` para a baia correspondente

---

# Backend: NestJS como Hub de Integração

### NestJS (Node.js + TypeScript)

O backend centraliza ingestão MQTT, persistência e distribuição de dados para o frontend

### Responsabilidades

- **Consumidor MQTT** — assina todos os tópicos das baias
- **Persistência** — salva cada evento no Amazon DynamoDB
- **API REST** — expõe estado atual e histórico por baia
- **Stream SSE** — atualizações em tempo real sem polling

### Endpoints

| Endpoint | Descrição |
|---|---|
| `GET /api/parking/health` | Health check |
| `GET /api/parking/slots` | Estado atual de todas as baias |
| `GET /api/parking/slots/:id/history` | Histórico por baia |
| `GET /api/parking/stream` | Stream SSE em tempo real |

### Observabilidade

Métricas a cada 30s: mensagens recebidas, erros de parse e reconexões MQTT

---

# Banco de Dados: Escolha e Justificativa

### Avaliação comparativa

| Critério | Firebase Firestore | Amazon DynamoDB |
|---|---|---|
| Integração AWS | Parcial | ✅ Nativa |
| Escalabilidade | Alta | ✅ Alta + horizontal |
| Disponibilidade | Alta | ✅ 99,999% SLA |
| Custo | Pay-as-go | ✅ Pay-as-go + Free tier |
| Ecossistema | Google | ✅ AWS (IoT Core, SageMaker) |

### Decisão: Amazon DynamoDB

Priorizado pela **integração nativa ao ecossistema AWS** — o mesmo ecossistema do IoT Core e do futuro SageMaker, formando um pipeline coeso da borda à IA

### Estrutura de dados

Cada evento (status, heartbeat, online) é persistido com `slotId`, `eventType`, `status`, timestamps e payload completo — formando a **trilha histórica** para análise futura

---

# Dashboard: Visibilidade em Tempo Real

### Next.js + Shadcn UI

Interface web moderna, responsiva e intuitiva para operadores e gestores portuários

### Arquitetura de atualização

O dashboard consome **exclusivamente o backend** (REST + SSE) — sem conexão MQTT direta no navegador

**Por que SSE em vez de MQTT no browser?**
- Credenciais e certificados ficam apenas no backend
- Um único consumidor MQTT gerencia N clientes web
- Segurança reforçada — frontend usa HTTP padrão
- Migração futura ao AWS IoT Core sem tocar o frontend

### Funcionalidades da interface

- Status em tempo real de cada baia (livre · ocupado · offline)
- Indicação de conectividade de cada dispositivo
- Histórico de eventos por baia
- Atualização automática via stream — sem refresh de página

---

# Arquitetura Completa do Sistema

### Da borda ao dashboard — fluxo de dados

```
[ESP32 + HC-SR04]  →  Wi-Fi  →  [AWS IoT Core]
        │                              │
        │ MQTT + TLS + mTLS            │ roteamento seguro
        │                              ▼
    LEDs (local)              [Backend NestJS]
                                      │
                          ┌───────────┴──────────┐
                          ▼                       ▼
                   [Amazon DynamoDB]       [Dashboard Next.js]
                    (histórico)         (REST + SSE em tempo real)
```

### Stack tecnológica completa

| Camada | Tecnologia |
|---|---|
| Dispositivo | ESP32 + HC-SR04 |
| Comunicação | MQTT sobre TLS |
| Nuvem IoT | Amazon IoT Core |
| Backend | NestJS / Node.js / TypeScript |
| Banco de dados | Amazon DynamoDB |
| Frontend | Next.js + Shadcn UI |
| Infra local | Docker Compose (Mosquitto + PostgreSQL) |

---

# Resultados Alcançados

### Validações e entregas concretas

| Entrega | Resultado |
|---|---|
| Protótipo físico funcional (ESP32 + HC-SR04) | ✅ Validado |
| Simulação no Wokwi | ✅ Validado |
| Integração com AWS IoT Core (MQTT + mTLS) | ✅ Implementado |
| Backend NestJS com API REST e SSE | ✅ Implementado |
| Persistência de histórico em DynamoDB | ✅ Implementado |
| Dashboard Next.js com tempo real | ✅ Implementado |
| Stack Docker Compose reproduzível | ✅ Implementado |
| Contrato MQTT documentado e padronizado | ✅ Documentado |
| Estudo de viabilidade de IA (SageMaker) | ✅ Realizado |

---

# Impactos da Solução

### Econômico

Redução de **custos operacionais** com atrasos e ineficiências logísticas · Aumento da competitividade de empresas que dependem de transporte rodoviário · Futura IA para redistribuição estratégica de recursos e ganhos de produtividade

### Social

Melhoria das **condições de trabalho dos motoristas** com menos tempo de espera em filas · Comunicação mais eficiente entre caminhoneiros e gestores logísticos · Redução do tráfego pesado em áreas urbanas próximas ao porto

### Ambiental

Redução das **emissões de gases poluentes** pelo menor tempo com motores ociosos em fila · Menor consumo de combustível fóssil · Alinhamento com metas de **portos mais inteligentes e verdes** e políticas públicas de eficiência energética

### Escalabilidade

A solução pode ser expandida a **centros de distribuição, terminais intermodais e estacionamentos de grande porte** — demonstrando versatilidade além do contexto portuário

---

# Trajetória Acadêmica e Científica

### O projeto foi apresentado e validado em eventos de referência

**2024**
- **CNIT 2024** — 2º Congresso Nacional Integra Portos, Santos/SP (nov. 2024)

**2025**
- **I SENAPORT** — Seminário Nacional de Pesquisa Aplicada ao Setor Portuário, Santos/SP (maio 2025)
- **InovaMack** — Evento de inovação da Universidade Presbiteriana Mackenzie
- **CNIT 2025** — 3º Congresso Nacional Integra Portos

### Vinculação institucional

Projeto desenvolvido no âmbito da **Escola de Engenharia Mackenzie** com apoio do **MackPesquisa**, em parceria com a **Fundação CENEP** e a **Autoridade Portuária de Santos**

### Relevância científica

Apresentações em eventos de nível nacional geraram feedbacks técnicos e estratégicos que contribuíram para o aprimoramento contínuo do sistema e ampliaram sua visibilidade acadêmica e institucional

---

# Próximos Passos: Rumo à IA e à Escala

### Fase 1 — Segurança e multi-dispositivo (curto prazo)

- Suporte a múltiplas baias com IDs distintos (bay-A1, bay-A2, …)
- Consolidação de autenticação mTLS em produção
- Métricas quantitativas: latência p95, taxa de detecção, uptime por baia

### Fase 2 — Inteligência Artificial (médio prazo)

Integração com **Amazon SageMaker** para:

- Análise de séries temporais de ocupação
- Previsão de picos de demanda
- Estimativa de tempo de espera
- Redistribuição inteligente de caminhões entre baias

### Fase 3 — Plataforma preditiva completa (longo prazo)

Sistema autônomo capaz de **antecipar gargalos** e apoiar decisões logísticas — posicionando o Porto de Santos como referência nacional em modernização portuária por dados

---

# Conclusão

### Sistema de Controle e Monitoramento de Filas de Caminhões com IoT

Este projeto demonstra que é possível **transformar a operação portuária** com tecnologia IoT acessível e arquitetura de nuvem moderna

**Contribuições principais:**
- Solução integrada e validada: ESP32 → MQTT → AWS IoT Core → NestJS → DynamoDB → Next.js
- Triplo impacto comprovado: econômico, social e ambiental
- Base histórica de dados preparada para IA preditiva
- Trajetória acadêmica consolidada com participações em SENAPORT, CNIT e InovaMack

**Visão de futuro:**
Transformar o sistema em uma plataforma preditiva e autônoma que antecipe períodos de maior demanda, estime tempos de espera e redistribua cargas de forma inteligente — posicionando o **Porto de Santos como referência nacional** na adoção de tecnologias emergentes para a modernização portuária

---

**Matheus Barbosa Meloni**
Orientador: Prof. Dr. Victor Inácio de Oliveira

Escola de Engenharia Mackenzie · MackPesquisa
Fundação CENEP · Autoridade Portuária de Santos

matheus.b.meloni@gmail.com

*SENAPORT 2026*
