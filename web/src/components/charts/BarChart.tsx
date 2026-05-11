"use client";

import { useMemo, useState } from "react";

type BarData = {
  label: string;
  value: number;
  color?: string;
};

type BarChartProps = {
  data: BarData[];
  height?: number;
  defaultColor?: string;
  formatValue?: (v: number) => string;
  horizontal?: boolean;
  showValues?: boolean;
};

export function BarChart({
  data,
  height = 200,
  defaultColor = "#0ea5e9",
  formatValue = (v) => String(Math.round(v)),
  horizontal = false,
  showValues = false,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const PAD = { top: 16, right: 12, bottom: horizontal ? 12 : 36, left: horizontal ? 72 : 40 };
  const W = 800;
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxV = useMemo(() => Math.max(...data.map((d) => d.value)) * 1.1 || 1, [data]);
  const barCount = data.length;
  const gap = 4;

  if (horizontal) {
    const barH = (innerH - gap * (barCount - 1)) / barCount;
    return (
      <div className="relative w-full" style={{ height: `${H}px` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {data.map((d, i) => {
            const barW = (d.value / maxV) * innerW;
            const y = PAD.top + i * (barH + gap);
            const color = d.color ?? defaultColor;
            const isHov = hovered === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={PAD.left}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={color}
                  opacity={isHov ? 1 : 0.82}
                />
                <text
                  x={PAD.left - 6}
                  y={y + barH / 2 + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="#64748b"
                >
                  {d.label}
                </text>
                {showValues && (
                  <text
                    x={PAD.left + barW + 6}
                    y={y + barH / 2 + 4}
                    fontSize={10}
                    fill={color}
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical
  const barW = (innerW - gap * (barCount - 1)) / barCount;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full" style={{ height: `${H}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {/* Grid */}
        {gridLines.map((f, i) => {
          const y = PAD.top + innerH * (1 - f);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.8} strokeDasharray="4 3" />
              {f > 0 && (
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
                  {formatValue(maxV * f / 1.1)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const bH = (d.value / maxV) * innerH;
          const x = PAD.left + i * (barW + gap);
          const y = PAD.top + innerH - bH;
          const color = d.color ?? defaultColor;
          const isHov = hovered === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={bH}
                rx={3}
                fill={color}
                opacity={isHov ? 1 : 0.82}
              />
              <text
                x={x + barW / 2}
                y={PAD.top + innerH + 16}
                textAnchor="middle"
                fontSize={9}
                fill="#94a3b8"
              >
                {d.label}
              </text>
              {(showValues || isHov) && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={color}
                  fontWeight="600"
                >
                  {formatValue(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
