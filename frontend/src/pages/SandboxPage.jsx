import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ZoneBadge from '../components/shared/ZoneBadge'
import { geoAPI } from '../api/geo'
import { policiesAPI } from '../api/policies'
import {
  formatCompactDzd,
  formatInteger,
} from '../utils/format'

const PAGE_SIZE = 20

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

export default function SandboxPage() {
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [zoneInfo, setZoneInfo] = useState(null)
  const [policies, setPolicies] = useState([])
  const [selectedPolicyId, setSelectedPolicyId] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    wilaya_code: '',
    commune: '',
    type_risque: '',
    policy_year: '',
  })

  useEffect(() => {
    geoAPI.getWilayas().then(setWilayas).catch(() => {})
  }, [])

  useEffect(() => {
    if (!filters.wilaya_code) {
      setCommunes([])
      setZoneInfo(null)
      return
    }

    geoAPI.getCommunesByWilaya(filters.wilaya_code).then(setCommunes).catch(() => {})
  }, [filters.wilaya_code])

  useEffect(() => {
    if (!filters.wilaya_code || !filters.commune) {
      setZoneInfo(null)
      return
    }

    geoAPI
      .getZone(filters.wilaya_code, filters.commune)
      .then(setZoneInfo)
      .catch(() => setZoneInfo(null))
  }, [filters.commune, filters.wilaya_code])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await policiesAPI.getAll({
          page,
          size: PAGE_SIZE,
          search: filters.search || undefined,
          wilaya_code: filters.wilaya_code || undefined,
          commune: filters.commune || undefined,
          type_risque: filters.type_risque || undefined,
          policy_year: filters.policy_year ? Number(filters.policy_year) : undefined,
        })

        if (!cancelled) {
          setPolicies(response.items ?? [])
          setTotal(response.total ?? 0)
          setSelectedPolicyId((current) =>
            response.items?.some((policy) => policy.id === current)
              ? current
              : response.items?.[0]?.id ?? null
          )
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [filters, page])

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.id === selectedPolicyId) ?? null,
    [policies, selectedPolicyId]
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const setFilter = (key, value) => {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>
        <div style={S.leftCol}>
          <div style={S.panel}>
            <div style={S.panelTitle}>Recherche portefeuille</div>

            <Field label="Recherche">
              <div style={S.searchBox}>
                <Search size={14} color="var(--text-quaternary)" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  placeholder="N° police, commune, wilaya"
                  style={S.searchInput}
                />
              </div>
            </Field>

            <Field label="Wilaya">
              <select
                value={filters.wilaya_code}
                onChange={(e) => {
                  setFilter('wilaya_code', e.target.value)
                  setFilter('commune', '')
                }}
                style={S.select}
              >
                <option value="">Toutes les wilayas</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {wilaya.code} · {wilaya.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Commune">
              <select
                value={filters.commune}
                onChange={(e) => setFilter('commune', e.target.value)}
                disabled={!communes.length}
                style={S.select}
              >
                <option value="">Toutes les communes</option>
                {communes.map((commune) => (
                  <option key={commune.code} value={commune.name}>
                    {commune.name}
                  </option>
                ))}
              </select>
            </Field>

            {zoneInfo && (
              <div style={S.zoneBox}>
                <div style={S.zoneLabel}>Zone détectée</div>
                <ZoneBadge zone={zoneInfo.zone} size="md" showLabel />
                <div style={S.zoneDescription}>{zoneInfo.description}</div>
              </div>
            )}

            <Field label="Type de risque">
              <select
                value={filters.type_risque}
                onChange={(e) => setFilter('type_risque', e.target.value)}
                style={S.select}
              >
                <option value="">Tous les types</option>
                <option value="1 - Installation Industrielle">Installation Industrielle</option>
                <option value="2 - Installation Commerciale">Installation Commerciale</option>
                <option value="Bien immobilier">Bien immobilier</option>
              </select>
            </Field>

            <Field label="Année de police">
              <input
                type="number"
                value={filters.policy_year}
                onChange={(e) => setFilter('policy_year', e.target.value)}
                style={S.input}
                placeholder="ex. 2024"
              />
            </Field>
          </div>

          <div style={S.panel}>
            <div style={S.panelTitle}>Résultats</div>
            <div style={S.resultMeta}>
              {formatInteger(total)} polices · page {page} / {totalPages}
            </div>

            {loading ? (
              <div style={S.loadingBox}>
                <LoadingSpinner size={28} />
              </div>
            ) : error ? (
              <div style={S.errorBox}>{error}</div>
            ) : (
              <>
                <div style={S.list}>
                  {policies.map((policy) => (
                    <button
                      key={policy.id}
                      onClick={() => setSelectedPolicyId(policy.id)}
                      style={{
                        ...S.policyButton,
                        borderColor:
                          selectedPolicyId === policy.id ? 'var(--primary-500)' : 'var(--border)',
                        background:
                          selectedPolicyId === policy.id ? 'var(--primary-50)' : 'var(--surface)',
                      }}
                    >
                      <div style={S.policyNumber}>{policy.numero_police}</div>
                      <div style={S.policyMeta}>
                        {policy.wilaya} · {policy.commune_name}
                      </div>
                      <div style={S.policyFooter}>
                        <ZoneBadge zone={policy.zone_sismique} />
                        <span style={S.policyValue}>{formatCompactDzd(policy.capital_assure)}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={S.pagination}>
                  <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                    ←
                  </button>
                  <span>Page {page}</span>
                  <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={S.rightCol}>
          <div style={S.panel}>
            <div style={S.panelTitle}>Fiche police</div>

            {selectedPolicy ? (
              <>
                <div style={S.detailHeader}>
                  <div>
                    <div style={S.detailTitle}>{selectedPolicy.numero_police}</div>
                    <div style={S.detailSub}>
                      {selectedPolicy.wilaya} · {selectedPolicy.commune_name}
                    </div>
                  </div>
                  <ZoneBadge zone={selectedPolicy.zone_sismique} size="md" />
                </div>

                <div style={S.metricsGrid}>
                  {[
                    ['Capital assuré', formatCompactDzd(selectedPolicy.capital_assure)],
                    ['Prime nette', formatCompactDzd(selectedPolicy.prime_nette)],
                    ['Type de risque', selectedPolicy.type_risque],
                    ['Année', String(selectedPolicy.policy_year)],
                    ['Date effet', selectedPolicy.date_effet],
                    ['Date expiration', selectedPolicy.date_expiration],
                  ].map(([label, value]) => (
                    <div key={label} style={S.metricCard}>
                      <div style={S.metricLabel}>{label}</div>
                      <div style={S.metricValue}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={S.panelTitleSecondary}>Contexte portefeuille</div>
                <div style={S.metricsList}>
                  {[
                    ['Polices sur la même zone', formatInteger(selectedPolicy.zone_policy_count_year ?? 0)],
                    ['Capital zone', formatCompactDzd(selectedPolicy.zone_capital_assure_total_year ?? 0)],
                    ['Polices sur la wilaya', formatInteger(selectedPolicy.wilaya_policy_count_year ?? 0)],
                    ['Capital wilaya', formatCompactDzd(selectedPolicy.wilaya_capital_assure_total_year ?? 0)],
                  ].map(([label, value]) => (
                    <div key={label} style={S.metricRow}>
                      <span style={S.metricRowLabel}>{label}</span>
                      <span style={S.metricRowValue}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={S.emptyState}>Sélectionnez une police pour voir son détail.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

const S = {
  page: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '0.95fr 1.05fr',
    gap: 14,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 20px',
  },
  panelTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    marginBottom: 14,
  },
  panelTitleSecondary: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: '0.84rem',
    color: 'var(--text-primary)',
    marginTop: 18,
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: 'var(--text-quaternary)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '0 12px',
    background: 'var(--surface)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    padding: '10px 0',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
  },
  zoneBox: {
    marginBottom: 14,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
  },
  zoneLabel: {
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: 'var(--text-quaternary)',
    marginBottom: 8,
  },
  zoneDescription: {
    marginTop: 8,
    color: 'var(--text-tertiary)',
    fontSize: '0.74rem',
  },
  resultMeta: {
    color: 'var(--text-tertiary)',
    fontSize: '0.74rem',
    marginBottom: 12,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: '54vh',
    overflowY: 'auto',
  },
  policyButton: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
  },
  policyNumber: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
  },
  policyMeta: {
    marginTop: 4,
    color: 'var(--text-tertiary)',
    fontSize: '0.74rem',
  },
  policyFooter: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  policyValue: {
    color: 'var(--text-primary)',
    fontSize: '0.72rem',
    fontFamily: "'JetBrains Mono', monospace",
  },
  pagination: {
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'var(--text-tertiary)',
    fontSize: '0.74rem',
  },
  loadingBox: {
    display: 'flex',
    justifyContent: 'center',
    padding: 24,
  },
  errorBox: {
    padding: '12px 14px',
    borderRadius: 10,
    background: 'var(--danger-muted)',
    border: '1px solid var(--danger-border)',
    color: 'var(--text-primary)',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  detailTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  detailSub: {
    marginTop: 4,
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
  },
  metricsGrid: {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  metricCard: {
    padding: '12px 14px',
    borderRadius: 12,
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
  },
  metricLabel: {
    fontSize: '0.64rem',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: 'var(--text-quaternary)',
    marginBottom: 6,
  },
  metricValue: {
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    lineHeight: 1.5,
    fontWeight: 600,
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: 8,
  },
  metricRowLabel: {
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
  },
  metricRowValue: {
    color: 'var(--text-primary)',
    fontSize: '0.76rem',
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right',
  },
  emptyState: {
    color: 'var(--text-tertiary)',
    fontSize: '0.78rem',
  },
}
