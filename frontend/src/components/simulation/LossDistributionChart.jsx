/**
 * @fileoverview LossDistributionChart — Recharts histogram of 10,000 sampled loss values.
 * Displays the full Monte Carlo loss distribution with VaR markers.
 *
 * @param {{ result: import('../../types/simulation').SimulationResult }} props
 */
import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

const BINS = 50

function buildHistogram(values, bins) {
  if (!values?.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = (max - min) / bins
  const counts = new Array(bins).fill(0)

  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1)
    counts[idx]++
  })

  return counts.map((count, i) => ({
    loss: min + i * step,
    count,
    lossLabel: formatDZD(min + i * step),
  }))
}

function formatDZD(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} Md`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} M`
  return `${(v / 1e3).toFixed(0)} K`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { loss, count } = payload[0].payload
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#94a3b8' }}>Perte : <strong style={{ color: '#f1f5f9' }}>{formatDZD(loss)} DZD</strong></div>
      <div style={{ color: '#94a3b8' }}>Itérations : <strong style={{ color: '#f1f5f9' }}>{count}</strong></div>
    </div>
  )
}

export default function LossDistributionChart({ result }) {
  const data = useMemo(
    () => buildHistogram(result?.distribution_json, BINS),
    [result?.distribution_json]
  )

  if (!result || !data.length) return null

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="lossLabel"
            tick={{ fill: '#64748b', fontSize: 10 }}
            interval={Math.floor(BINS / 6)}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
          <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} name="Fréquence" />

          {/* VaR reference lines */}
          <ReferenceLine
            x={formatDZD(result.var_95)}
            stroke="#eab308"
            strokeDasharray="4 2"
            label={{ value: 'VaR 95%', fill: '#eab308', fontSize: 10 }}
          />
          <ReferenceLine
            x={formatDZD(result.var_99)}
            stroke="#ef4444"
            strokeDasharray="4 2"
            label={{ value: 'VaR 99%', fill: '#ef4444', fontSize: 10 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
