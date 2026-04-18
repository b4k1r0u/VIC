function compactText(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function firstSentence(value) {
  const text = compactText(value)
  if (!text) return ''

  const match = text.match(/.+?[.!?](?=\s|$)|.+$/)
  return compactText(match?.[0] ?? text)
}

function objectText(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''

  const preferredFields = [
    'recommendation_sentence',
    'recommendation',
    'ai_recommendation',
    'recommendation_text',
    'executive_summary',
    'summary',
    'sentence',
    'text',
    'message',
    'description',
    'action',
    'title',
  ]

  for (const field of preferredFields) {
    const current = value[field]
    if (typeof current === 'string' && compactText(current)) {
      return current
    }
  }

  return ''
}

function arrayText(values) {
  if (!Array.isArray(values)) return ''

  for (const value of values) {
    if (typeof value === 'string' && compactText(value)) {
      return value
    }

    const nested = objectText(value)
    if (nested) return nested
  }

  return ''
}

export function extractRecommendationSentence(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return firstSentence(payload)
  if (Array.isArray(payload)) return firstSentence(arrayText(payload))
  if (typeof payload !== 'object') return ''

  const directFields = [
    'recommendation_sentence',
    'recommendation',
    'ai_recommendation',
    'recommendation_text',
    'executive_summary',
    'recommendations',
  ]

  for (const field of directFields) {
    const value = payload[field]

    if (typeof value === 'string' && compactText(value)) {
      return firstSentence(value)
    }

    if (Array.isArray(value)) {
      const arrayValue = arrayText(value)
      if (arrayValue) return firstSentence(arrayValue)
    }

    if (value && typeof value === 'object') {
      const objectValue = objectText(value)
      if (objectValue) return firstSentence(objectValue)
    }
  }

  return firstSentence(objectText(payload))
}
