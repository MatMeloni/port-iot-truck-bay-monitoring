"use client";

import { useMemo, useState } from "react";

export type LineDataPoint = {
  label: string;
  value: number;
  secondary?: number;
};

type LineChartProps = {
  data: LineDataPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showArea?: boolean;
  showGrid?: boolean;
  formatValue?: (v: number) => string;
  formatLabel?: (label: string, index: number) => string;
  yMin?: number;
  yMax?: number;
  labelStep?: number;
};

const W = 800;
const PAD = { top: 16, right: 16, bottom: 30, left: 48 };

export function LineChart({
  data,
  height = 180,
  color = "#0ea5e9",
  secondaryColor = "#10b981",
  showArea = true,
  showGrid = true,
  formatValue = (v) => String(Math.round(v)),
  formatLabel = (l) => l,
  yMin,
  yMax,
  labelStep = 1,
}: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const { minV, maxV, toX, toY } = useMemo(() => {
    const allVals = data.flatMap((d) =>
      d.secondary !== undefined ? [d.value, d.secondary] : [d.value]
    );
    const minV = yMin ?? Math.min(...allVals) * 0.95;
    const maxV = yMax ?? Math.max(...allVals) * 1.05;
    const range = maxV - minV || 1;
    const toX = (i: number) =>
      PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const toY = (v: number) =>
      PAD.top + innerH - ((v - minV) / range) * innerH;
    return { minV, maxV, toX, toY };
  }, [data, yMin, yMax, innerW, innerH]);

  const mainPts = useMemo(
    () => data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" "),
    [data, toX, toY],
  );

  const secPts = useMemo(
    () =>
      data[0]?.secondary !== undefined
        ? data.map((d, i) => `${toX(i)},${toY(d.secondary!)}`).join(" ")
        : null,
    [data, toX, toY],
  );

  const areaPath = useMemo(() => {
    const pts = mainPts.split(" ").join(" L ");
    return `M ${PAD.left},${PAD.top + innerH} L ${pts} L ${PAD.left + innerW},${PAD.top + innerH} Z`;
  }, [mainPts, innerH, innerW]);

  const gridLines = useMemo(
    () =>
      [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD.top + innerH * (1 - f),
        label: formatValue(minV + (maxV - minV) * f),
      })),
    [innerH, minV, maxV, formatValue],
  );

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;
  const gradId = `area-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {showArea && (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
        )}

        {/* Grid lines + Y labels */}
        {showGrid &&
          gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={g.y}
                y2={g.y}
                stroke="#e2e8f0"
                strokeWidth={0.8}
                strokeDasharray="4 3"
              />
              <text x={PAD.left - 6} y={g.y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
                {g.label}
              </text>
            </g>
          ))}

        {/* X labels */}
        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text
              key={i}
              x={toX(i)}
              y={PAD.top + innerH + 18}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {formatLabel(d.label, i)}
            </text>
          ) : null,
        )}

        {/* Area fill */}
        {showArea && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Secondary dashed line */}
        {secPts && (
          <polyline
            points={secPts}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={1.6}
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        )}

        {/* Main line */}
        <polyline
          points={mainPts}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Invisible hover zones */}
        {data.map((_, i) => {
          const zoneW = innerW / Math.max(data.length - 1, 1);
          return (
            <rect
              key={i}
              x={toX(i) - zoneW / 2}
              y={PAD.top}
              width={zoneW}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          );
        })}

        {/* Crosshair + dot on hover */}
        {hoveredIdx !== null && activePoint && (
          <>
            <line
              x1={toX(hoveredIdx)}
              x2={toX(hoveredIdx)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 2"
              opacity={0.4}
            />
            <circle
              cx={toX(hoveredIdx)}
              cy={toY(activePoint.value)}
              r={4}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && activePoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs"
          style={{
            left: `${(toX(hoveredIdx) / W) * 100}%`,
            top: `${(toY(activePoint.value) / height) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <p className="font-semibold text-slate-700">{activePoint.label}</p>
          <p style={{ color }}>{formatValue(activePoint.value)}</p>
          {activePoint.secondary !== undefined && (
            <p style={{ color: secondaryColor }}>
              {formatValue(activePoint.secondary)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
