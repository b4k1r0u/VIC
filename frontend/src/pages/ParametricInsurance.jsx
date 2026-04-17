/**
 * @fileoverview ParametricInsurance — parametric insurance + damage AI page.
 *
 * Layout:
 *  ┌────────────────────────────┬──────────────────────────────┐
 *  │  Upload form               │  DamageResultCard            │
 *  │  - ImageUploader           │  (shown after estimation)    │
 *  │  - Zone, wilaya, commune   │                              │
 *  │  - Area (km²)              │  RecommendationPanel         │
 *  │  - Construction type       │  (includes damage context)   │
 *  │  - [Estimer] + [Mock]      │                              │
 *  └────────────────────────────┴──────────────────────────────┘
 *
 * Route: /parametric
 */
import React, { useState, useEffect } from 'react'
import ImageUploader from '../components/parametric/ImageUploader'
import DamageResultCard from '../components/parametric/DamageResultCard'
import RecommendationPanel from '../components/recommendations/RecommendationPanel'
import ZoneBadge from '../components/shared/ZoneBadge'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { damageAPI } from '../api/damage'
import { geoAPI } from '../api/geo'
import { CONSTRUCTION_TYPE_OPTIONS } from '../types/policy'

const IMAGE_TYPES = ['satellite', 'drone']

export default function ParametricInsurance() {
  const [imageFile, setImageFile] = useState(null)
  const [imageType, setImageType] = useState('satellite')
  const [wilayaCode, setWilayaCode] = useState('')
  const [communeName, setCommuneName] = useState('')
  const [zone, setZone] = useState(null)
  const [areaKm2, setAreaKm2] = useState('')
  const [constructionType, setConstructionType] = useState(CONSTRUCTION_TYPE_OPTIONS[0])
  const [magnitude, setMagnitude] = useState('6.0')
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => { geoAPI.getWilayas().then(setWilayas).catch(() => {}) }, [])

  useEffect(() => {
    if (!wilayaCode) { setCommunes([]); return }
    geoAPI.getCommunesByWilaya(wilayaCode).then(setCommunes).catch(() => {})
  }, [wilayaCode])

  useEffect(() => {
    if (!wilayaCode || !communeName) { setZone(null); return }
    geoAPI.getZone(wilayaCode, communeName).then((r) => setZone(r.zone)).catch(() => setZone(null))
  }, [wilayaCode, communeName])

  const handleEstimate = async () => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (useMock || !imageFile) {
        res = await damageAPI.estimateMock({
          zone_sismique: zone,
          construction_type: constructionType,
          magnitude: parseFloat(magnitude),
          area_km2: parseFloat(areaKm2) || 10,
        })
      } else {
        res = await damageAPI.estimate(imageFile, {
          image_type: imageType,
          area_km2: parseFloat(areaKm2) || 10,
          construction_type: constructionType,
          zone_sismique: zone,
          wilaya_code: wilayaCode || undefined,
        })
      }
      setResult(res)
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const canEstimate = zone && areaKm2 && (imageFile || useMock)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🛰️ Assurance Paramétrique</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
        Estimation des dommages post-séisme par image satellite · drone (IA CNN)
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left: input form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Image upload */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Image sismique</h2>
            <ImageUploader onFile={setImageFile} />

            {/* Mock toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} />
              Utiliser une estimation simulée (sans image)
            </label>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Type d'image</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {IMAGE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setImageType(t)}
                    style={{
                      padding: '5px 12px', fontSize: 11, borderRadius: 6, border: '1px solid',
                      borderColor: imageType === t ? '#6366f1' : '#1e293b',
                      background: imageType === t ? '#6366f133' : 'transparent',
                      color: imageType === t ? '#818cf8' : '#64748b',
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location + parameters */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Paramètres de zone</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Wilaya</label>
                <select value={wilayaCode} onChange={(e) => { setWilayaCode(e.target.value); setCommuneName('') }} style={{ width: '100%' }}>
                  <option value="">Sélectionner…</option>
                  {wilayas.map((w) => <option key={w.code} value={w.code}>{w.code} — {w.name_fr}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Commune</label>
                <select value={communeName} onChange={(e) => setCommuneName(e.target.value)} disabled={!communes.length} style={{ width: '100%' }}>
                  <option value="">Sélectionner…</option>
                  {communes.map((c) => <option key={c.id} value={c.commune_name}>{c.commune_name}</option>)}
                </select>
              </div>

              {zone && (
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Zone sismique (auto)</label>
                  <ZoneBadge zone={zone} size="md" showLabel />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Surface couverte (km²)</label>
                <input type="number" min="0.1" step="0.5" value={areaKm2} onChange={(e) => setAreaKm2(e.target.value)} placeholder="ex. 25" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Type de construction</label>
                <select value={constructionType} onChange={(e) => setConstructionType(e.target.value)} style={{ width: '100%' }}>
                  {CONSTRUCTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {useMock && (
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Magnitude du séisme</label>
                  <input type="number" min="4" max="9" step="0.1" value={magnitude} onChange={(e) => setMagnitude(e.target.value)} style={{ width: '100%' }} />
                </div>
              )}
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}

          <button
            onClick={handleEstimate}
            disabled={loading || !canEstimate}
            style={{
              padding: 14, fontWeight: 700, fontSize: 14,
              background: canEstimate ? '#6366f1' : '#1e293b',
              color: canEstimate ? '#fff' : '#475569',
              border: 'none', borderRadius: 10, cursor: canEstimate ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><LoadingSpinner size={16} color="#fff" /> Estimation en cours…</> : '🔍 Estimer les dommages'}
          </button>
        </div>

        {/* ── Right: results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!result && !loading && (
            <div style={{
              background: '#0f172a', border: '1px dashed #1e293b', borderRadius: 12,
              padding: 48, textAlign: 'center', color: '#475569',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛰️</div>
              <p>Chargez une image et configurez les paramètres pour estimer les dommages.</p>
            </div>
          )}

          {result && (
            <>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Résultat de l'estimation</h2>
                <DamageResultCard result={result} />
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <RecommendationPanel
                  scope={communeName ? 'commune' : 'portfolio'}
                  scopeRef={communeName || undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
