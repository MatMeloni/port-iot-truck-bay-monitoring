"use client";

import { useState } from "react";

type HeatmapChartProps = {
  /** grid[diaSemana 0-6][hora 0-23] = valor 0-1 */
  data: number[][];
  colorFrom?: string;
  colorTo?: string;
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_LABELS = ["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function interpolateColor(from: string, to: string, t: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return `rgb(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))})`;
}

export function HeatmapChart({
  data,
  colorFrom = "#dbeafe",
  colorTo = "#1d4ed8",
}: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{
    dow: number;
    hour: number;
    value: number;
  } | null>(null);

  const rows = data.length;    // 7 (dias da semana)
  const cols = data[0]?.length ?? 24;

  const CELL_H = 28;
  const CELL_W = 100 / cols;

  return (
    <div className="relative w-full select-none">
      <div className="flex gap-1.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5" style={{ width: 32, flexShrink: 0 }}>
          <div style={{ height: 16 }} /> {/* spacer for hour labels */}
          {DAY_LABELS.map((label, dow) => (
            <div
              key={dow}
              className="flex items-center justify-end pr-1 text-[10px] font-medium text-slate-400"
              style={{ height: CELL_H }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Hour labels */}
          <div className="flex mb-0.5" style={{ height: 16 }}>
            {Array.from({ length: cols }, (_, h) => (
              <div
                key={h}
                className="text-[9px] text-slate-400 text-center"
                style={{ width: `${CELL_W}%` }}
              >
                {h % 3 === 0 ? `${h}h` : ""}
              </div>
            ))}
          </div>

          {/* Cells */}
          {data.map((row, dow) => (
            <div key={dow} className="flex gap-0.5 mb-0.5">
              {row.map((value, h) => {
                const color = interpolateColor(colorFrom, colorTo, Math.min(1, value));
                const isActive = tooltip?.dow === dow && tooltip?.hour === h;
                return (
                  <div
                    key={h}
                    className="rounded-sm transition-transform duration-75 cursor-default"
                    style={{
                      width: `${CELL_W}%`,
                      height: CELL_H,
                      background: color,
                      transform: isActive ? "scale(1.15)" : undefined,
                      zIndex: isActive ? 10 : undefined,
                      position: isActive ? "relative" : undefined,
                      outline: isActive ? "2px solid #0ea5e9" : undefined,
                    }}
                    onMouseEnter={() => setTooltip({ dow, hour: h, value })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-lg text-xs whitespace-nowrap pointer-events-none z-20">
          <span className="font-semibold text-slate-700">
            {DAY_LABELS[tooltip.dow]} {tooltip.hour}h
          </span>
          <span className="ml-2 text-slate-500">
            Ocupação: <span className="font-bold text-sky-600">{(tooltip.value * 100).toFixed(0)}%</span>
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Baixa</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{ background: `linear-gradient(to right, ${colorFrom}, ${colorTo})` }}
        />
        <span className="text-[10px] text-slate-400">Alta</span>
      </div>
    </div>
  );
}
