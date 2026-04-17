/**
 * @fileoverview PolicyManager — two-pane policy management page.
 *
 * Layout:
 *  ┌──────────────────────────────┬──────────────────────────┐
 *  │   PolicyTable (left)          │  PolicyForm (right)      │
 *  │   - filter bar                │  - create / edit form    │
 *  │   - sortable rows             │  - live CatBoost score   │
 *  │   - pagination                │  - auto zone badge       │
 *  │   - click → opens detail      │                          │
 *  └──────────────────────────────┴──────────────────────────┘
 *
 * On row click → right panel shows RecommendationPanel for that policy.
 *
 * Route: /policies
 */
import React, { useState } from 'react'
import PolicyTable from '../components/policies/PolicyTable'
import PolicyForm from '../components/policies/PolicyForm'
import RecommendationPanel from '../components/recommendations/RecommendationPanel'
import usePolicyStore from '../store/policyStore'
import { policiesAPI } from '../api/policies'

const RIGHT_PANEL = {
  NEW:    'new',
  EDIT:   'edit',
  DETAIL: 'detail',
}

export default function PolicyManager() {
  const [rightPanel, setRightPanel] = useState(RIGHT_PANEL.NEW)
  const [importResult, setImportResult] = useState(null)
  const { selectedPolicy, fetchPolicies } = usePolicyStore()

  const handleRowClick = () => setRightPanel(RIGHT_PANEL.DETAIL)

  const handleImport = async (csvFile) => {
    try {
      const res = await policiesAPI.bulkImport(csvFile)
      setImportResult(res)
      await fetchPolicies()
    } catch (err) {
      setImportResult({ error: err.message })
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left: Table ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1e293b' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📋 Portefeuille</h2>
          <button
            onClick={() => setRightPanel(RIGHT_PANEL.NEW)}
            style={{
              background: '#6366f1', color: '#fff', border: 'none',
              borderRadius: 7, padding: '7px 14px', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            + Nouvelle police
          </button>
        </div>

        {/* Import result banner */}
        {importResult && (
          <div style={{
            padding: '8px 16px', fontSize: 12,
            background: importResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            borderBottom: '1px solid #1e293b',
          }}>
            {importResult.error
              ? `❌ Erreur : ${importResult.error}`
              : `✅ ${importResult.imported} importées · ${importResult.failed} échecs`}
            <button onClick={() => setImportResult(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>×</button>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PolicyTable
            onRowClick={handleRowClick}
            onImport={handleImport}
          />
        </div>
      </div>

      {/* ── Right: Form / Detail ── */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Panel switcher tabs */}
        {selectedPolicy && (
          <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
            {[
              { id: RIGHT_PANEL.DETAIL, label: '💡 Recommandations' },
              { id: RIGHT_PANEL.EDIT,   label: '✏️ Modifier' },
              { id: RIGHT_PANEL.NEW,    label: '+ Nouveau' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setRightPanel(id)}
                style={{
                  flex: 1, padding: '10px 8px', fontSize: 11, border: 'none',
                  borderBottom: rightPanel === id ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'transparent', color: rightPanel === id ? '#6366f1' : '#64748b',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rightPanel === RIGHT_PANEL.NEW && (
            <PolicyForm onSuccess={() => { fetchPolicies(); setRightPanel(RIGHT_PANEL.NEW) }} />
          )}
          {rightPanel === RIGHT_PANEL.EDIT && selectedPolicy && (
            <PolicyForm editPolicy={selectedPolicy} onSuccess={() => { fetchPolicies(); setRightPanel(RIGHT_PANEL.DETAIL) }} />
          )}
          {rightPanel === RIGHT_PANEL.DETAIL && selectedPolicy && (
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>{selectedPolicy.numero_police}</h3>
              <RecommendationPanel
                scope="policy"
                scopeRef={selectedPolicy.id}
              />
            </div>
          )}
          {!selectedPolicy && rightPanel !== RIGHT_PANEL.NEW && (
            <div style={{ padding: 32, color: '#475569', textAlign: 'center', fontSize: 13 }}>
              Sélectionnez une police dans la table
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
