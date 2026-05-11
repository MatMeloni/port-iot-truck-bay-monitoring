"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Container,
  Gauge,
  Truck,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

import { BarChart } from "@/components/charts/BarChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { LineChart } from "@/components/charts/LineChart";
import {
  getAvgHourlyProfile,
  getEnrichedBays,
  getMlPatterns,
  getPortHistory,
  getPortStats,
  getWeeklyHeatmap,
  type BayRecord,
  type DailyRecord,
  type MLPattern,
} from "@/lib/mockData";

// ─── Utilitários ─────────────────────────────────────────────────────────────

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}
function fmtNum(v: number) {
  return v.toLocaleString("pt-BR");
}
function fmtMin(v: number) {
  if (v < 60) return `${v} min`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

type KpiProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: { pct: number; label: string };
};

function KpiCard({ label, value, sub, icon, accent, trend }: KpiProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl border ${accent}`}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.pct >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {trend.pct >= 0 ? "+" : ""}
            {trend.pct.toFixed(1)}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─── Occupation gauge (SVG) ─────────────────────────────────────────────────

function OccupancyGauge({ value }: { value: number }) {
  const R = 52;
  const CX = 64;
  const CY = 64;
  const ARC = 200; // graus totais
  const startAngle = -110;
  const endAngle = startAngle + ARC * value;

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function describeArc(start: number, end: number, r: number) {
    const s = polarToXY(start, r);
    const e = polarToXY(end, r);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const color = value < 0.5 ? "#10b981" : value < 0.8 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox="0 0 128 80" className="w-full max-w-[160px]">
      <path
        d={describeArc(startAngle, startAngle + ARC, R)}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d={describeArc(startAngle, endAngle, R)}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <text x={CX} y={CY + 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#0f172a">
        {(value * 100).toFixed(0)}%
      </text>
      <text x={CX} y={CY + 20} textAnchor="middle" fontSize={9} fill="#94a3b8">
        ocupação atual
      </text>
    </svg>
  );
}

// ─── Bay status row ───────────────────────────────────────────────────────────

function BayRow({ bay }: { bay: BayRecord }) {
  const pct = bay.avgOccupancy30d;
  const barColor = pct > 0.8 ? "#ef4444" : pct > 0.6 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="w-8 text-xs font-mono font-semibold text-slate-700">{bay.bayId}</div>
      <div className="w-20 text-xs text-slate-500">{bay.type}</div>

      {/* Barra de ocupação */}
      <div className="flex-1 min-w-0">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${pct * 100}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="w-10 text-right text-xs font-medium" style={{ color: barColor }}>
        {(pct * 100).toFixed(0)}%
      </div>

      <div className="w-14 text-right text-xs text-slate-400">{bay.avgWaitMin} min</div>

      {/* Alertas */}
      {bay.alertCount > 0 ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
          {bay.alertCount}
        </span>
      ) : (
        <span className="size-5" />
      )}

      {/* Online */}
      {bay.isOnline ? (
        <Wifi className="size-3.5 text-emerald-500" />
      ) : (
        <WifiOff className="size-3.5 text-rose-400" />
      )}
    </div>
  );
}

// ─── ML Pattern card ─────────────────────────────────────────────────────────

function PatternCard({ p }: { p: MLPattern }) {
  const impactStyle = {
    high: "border-rose-200 bg-rose-50 text-rose-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-sky-200 bg-sky-50 text-sky-700",
  }[p.impact];
  const impactLabel = { high: "Alto impacto", medium: "Médio impacto", low: "Baixo impacto" }[p.impact];

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-violet-500 shrink-0" />
          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${impactStyle}`}>
          {impactLabel}
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-24 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-violet-500"
              style={{ width: `${p.confidence * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400">{(p.confidence * 100).toFixed(0)}% conf.</span>
        </div>
        <p className="text-[10px] text-slate-400">Detectado: {p.detectedAt}</p>
      </div>
      <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
        <span className="font-semibold">→ </span>{p.recommendation}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";
const PERIOD_LABELS: Record<Period, string> = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias" };

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTerminal, setActiveTerminal] = useState<"all" | "A" | "B" | "C">("all");

  const history = useMemo(() => getPortHistory(), []);
  const stats = useMemo(() => getPortStats(), []);
  const bays = useMemo(() => getEnrichedBays(), []);
  const mlPatterns = useMemo(() => getMlPatterns(), []);
  const hourlyProfile = useMemo(() => getAvgHourlyProfile(), []);
  const heatmap = useMemo(() => getWeeklyHeatmap(), []);

  // Filtrar histórico pelo período
  const filteredHistory = useMemo<DailyRecord[]>(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    return history.slice(-days);
  }, [history, period]);

  // Dados para o line chart
  const flowChartData = useMemo(() => {
    return filteredHistory.map((d) => ({
      label: d.date.slice(5), // MM-DD
      value: d.totalTrucks,
      secondary: Math.round(d.avgOccupancy * stats.avgDailyTrucks * 1.1),
    }));
  }, [filteredHistory, stats.avgDailyTrucks]);

  const labelStep = period === "7d" ? 1 : period === "30d" ? 3 : 7;

  // Perfil horário para bar chart
  const hourlyBarData = useMemo(() => {
    return hourlyProfile.map((h) => ({
      label: `${h.hour}h`,
      value: h.trucks,
      color: h.occupancy > 0.8 ? "#ef4444" : h.occupancy > 0.6 ? "#f59e0b" : "#0ea5e9",
    }));
  }, [hourlyProfile]);

  // Vagas filtradas por terminal
  const filteredBays = useMemo(
    () => activeTerminal === "all" ? bays : bays.filter((b) => b.terminal === activeTerminal),
    [bays, activeTerminal],
  );

  // Ocupação atual (última hora útil simulada)
  const currentOccupancy = useMemo(() => {
    const last = history[history.length - 1];
    return last?.hourly[9]?.occupancy ?? 0.62; // 9h = horário de pico
  }, [history]);

  // Contagem de alertas totais
  const totalAlerts = useMemo(() => bays.reduce((s, b) => s + b.alertCount, 0), [bays]);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-6 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Dados simulados — Fev–Abr 2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Analítico</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Porto de Santos · Terminal de Caminhões · Monitoramento IoT
          </p>
        </div>

        {/* Period selector */}
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Caminhões/dia (média)"
          value={fmtNum(stats.avgDailyTrucks)}
          sub="últimos 90 dias"
          icon={<Truck className="size-5 text-sky-600" />}
          accent="bg-sky-50 border-sky-200"
          trend={{ pct: 12.3, label: "vs. trimestre ant." }}
        />
        <KpiCard
          label="Pico registrado"
          value={fmtNum(stats.peakDayTrucks)}
          sub="caminhões em 1 dia"
          icon={<Zap className="size-5 text-amber-500" />}
          accent="bg-amber-50 border-amber-200"
        />
        <KpiCard
          label="Ocupação média"
          value={fmtPct(stats.avgOccupancyRate)}
          sub="todas as vagas"
          icon={<Gauge className="size-5 text-violet-500" />}
          accent="bg-violet-50 border-violet-200"
          trend={{ pct: 4.7, label: "vs. período ant." }}
        />
        <KpiCard
          label="Espera média"
          value={fmtMin(stats.avgWaitMin)}
          sub="por caminhão"
          icon={<Clock className="size-5 text-rose-500" />}
          accent="bg-rose-50 border-rose-200"
          trend={{ pct: -8.2, label: "vs. período ant." }}
        />
        <KpiCard
          label="Vagas online"
          value={`${stats.onlineBays} / ${stats.totalBays}`}
          sub="sensores ativos"
          icon={<Activity className="size-5 text-emerald-600" />}
          accent="bg-emerald-50 border-emerald-200"
        />
        <KpiCard
          label="Alertas ativos"
          value={String(totalAlerts)}
          sub="vagas com anomalia"
          icon={<AlertTriangle className="size-5 text-orange-500" />}
          accent="bg-orange-50 border-orange-200"
        />
      </div>

      {/* Flow + Gauge row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section
            title="Fluxo de Caminhões"
            subtitle={`Evolução diária dos últimos ${PERIOD_LABELS[period]}`}
            action={
              <span className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="block h-0.5 w-6 rounded bg-sky-500" />
                  Caminhões
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="block h-0.5 w-6 rounded bg-emerald-500 border-dashed" style={{ borderTop: "2px dashed #10b981", background: "none" }} />
                  Tendência
                </span>
              </span>
            }
          >
            {flowChartData.length > 0 ? (
              <LineChart
                data={flowChartData}
                height={200}
                color="#0ea5e9"
                secondaryColor="#10b981"
                showArea
                labelStep={labelStep}
                formatValue={(v) => fmtNum(Math.round(v))}
                formatLabel={(l, i) => {
                  if (i % labelStep !== 0) return "";
                  return l;
                }}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sem dados para o período selecionado
              </div>
            )}

            {/* Destacar eventos especiais */}
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredHistory
                .filter((d) => d.event)
                .slice(0, 4)
                .map((d) => (
                  <span
                    key={d.date}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${
                      d.isHoliday
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-sky-200 bg-sky-50 text-sky-700"
                    }`}
                  >
                    {d.date.slice(5)} · {d.event}
                  </span>
                ))}
            </div>
          </Section>
        </div>

        <Section title="Ocupação Atual" subtitle="Estimativa horária simulada">
          <div className="flex flex-col items-center gap-4">
            <OccupancyGauge value={currentOccupancy} />
            <div className="w-full space-y-2">
              {(["Terminal A", "Terminal B", "Terminal C"] as const).map((t, i) => {
                const pct = [0.72, 0.61, 0.55][i] ?? 0.6;
                const color = pct > 0.7 ? "#ef4444" : pct > 0.55 ? "#f59e0b" : "#10b981";
                return (
                  <div key={t} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-xs text-slate-500">{t}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct * 100}%`, background: color }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold" style={{ color }}>
                      {(pct * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="w-full rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Total processado (90 dias)</p>
              <p className="text-2xl font-bold text-slate-900">{fmtNum(stats.totalTrucks90d)}</p>
              <p className="text-xs text-slate-400">caminhões</p>
            </div>
          </div>
        </Section>
      </div>

      {/* Heatmap + Hourly bar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Mapa de Calor Semanal"
          subtitle="Ocupação média por dia da semana e hora — últimos 90 dias"
        >
          <HeatmapChart data={heatmap} colorFrom="#dbeafe" colorTo="#1e40af" />
        </Section>

        <Section
          title="Perfil Horário Médio"
          subtitle="Caminhões processados por hora · média 30 dias"
        >
          <BarChart
            data={hourlyBarData}
            height={220}
            formatValue={(v) => String(v)}
            showValues={false}
          />
          <p className="mt-2 text-xs text-slate-400">
            Pico: <span className="font-semibold text-slate-600">9h–11h</span> e{" "}
            <span className="font-semibold text-slate-600">14h–16h</span>. Mínimo: madrugada (1h–5h).
          </p>
        </Section>
      </div>

      {/* Bay management */}
      <Section
        title="Gestão de Vagas por Terminal"
        subtitle="Ocupação, tempo de espera e status dos sensores IoT"
        action={
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs">
            {(["all", "A", "B", "C"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTerminal(t)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  activeTerminal === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t === "all" ? "Todos" : `Terminal ${t}`}
              </button>
            ))}
          </div>
        }
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <div className="w-8">Bay</div>
          <div className="w-20">Tipo</div>
          <div className="flex-1">Ocupação 30d</div>
          <div className="w-10 text-right">Ocup%</div>
          <div className="w-14 text-right">Espera</div>
          <div className="w-5">Alt</div>
          <div className="w-3.5">Wifi</div>
        </div>
        <div>
          {filteredBays.map((bay) => (
            <BayRow key={bay.bayId} bay={bay} />
          ))}
        </div>

        {/* Summary chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700 font-medium">
            ✓ {bays.filter((b) => b.isOnline).length} vagas online
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs text-rose-600 font-medium">
            ✗ {bays.filter((b) => !b.isOnline).length} vagas offline
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700 font-medium">
            ⚠ {totalAlerts} alertas em {bays.filter((b) => b.alertCount > 0).length} vagas
          </span>
        </div>
      </Section>

      {/* ML Patterns */}
      <Section
        title="Padrões Detectados por Machine Learning"
        subtitle="Modelos treinados sobre 90 dias de telemetria IoT dos sensores ESP32"
        action={
          <span className="flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700">
            <Brain className="size-3.5" />
            {mlPatterns.length} padrões ativos
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mlPatterns.map((p) => (
            <PatternCard key={p.id} p={p} />
          ))}
        </div>
      </Section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pb-4">
        Porto de Santos · Sistema IoT de Monitoramento de Vagas ·{" "}
        <span className="font-medium text-slate-500">Dados simulados — Fev–Abr 2026</span>
      </footer>
    </main>
  );
}
