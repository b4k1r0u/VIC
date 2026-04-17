/**
 * @fileoverview SimulationKPIs — key metric cards after a Monte Carlo run.
 *
 * Shows: Expected Loss · VaR 95% · VaR 99% · PML 99.9% · Affected policies
 *
 * @param {{ result: import('../../types/simulation').SimulationResult }} props
 */
import React from 'react'
import KPICard from '../shared/KPICard'

function formatDZD(value) {
  if (!value && value !== 0) return '—'
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} Mrd DZD`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M DZD`
  return `${value.toLocaleString()} DZD`
}

export default function SimulationKPIs({ result }) {
  if (!result) return null

  const kpis = [
    {
      label: 'Perte attendue (brute)',
      value: formatDZD(result.expected_gross_loss),
      sub: `Nette : ${formatDZD(result.expected_net_loss)}`,
      color: '#6366f1',
      icon: '📉',
    },
    {
      label: 'VaR 95%',
      value: formatDZD(result.var_95),
      sub: 'Value at Risk',
      color: '#eab308',
      icon: '⚠️',
    },
    {
      label: 'VaR 99%',
      value: formatDZD(result.var_99),
      sub: 'Value at Risk extrême',
      color: '#f97316',
      icon: '🔶',
    },
    {
      label: 'PML 99.9%',
      value: formatDZD(result.pml_999),
      sub: 'Probable Max Loss',
      color: '#ef4444',
      icon: '🔴',
    },
    {
      label: 'Polices affectées',
      value: result.affected_policies?.toLocaleString() ?? '—',
      sub: result.scenario_name,
      color: '#22c55e',
      icon: '📋',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          sub={kpi.sub}
          accentColor={kpi.color}
          icon={kpi.icon}
        />
      ))}
    </div>
  )
}
