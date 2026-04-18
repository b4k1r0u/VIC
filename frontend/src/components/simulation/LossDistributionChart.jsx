/**
 * @fileoverview LossDistributionChart — Monte Carlo loss histogram on a numeric axis.
 */
import React, { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactDzd, formatInteger } from '../../utils/format'

const BINS = 32

function buildHistogram(values, bins) {
  if (!values?.length) return []

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [
      {
        midpoint: min,
        rangeStart: min,
        rangeEnd: max,
        count: values.length,
      },
    ]
  }

  const step = (max - min) / bins
  const counts = new Array(bins).fill(0)

  values.forEach((value) => {
    const index = Math.min(Math.floor((value - min) / step), bins - 1)
    counts[index] += 1
  })

  return counts.map((count, index) => {
    const rangeStart = min + index * step
    const rangeEnd = rangeStart + step

    return {
      midpoint: rangeStart + step / 2,
      rangeStart,
      rangeEnd,
      count,
    }
  })
}

function MarkerLabel({ value, color, label, viewBox }) {
  if (!viewBox) return null

  return (
    <g>
      <rect
        x={viewBox.x - 30}
        y={viewBox.y + 8}
        rx={8}
        ry={8}
        width={60}
        height={18}
        fill="#ffffff"
        stroke={color}
        strokeWidth={1}
      />
      <text
        x={viewBox.x}
        y={viewBox.y + 21}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontWeight={700}
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        {label}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const { rangeStart, rangeEnd, count } = payload[0].payload

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.96)',
        border: '1px solid rgba(148,163,184,0.28)',
        borderRadius: 14,
        padding: '10px 12px',
        boxShadow: '0 18px 40px rgba(15,23,42,0.18)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
        Bande de pertes
      </div>
      <div style={{ fontSize: 12, color: '#f8fafc', marginBottom: 4 }}>
        {formatCompactDzd(rangeStart)} → {formatCompactDzd(rangeEnd)}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>
        {formatInteger(count)} itérations dans cette zone
      </div>
    </div>
  )
}

export default function LossDistributionChart({ result }) {
  const data = useMemo(
    () => buildHistogram(result?.distribution_json ?? [], BINS),
    [result?.distribution_json]
  )

  if (!result || !data.length) return null

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 26, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="lossBars" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0.92} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            type="number"
            dataKey="midpoint"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => formatCompactDzd(value)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />

          <Bar
            dataKey="count"
            fill="url(#lossBars)"
            barSize={14}
            radius={[8, 8, 2, 2]}
          />

          <ReferenceLine
            x={result.var_95}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={<MarkerLabel color="#f59e0b" label="VaR 95%" />}
          />
          <ReferenceLine
            x={result.var_99}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={<MarkerLabel color="#ef4444" label="VaR 99%" />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
