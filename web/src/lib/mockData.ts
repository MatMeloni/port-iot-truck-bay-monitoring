/**
 * Mock data generator — Porto de Santos, Fev–Abr 2026
 * Simula fluxo realista de caminhões com padrões diurnos/sazonais/semanais
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type BayId = string;

export type HourlySnapshot = {
  hour: number;          // 0-23
  occupancy: number;     // 0-1 (taxa de ocupação)
  trucks: number;        // caminhões processados naquela hora
  avgWaitMin: number;    // tempo médio de espera (minutos)
};

export type DailyRecord = {
  date: string;          // "YYYY-MM-DD"
  dayOfWeek: number;     // 0=Dom, 6=Sáb
  totalTrucks: number;
  avgOccupancy: number;  // 0-1
  peakHour: number;      // 0-23
  peakOccupancy: number; // 0-1
  avgWaitMin: number;
  hourly: HourlySnapshot[];
  isHoliday: boolean;
  event?: string;        // ex: "Carnaval", "Safra Soja", etc.
};

export type BayRecord = {
  bayId: BayId;
  terminal: "A" | "B" | "C";
  type: "Container" | "Graneis" | "Carga Geral";
  totalOps30d: number;
  avgOccupancy30d: number;
  avgWaitMin: number;
  alertCount: number;
  isOnline: boolean;
};

export type MLPattern = {
  id: string;
  name: string;
  confidence: number;      // 0-1
  description: string;
  detectedAt: string;      // data ISO
  impact: "low" | "medium" | "high";
  recommendation: string;
};

export type PortStats = {
  avgDailyTrucks: number;
  peakDayTrucks: number;
  avgOccupancyRate: number;
  avgWaitMin: number;
  totalTrucks90d: number;
  onlineBays: number;
  totalBays: number;
};

// ─── Constantes de configuração ─────────────────────────────────────────────

const BAYS: BayRecord[] = [
  // Terminal A — Containers
  { bayId: "A1", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "A2", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "A3", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "A4", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 1, isOnline: true },
  { bayId: "A5", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: false },
  { bayId: "A6", terminal: "A", type: "Container",    totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  // Terminal B — Graneis
  { bayId: "B1", terminal: "B", type: "Graneis",      totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 2, isOnline: true },
  { bayId: "B2", terminal: "B", type: "Graneis",      totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "B3", terminal: "B", type: "Graneis",      totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "B4", terminal: "B", type: "Graneis",      totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 1, isOnline: true },
  { bayId: "B5", terminal: "B", type: "Graneis",      totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: false },
  // Terminal C — Carga Geral
  { bayId: "C1", terminal: "C", type: "Carga Geral",  totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "C2", terminal: "C", type: "Carga Geral",  totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
  { bayId: "C3", terminal: "C", type: "Carga Geral",  totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 3, isOnline: true },
  { bayId: "C4", terminal: "C", type: "Carga Geral",  totalOps30d: 0, avgOccupancy30d: 0, avgWaitMin: 0, alertCount: 0, isOnline: true },
];

// Feriados e eventos especiais no período Fev-Abr 2026
const SPECIAL_DAYS: Record<string, { isHoliday: boolean; event?: string; factor: number }> = {
  "2026-02-16": { isHoliday: true,  event: "Carnaval",          factor: 0.25 },
  "2026-02-17": { isHoliday: true,  event: "Carnaval",          factor: 0.20 },
  "2026-02-18": { isHoliday: true,  event: "Carnaval",          factor: 0.18 },
  "2026-02-19": { isHoliday: true,  event: "Carnaval",          factor: 0.22 },
  "2026-02-20": { isHoliday: false, event: "Pós-Carnaval",       factor: 0.55 },
  "2026-03-01": { isHoliday: false, event: "Pico Safra Soja",    factor: 1.30 },
  "2026-03-10": { isHoliday: false, event: "Pico Safra Soja",    factor: 1.35 },
  "2026-03-15": { isHoliday: false, event: "Pico Safra Soja",    factor: 1.40 },
  "2026-03-25": { isHoliday: false, event: "Pico Safra Soja",    factor: 1.45 },
  "2026-04-02": { isHoliday: true,  event: "Quinta-feira Santa", factor: 0.45 },
  "2026-04-03": { isHoliday: true,  event: "Sexta-feira Santa",  factor: 0.30 },
  "2026-04-05": { isHoliday: true,  event: "Páscoa",             factor: 0.25 },
  "2026-04-21": { isHoliday: true,  event: "Tiradentes",         factor: 0.40 },
};

// ─── Semente pseudo-aleatória determinística ────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Perfil horário base (0-23h) ─────────────────────────────────────────

// Fator de atividade por hora — Porto de Santos (operação 24h)
const BASE_HOURLY_PROFILE = [
  0.12, 0.08, 0.06, 0.05, 0.07, 0.15, // 0-5h  (madrugada/amanhecer)
  0.35, 0.62, 0.82, 0.90, 0.92, 0.88, // 6-11h (manhã - pico 1)
  0.80, 0.85, 0.90, 0.88, 0.84, 0.78, // 12-17h (tarde - pico 2)
  0.65, 0.55, 0.42, 0.32, 0.22, 0.15, // 18-23h (noite)
];

// ─── Gerador principal ───────────────────────────────────────────────────────

function generateDailyRecord(
  dateStr: string,
  rng: () => number,
): DailyRecord {
  const date = new Date(dateStr + "T00:00:00Z");
  const dayOfWeek = date.getUTCDay(); // 0=Dom, 6=Sáb

  // Fator base por dia da semana
  const weekFactor = [0.45, 1.0, 1.05, 1.0, 1.02, 0.88, 0.50][dayOfWeek] ?? 1;

  // Fator sazonal — março/abril são meses de pico para soja/milho em Santos
  const month = date.getUTCMonth() + 1; // 1-12
  const seasonFactor = month === 3 ? 1.20 : month === 4 ? 1.25 : 1.0;

  // Fator especial
  const special = SPECIAL_DAYS[dateStr];
  const specialFactor = special?.factor ?? 1.0;
  const isHoliday = special?.isHoliday ?? false;
  const event = special?.event;

  // Ruído diário
  const dailyNoise = 0.92 + rng() * 0.16;

  const effectiveFactor = weekFactor * seasonFactor * specialFactor * dailyNoise;

  // Base: ~950 caminhões/dia em dia útil normal
  const baseDailyTrucks = 950;

  const hourly: HourlySnapshot[] = BASE_HOURLY_PROFILE.map((profile, hour) => {
    const hourNoise = 0.88 + rng() * 0.24;
    const hourFactor = profile * effectiveFactor * hourNoise;
    const trucks = Math.round(baseDailyTrucks * hourFactor / 14); // distribui pelo dia
    const occupancy = Math.min(0.98, Math.max(0.02, profile * effectiveFactor * (0.85 + rng() * 0.3)));
    const avgWaitMin = Math.max(3, Math.round((occupancy * 45) + rng() * 8));
    return { hour, occupancy, trucks, avgWaitMin };
  });

  const totalTrucks = hourly.reduce((s, h) => s + h.trucks, 0);
  const avgOccupancy = hourly.reduce((s, h) => s + h.occupancy, 0) / 24;
  const peakHourRecord = hourly.reduce((max, h) => h.occupancy > max.occupancy ? h : max, hourly[0]!);
  const avgWaitMin = Math.round(hourly.reduce((s, h) => s + h.avgWaitMin, 0) / 24);

  return {
    date: dateStr,
    dayOfWeek,
    totalTrucks,
    avgOccupancy,
    peakHour: peakHourRecord.hour,
    peakOccupancy: peakHourRecord.occupancy,
    avgWaitMin,
    hourly,
    isHoliday,
    event,
  };
}

// ─── Geração dos 90 dias ─────────────────────────────────────────────────────

function generatePortHistory(): DailyRecord[] {
  const rng = seededRandom(42);
  const records: DailyRecord[] = [];

  // Gera Feb 1 → Abr 30, 2026
  const start = new Date("2026-02-01T00:00:00Z");
  for (let i = 0; i < 89; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const dateStr = d.toISOString().slice(0, 10);
    records.push(generateDailyRecord(dateStr, rng));
  }
  return records;
}

// ─── Dados das vagas ──────────────────────────────────────────────────────────

function enrichBays(history: DailyRecord[]): BayRecord[] {
  const rng = seededRandom(99);
  const last30 = history.slice(-30);

  return BAYS.map((bay) => {
    // Cada vaga tem perfil ligeiramente diferente
    const bayFactor = 0.7 + rng() * 0.6;
    const avgOcc = last30.reduce((s, d) => s + d.avgOccupancy, 0) / last30.length * bayFactor;
    const ops = Math.round(last30.reduce((s, d) => s + d.totalTrucks, 0) / BAYS.length * bayFactor);
    const wait = Math.round(15 + rng() * 25);
    return {
      ...bay,
      totalOps30d: ops,
      avgOccupancy30d: Math.min(0.98, avgOcc),
      avgWaitMin: wait,
    };
  });
}

// ─── Padrões ML detectados ───────────────────────────────────────────────────

const ML_PATTERNS: MLPattern[] = [
  {
    id: "p1",
    name: "Congestionamento Matinal",
    confidence: 0.91,
    description: "Entre 7h-9h, vagas do Terminal B atingem >85% de ocupação por ≥4 dias/semana. Correlação com chegada de navios graneleiros.",
    detectedAt: "2026-04-18",
    impact: "high",
    recommendation: "Antecipar agendamentos para 5h30–6h30 nos terminais A e C.",
  },
  {
    id: "p2",
    name: "Sazonalidade Safra Soja",
    confidence: 0.97,
    description: "Fluxo 38% acima da média em março. Padrão recorrente nos últimos 3 anos: pico entre 15/Mar–10/Abr.",
    detectedAt: "2026-03-20",
    impact: "high",
    recommendation: "Ativar vagas de contingência C3 e C4 no período 15/Mar–10/Abr.",
  },
  {
    id: "p3",
    name: "Anomalia C3 — Tempo de Espera",
    confidence: 0.83,
    description: "Vaga C3 apresenta tempo de espera 2,4× acima da média do Terminal C nos últimos 12 dias.",
    detectedAt: "2026-04-25",
    impact: "medium",
    recommendation: "Inspecionar sensor de presença e lógica de liberação de vaga.",
  },
  {
    id: "p4",
    name: "Baixo Fluxo Noturno",
    confidence: 0.88,
    description: "Ocupação média entre 1h–5h cai abaixo de 8% — vagas disponíveis para manutenção preventiva.",
    detectedAt: "2026-04-10",
    impact: "low",
    recommendation: "Programar manutenção dos sensores ESP32 entre 2h–4h.",
  },
  {
    id: "p5",
    name: "Elasticidade Fim de Semana",
    confidence: 0.79,
    description: "Sábado tem fluxo ~52% do dia útil. Domingo cai para ~45%. Oportunidade para redistribuição de equipe.",
    detectedAt: "2026-03-15",
    impact: "medium",
    recommendation: "Reduzir operadores em 35% nos fins de semana, realocando para segunda-feira.",
  },
];

// ─── Export público ───────────────────────────────────────────────────────────

let _cachedHistory: DailyRecord[] | null = null;
let _cachedBays: BayRecord[] | null = null;

export function getPortHistory(): DailyRecord[] {
  if (!_cachedHistory) _cachedHistory = generatePortHistory();
  return _cachedHistory;
}

export function getEnrichedBays(): BayRecord[] {
  if (!_cachedBays) _cachedBays = enrichBays(getPortHistory());
  return _cachedBays;
}

export function getMlPatterns(): MLPattern[] {
  return ML_PATTERNS;
}

export function getPortStats(): PortStats {
  const history = getPortHistory();
  const bays = getEnrichedBays();
  const totalTrucks90d = history.reduce((s, d) => s + d.totalTrucks, 0);
  const avgDailyTrucks = Math.round(totalTrucks90d / history.length);
  const peakDayTrucks = Math.max(...history.map((d) => d.totalTrucks));
  const avgOccupancyRate = history.reduce((s, d) => s + d.avgOccupancy, 0) / history.length;
  const avgWaitMin = Math.round(history.reduce((s, d) => s + d.avgWaitMin, 0) / history.length);
  const onlineBays = bays.filter((b) => b.isOnline).length;

  return {
    avgDailyTrucks,
    peakDayTrucks,
    avgOccupancyRate,
    avgWaitMin,
    totalTrucks90d,
    onlineBays,
    totalBays: bays.length,
  };
}

/** Retorna o perfil horário médio (0-23h) dos últimos 30 dias */
export function getAvgHourlyProfile(): HourlySnapshot[] {
  const last30 = getPortHistory().slice(-30);
  return Array.from({ length: 24 }, (_, hour) => {
    const avgOcc = last30.reduce((s, d) => s + (d.hourly[hour]?.occupancy ?? 0), 0) / last30.length;
    const avgTrucks = Math.round(last30.reduce((s, d) => s + (d.hourly[hour]?.trucks ?? 0), 0) / last30.length);
    const avgWait = Math.round(last30.reduce((s, d) => s + (d.hourly[hour]?.avgWaitMin ?? 0), 0) / last30.length);
    return { hour, occupancy: avgOcc, trucks: avgTrucks, avgWaitMin: avgWait };
  });
}

/** Heatmap: occupancy média por [diaSemana][hora] */
export function getWeeklyHeatmap(): number[][] {
  const history = getPortHistory();
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const count: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  for (const day of history) {
    for (const snap of day.hourly) {
      grid[day.dayOfWeek]![snap.hour]! += snap.occupancy;
      count[day.dayOfWeek]![snap.hour]! += 1;
    }
  }

  return grid.map((row, dow) =>
    row.map((sum, h) => (count[dow]![h]! > 0 ? sum / count[dow]![h]! : 0)),
  );
}
