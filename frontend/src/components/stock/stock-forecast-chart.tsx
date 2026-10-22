'use client';

import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface StockChartPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
  range: [number, number] | null;
}

interface StockForecastChartProps {
  data: StockChartPoint[];
  forecastStartDate?: string;
  height?: number;
}

function formatTick(date: string): string {
  const [, month, day] = date.split('-');
  const monthShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ][Number(month) - 1];
  return `${day} ${monthShort}`;
}

export function StockForecastChart({
  data,
  forecastStartDate,
  height = 260,
}: StockForecastChartProps) {
  const gradientId = useMemo(
    () => `stock-range-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400"
        style={{ height }}
      >
        Belum ada data tren penjualan untuk item ini.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F6821F" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#F6821F" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            minTickGap={18}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            labelFormatter={(label) => `Tanggal: ${label}`}
            formatter={(value, name) => [
              `${Math.round(Number(value))} unit`,
              String(name),
            ]}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              fontSize: 11,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {forecastStartDate && (
            <ReferenceLine
              x={forecastStartDate}
              stroke="#0051C7"
              strokeDasharray="4 4"
              label={{ value: 'Mulai prediksi', fontSize: 10, fill: '#0051C7', position: 'insideTopRight' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="range"
            name="Rentang prediksi"
            stroke="none"
            fill={`url(#${gradientId})`}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Penjualan aktual"
            stroke="#0051C7"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Prediksi"
            stroke="#F6821F"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
