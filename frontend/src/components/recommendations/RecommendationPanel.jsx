/**
 * @fileoverview RecommendationPanel — RAG output panel powered by Gemini.
 *
 * Responsibilities:
 *  1. Displays AI-generated recommendations (executive summary + cards)
 *  2. Context source tags: [Simulation] [CatBoost] [Zone Data] [RPA 99 §x.x]
 *  3. Auto-refreshes after: simulation run / map zone click / policy add / alert M≥5
 *  4. Free-form text input for user questions ("What if I reduce Zone III by 20%?")
 *  5. Streams Gemini response token by token (typewriter effect)
 *
 * Location: right sidebar of Dashboard page
 */
import React, { useState, useEffect, useRef } from 'react'
import { recommendationAPI } from '../../api/recommendations'
import useSimulationStore from '../../store/simulationStore'
import useMapStore from '../../store/mapStore'
import RecommendationCard from './RecommendationCard'
import LoadingSpinner from '../shared/LoadingSpinner'

const PRIORITY_ICON = {
  CRITIQUE:    '🔴',
  ÉLEVÉE:      '🟠',
  MODÉRÉE:     '🟡',
  OPPORTUNITÉ: '🟢',
  CRITICAL:    '🔴',
  HIGH:        '🟠',
  MEDIUM:      '🟡',
  OPPORTUNITY: '🟢',
}

export default function RecommendationPanel({ scope = 'portfolio', scopeRef }) {
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary] = useState('')
  const [sources, setSources] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [userQuestion, setUserQuestion] = useState('')
  const [error, setError] = useState(null)

  const simulationResult = useSimulationStore((s) => s.result)
  const selectedWilaya  = useMapStore((s) => s.selectedWilaya)

  const questionRef = useRef(null)
  const prevSimId   = useRef(null)

  // ── Auto-refresh triggers ──────────────────────────────────────────────────
  useEffect(() => {
    if (simulationResult?.id && simulationResult.id !== prevSimId.current) {
      prevSimId.current = simulationResult.id
      fetchRecommendations()
    }
  }, [simulationResult?.id]) // eslint-disable-line

  useEffect(() => {
    if (selectedWilaya) fetchRecommendations()
  }, [selectedWilaya]) // eslint-disable-line

  // ── Streaming fetch ────────────────────────────────────────────────────────
  async function fetchRecommendations(question) {
    setStreaming(true)
    setStreamText('')
    setError(null)

    const ctx = {
      scope: selectedWilaya ? 'wilaya' : scope,
      scope_ref: selectedWilaya ?? scopeRef,
      simulation_id: simulationResult?.id,
      include_damage: false,
      user_question: question || undefined,
    }

    try {
      let raw = ''
      await recommendationAPI.streamRecommendations(ctx, (chunk) => {
        raw += chunk
        setStreamText(raw)
      })

      // Try to parse structured JSON from streamed text
      const parsed = JSON.parse(raw)
      setRecommendations(parsed.recommendations ?? [])
      setSummary(parsed.executive_summary ?? '')
      setSources(parsed.context_sources ?? [])
      setStreamText('')
    } catch {
      // Stream was plain text (non-JSON) — display as summary
      setSummary(streamText)
      setRecommendations([])
    } finally {
      setStreaming(false)
    }
  }

  const handleAsk = (e) => {
    e.preventDefault()
    if (!userQuestion.trim()) return
    fetchRecommendations(userQuestion)
    setUserQuestion('')
  }

  return (
    <div className="recommendation-panel">
      <div className="panel-header">
        <span className="panel-title">💡 Strategic Recommendations</span>
        <button
          className="refresh-btn"
          onClick={() => fetchRecommendations()}
          disabled={streaming}
          title="Refresh"
        >
          ↺
        </button>
      </div>

      {/* Context source tags */}
      {sources.length > 0 && (
        <div className="source-tags">
          {sources.map((s) => (
            <span key={s} className="source-tag">{s}</span>
          ))}
        </div>
      )}

      {/* Streaming typewriter output */}
      {streaming && (
        <div className="stream-output">
          <LoadingSpinner size={14} /> <span className="typewriter">{streamText}</span>
        </div>
      )}

      {/* Executive summary */}
      {!streaming && summary && (
        <p className="executive-summary">{summary}</p>
      )}

      {/* Recommendation cards */}
      {!streaming && recommendations.length > 0 && (
        <div className="recommendation-list">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} recommendation={rec} priorityIcon={PRIORITY_ICON} />
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {/* Free-form question input */}
      <form className="question-form" onSubmit={handleAsk}>
        <input
          ref={questionRef}
          type="text"
          placeholder="Ask the actuarial model a question..."
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          disabled={streaming}
        />
        <button type="submit" disabled={streaming || !userQuestion.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
