export function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatInteger(value) {
  return Math.round(toNumber(value)).toLocaleString('fr-FR')
}

export function formatCompactDzd(value) {
  const amount = toNumber(value)

  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1)} Mrd DZD`
  }

  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1)} M DZD`
  }

  return `${amount.toLocaleString('fr-FR')} DZD`
}

export function formatPercent(value, digits = 1) {
  return `${toNumber(value).toFixed(digits)}%`
}

export function formatRate(value, digits = 4) {
  return toNumber(value).toFixed(digits)
}

export function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
