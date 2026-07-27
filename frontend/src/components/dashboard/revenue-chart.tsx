"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DataPoint {
  month: string;
  cyanVal: number; // percentage value for cyan line (0-40)
  purpleVal: number; // percentage value for purple line (0-40)
  cyanAmount: string;
  purpleAmount: string;
}

const chartPoints: DataPoint[] = [
  { month: "Jan", cyanVal: 6, purpleVal: 8, cyanAmount: "$12,400 (6%)", purpleAmount: "$14,200 (8%)" },
  { month: "Feb", cyanVal: 14, purpleVal: 10, cyanAmount: "$24,500 (14%)", purpleAmount: "$18,900 (10%)" },
  { month: "Mar", cyanVal: 11, purpleVal: 18, cyanAmount: "$21,000 (11%)", purpleAmount: "$31,500 (18%)" },
  { month: "Apr", cyanVal: 22, purpleVal: 14, cyanAmount: "$38,500 (22%)", purpleAmount: "$25,200 (14%)" },
  { month: "May", cyanVal: 20, purpleVal: 29, cyanAmount: "$35,000 (20%)", purpleAmount: "$51,000 (29%)" },
  { month: "Jun", cyanVal: 30, purpleVal: 24, cyanAmount: "$52,500 (30%)", purpleAmount: "$42,000 (24%)" },
  { month: "Jul", cyanVal: 32, purpleVal: 39, cyanAmount: "$56,000 (32%)", purpleAmount: "$68,500 (39%)" },
];

export function RevenueChart() {
  const [activeRange] = useState("Last 6 Months");

  // SVG viewBox dimensions
  const width = 560;
  const height = 240;
  const paddingX = 45;
  const paddingYTop = 30;
  const paddingYBottom = 40;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingYTop - paddingYBottom;

  // Convert percentage value (0-40%) to SVG Y coordinate
  const getY = (val: number) => {
    const maxVal = 40;
    return height - paddingYBottom - (val / maxVal) * chartH;
  };

  // Convert index (0-6) to SVG X coordinate
  const getX = (idx: number) => {
    return paddingX + (idx / (chartPoints.length - 1)) * chartW;
  };

  // Create smooth cubic bezier path
  const createSmoothPath = (valKey: "cyanVal" | "purpleVal") => {
    const pts = chartPoints.map((p, i) => ({ x: getX(i), y: getY(p[valKey]) }));

    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
    }
    return path;
  };

  const cyanPath = createSmoothPath("cyanVal");
  const purplePath = createSmoothPath("purpleVal");

  const baselineY = height - paddingYBottom;
  const cyanArea = `${cyanPath} L ${getX(chartPoints.length - 1)},${baselineY} L ${getX(0)},${baselineY} Z`;
  const purpleArea = `${purplePath} L ${getX(chartPoints.length - 1)},${baselineY} L ${getX(0)},${baselineY} Z`;

  return (
    <div className="flex flex-col h-full justify-between space-y-2">
      
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
          Revenue Growth
        </h3>

        <div className="relative">
          <button className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors">
            <span>{activeRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full pt-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            {/* Cyan Gradient */}
            <linearGradient id="cyanGradExact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Purple Gradient */}
            <linearGradient id="purpleGradExact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Percentage Labels */}
          {[10, 20, 30, 40].map((val) => (
            <g key={val}>
              <line
                x1={paddingX}
                y1={getY(val)}
                x2={width - paddingX}
                y2={getY(val)}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 10}
                y={getY(val) + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[11px] font-semibold"
              >
                {val}%
              </text>
            </g>
          ))}

          {/* Cyan Area & Spline Line */}
          <path d={cyanArea} fill="url(#cyanGradExact)" />
          <path d={cyanPath} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

          {/* Purple Area & Spline Line */}
          <path d={purpleArea} fill="url(#purpleGradExact)" />
          <path d={purplePath} fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" />

          {/* Pure CSS Smooth Non-lagging Interactive Dots */}
          {chartPoints.map((p, idx) => {
            const cx = getX(idx);
            const cyCyan = getY(p.cyanVal);
            const cyPurple = getY(p.purpleVal);
            const topY = Math.min(cyCyan, cyPurple) - 22;

            return (
              <g key={idx} className="group/dot cursor-pointer">
                
                {/* Vertical Hover Guidelines */}
                <line
                  x1={cx}
                  y1={paddingYTop}
                  x2={cx}
                  y2={baselineY}
                  stroke="#818cf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none"
                />

                {/* Cyan Node */}
                <circle
                  cx={cx}
                  cy={cyCyan}
                  r="5.5"
                  fill="#ffffff"
                  stroke="#00b4d8"
                  strokeWidth="3"
                  className="transition-transform duration-150 ease-out origin-center group-hover/dot:scale-130"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />

                {/* Purple Node */}
                <circle
                  cx={cx}
                  cy={cyPurple}
                  r="5.5"
                  fill="#ffffff"
                  stroke="#a855f7"
                  strokeWidth="3"
                  className="transition-transform duration-150 ease-out origin-center group-hover/dot:scale-130"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />

                {/* Hover Tooltip Overlay (Instant 60fps CSS) */}
                <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <rect
                    x={cx - 75}
                    y={topY - 14}
                    width="150"
                    height="22"
                    rx="11"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={topY + 1}
                    textAnchor="middle"
                    className="fill-white font-mono text-[9px] font-bold"
                  >
                    Purple: {p.purpleVal}% • Cyan: {p.cyanVal}%
                  </text>
                </g>

                {/* X-Axis Month Label */}
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-white font-extrabold text-[13px] tracking-wide"
                >
                  {p.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
