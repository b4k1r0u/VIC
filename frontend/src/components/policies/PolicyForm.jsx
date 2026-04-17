/**
 * @fileoverview PolicyForm — create/edit policy with live risk scoring.
 *
 * Responsibilities:
 *  1. Fields: type, wilaya, commune, address, valeur_assurée, date_effet, date_expiration
 *  2. On commune select → auto-fetches seismic zone (read-only ZoneBadge)
 *  3. On valeur_assurée input → debounced POST /api/ml/score → live PolicyRiskBadge
 *  4. On submit → POST /api/policies → enriched Policy returned immediately
 *  5. After success → policyStore.addPolicy + map refresh
 *
 * @param {{ editPolicy?: import('../../types/policy').Policy, onSuccess?: (p: Policy) => void }} props
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { geoAPI } from '../../api/geo'
import { policiesAPI } from '../../api/policies'
import apiClient from '../../api/client'
import usePolicyStore from '../../store/policyStore'
import useMapStore from '../../store/mapStore'
import PolicyRiskBadge from './PolicyRiskBadge'
import ZoneBadge from '../shared/ZoneBadge'
import LoadingSpinner from '../shared/LoadingSpinner'
import { TYPE_RISQUE_OPTIONS, CONSTRUCTION_TYPE_OPTIONS } from '../../types/policy'

const INITIAL = {
  numero_police: '',
  date_effet: '',
  date_expiration: '',
  type_risque: TYPE_RISQUE_OPTIONS[0],
  construction_type: CONSTRUCTION_TYPE_OPTIONS[0],
  wilaya_code: '',
  commune_name: '',
  adresse: '',
  valeur_assuree: '',
  prime_nette: '',
}

export default function PolicyForm({ editPolicy, onSuccess }) {
  const [form, setForm] = useState(editPolicy
    ? {
        ...INITIAL,
        ...editPolicy,
        commune_name: editPolicy.commune_name ?? '',
        valeur_assuree: editPolicy.valeur_assuree ?? '',
        prime_nette: editPolicy.prime_nette ?? '',
      }
    : { ...INITIAL }
  )
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [zone, setZone] = useState(editPolicy?.zone_sismique ?? null)
  const [riskScore, setRiskScore] = useState(editPolicy ? { score: editPolicy.risk_score, tier: editPolicy.risk_tier } : null)
  const [scoringLoading, setScoringLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const addPolicy    = usePolicyStore((s) => s.addPolicy)
  const fetchMapData = useMapStore((s) => s.fetchMapData)
  const debounceRef  = useRef(null)

  // ── Load wilayas on mount ──────────────────────────────────────────────────
  useEffect(() => {
    geoAPI.getWilayas().then(setWilayas).catch(() => {})
  }, [])

  // ── Load communes when wilaya changes ─────────────────────────────────────
  useEffect(() => {
    if (!form.wilaya_code) { setCommunes([]); return }
    geoAPI.getCommunesByWilaya(form.wilaya_code).then(setCommunes).catch(() => {})
  }, [form.wilaya_code])

  // ── Auto-fetch zone when commune is selected ──────────────────────────────
  useEffect(() => {
    if (!form.wilaya_code || !form.commune_name) { setZone(null); return }
    geoAPI.getZone(form.wilaya_code, form.commune_name)
      .then((r) => setZone(r.zone))
      .catch(() => setZone(null))
  }, [form.wilaya_code, form.commune_name])

  // ── Live risk scoring (debounced 500 ms) ──────────────────────────────────
  const scorePolicy = useCallback(() => {
    if (!zone || !form.wilaya_code || !form.type_risque || !form.valeur_assuree) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setScoringLoading(true)
      try {
        const res = await apiClient.post('/api/ml/score', {
          zone_sismique: zone,
          wilaya_code: form.wilaya_code,
          type_risque: form.type_risque,
          valeur_assuree: parseFloat(form.valeur_assuree),
        })
        setRiskScore(res.data)
      } catch { /* silent */ }
      finally { setScoringLoading(false) }
    }, 500)
  }, [zone, form.wilaya_code, form.type_risque, form.valeur_assuree])

  useEffect(() => { scorePolicy() }, [scorePolicy])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...form,
        valeur_assuree: parseFloat(form.valeur_assuree),
        prime_nette: parseFloat(form.prime_nette),
      }
      const policy = editPolicy
        ? await policiesAPI.update(editPolicy.id, payload)
        : await addPolicy(payload)

      fetchMapData()
      onSuccess?.(policy)
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px', overflowY: 'auto' }}>
      <h3 style={{ marginBottom: 16, fontSize: 15 }}>
        {editPolicy ? '✏️ Modifier la police' : '+ Nouvelle police'}
      </h3>

      <Field label="N° Police *">
        <input required value={form.numero_police} onChange={(e) => set('numero_police', e.target.value)} placeholder="ex. CAT-2024-00123" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date d'effet *">
          <input type="date" required value={form.date_effet} onChange={(e) => set('date_effet', e.target.value)} />
        </Field>
        <Field label="Date d'expiration *">
          <input type="date" required value={form.date_expiration} onChange={(e) => set('date_expiration', e.target.value)} />
        </Field>
      </div>

      <Field label="Type de risque *">
        <select required value={form.type_risque} onChange={(e) => set('type_risque', e.target.value)}>
          {TYPE_RISQUE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Type de construction">
        <select value={form.construction_type} onChange={(e) => set('construction_type', e.target.value)}>
          {CONSTRUCTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Wilaya *">
          <select required value={form.wilaya_code} onChange={(e) => { set('wilaya_code', e.target.value); set('commune_name', '') }}>
            <option value="">Sélectionner…</option>
            {wilayas.map((w) => <option key={w.code} value={w.code}>{w.code} — {w.name_fr}</option>)}
          </select>
        </Field>
        <Field label="Commune *">
          <select required value={form.commune_name} onChange={(e) => set('commune_name', e.target.value)} disabled={!communes.length}>
            <option value="">Sélectionner…</option>
            {communes.map((c) => <option key={c.id} value={c.commune_name}>{c.commune_name}</option>)}
          </select>
        </Field>
      </div>

      {/* Auto-filled zone badge */}
      {zone && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Zone sismique RPA (auto)</label>
          <ZoneBadge zone={zone} />
        </div>
      )}

      <Field label="Adresse">
        <input value={form.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="Adresse complète" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Valeur assurée (DZD) *">
          <input
            type="number"
            required
            min={0}
            value={form.valeur_assuree}
            onChange={(e) => set('valeur_assuree', e.target.value)}
            placeholder="ex. 50000000"
          />
        </Field>
        <Field label="Prime nette (DZD) *">
          <input
            type="number"
            required
            min={0}
            value={form.prime_nette}
            onChange={(e) => set('prime_nette', e.target.value)}
            placeholder="ex. 250000"
          />
        </Field>
      </div>

      {/* Live risk score badge */}
      {(riskScore || scoringLoading) && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Score de risque CatBoost</label>
          <PolicyRiskBadge score={riskScore?.score} tier={riskScore?.tier} loading={scoringLoading} />
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '10px', fontWeight: 700, fontSize: 14,
          background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
        }}
      >
        {submitting ? <><LoadingSpinner size={14} /> Enrichissement en cours…</> : editPolicy ? 'Mettre à jour' : 'Créer la police'}
      </button>
    </form>
  )
}
