// ── Portfolio data ──────────────────────────────────────────────
export const PORTFOLIO = {
  totalPolicies: 113100,
  totalExposition: 1131,   // Mrd DZD
  balanceScore: 47,
  pml200: 285,             // Mrd DZD
  primeAnnuelle: 351.4,    // M DZD
}

export const ZONES = [
  { name: 'Zone III',  key: 'III',  pct: 30.5, policies: 34369, si: 343.7, color: '#dc2626' },
  { name: 'Zone IIb', key: 'IIb',  pct: 15.9, policies: 17932, si: 179.3, color: '#f59e0b' },
  { name: 'Zone IIa', key: 'IIa',  pct: 43.2, policies: 48696, si: 487.0, color: '#eab308' },
  { name: 'Zone I',   key: 'I',    pct:  7.9, policies:  8900, si:  89.0, color: '#22c55e' },
  { name: 'Zone 0',   key: '0',    pct:  2.5, policies:  2794, si:  27.9, color: '#3b82f6' },
]

export const ZONE_COLOR = {
  III: '#dc2626', IIb: '#f59e0b', IIa: '#eab308', I: '#22c55e', '0': '#3b82f6',
}

export const GROWTH = [
  { year: '2023', III: 11200, IIb: 5800, IIa: 15800, I: 2900, Z0: 900  },
  { year: '2024', III: 11500, IIb: 6000, IIa: 16500, I: 2900, Z0: 930  },
  { year: '2025', III: 11669, IIb: 6132, IIa: 16396, I: 3101, Z0: 964  },
]

export const HOTSPOTS = [
  { rank:1,  wilaya:'Alger',        code:16, zone:'III', policies:24959, si:249590, score:94 },
  { rank:2,  wilaya:'Tipaza',       code:42, zone:'III', policies:4570,  si:45700,  score:89 },
  { rank:3,  wilaya:'Boumerdès',    code:35, zone:'III', policies:3340,  si:33400,  score:91 },
  { rank:4,  wilaya:'Tizi Ouzou',   code:15, zone:'IIb', policies:11826, si:118260, score:78 },
  { rank:5,  wilaya:'Blida',        code:9,  zone:'IIb', policies:3556,  si:35560,  score:76 },
  { rank:6,  wilaya:'Sétif',        code:19, zone:'IIa', policies:12310, si:123100, score:61 },
  { rank:7,  wilaya:'B.B.Arréridj', code:34, zone:'IIa', policies:5061,  si:50610,  score:58 },
  { rank:8,  wilaya:'Constantine',  code:25, zone:'IIa', policies:5053,  si:50530,  score:57 },
  { rank:9,  wilaya:'Oran',         code:31, zone:'IIa', policies:5051,  si:50510,  score:55 },
  { rank:10, wilaya:'Jijel',        code:18, zone:'IIa', policies:4012,  si:40120,  score:53 },
]

// ── Monte Carlo scenarios ────────────────────────────────────────
export const MC_SCENARIOS = [
  {
    id: 'boumerdes',
    title: 'Boumerdès 2003',
    badge: 'ÉVÉNEMENT RÉEL',
    badgeColor: '#dc2626',
    magnitude: 6.8,
    epicentre: '36.9°N, 3.58°E',
    depth: 10,
    radius: 80,
    meanLoss: 82,
    grossLoss: 82,
    ceded: 57.4,
    net: 24.6,
  },
  {
    id: 'elasnam',
    title: 'El Asnam 1980',
    badge: 'ÉVÉNEMENT RÉEL',
    badgeColor: '#dc2626',
    magnitude: 7.3,
    epicentre: '36.3°N, 1.35°E',
    depth: 15,
    radius: 120,
    meanLoss: 145,
    grossLoss: 145,
    ceded: 101.5,
    net: 43.5,
  },
  {
    id: 'alger_synth',
    title: 'Scénario Alger M7.0',
    badge: 'STRESS TEST',
    badgeColor: '#f59e0b',
    magnitude: 7.0,
    epicentre: 'Centre d\'Alger',
    depth: 12,
    radius: 100,
    meanLoss: 198,
    grossLoss: 198,
    ceded: 138.6,
    net: 59.4,
  },
]

// ── Seismic alert events ─────────────────────────────────────────
export const SIMULATED_EVENTS = [
  {
    magnitude: 2.8,
    location: 'Mer Méditerranée, au large d\'Alger',
    depth: 15, lat: 37.1, lon: 3.2,
    affectedWilayas: [],
    isMajor: false,
  },
  {
    magnitude: 4.2,
    location: 'Wilaya de Chlef, Algérie',
    depth: 8, lat: 36.2, lon: 1.3,
    affectedWilayas: ['Chlef (Zone III)', 'Ain Defla (Zone III)', 'Tissemsilt (Zone IIb)'],
    isMajor: false,
  },
  {
    magnitude: 3.1,
    location: 'Wilaya de Boumerdès, Algérie',
    depth: 12, lat: 36.8, lon: 3.5,
    affectedWilayas: ['Boumerdès (Zone III)', 'Alger (Zone III)', 'Tizi Ouzou (Zone IIb)'],
    isMajor: false,
  },
  {
    magnitude: 5.1,
    location: 'ALERTE MAJEURE — Wilaya de Tipaza',
    depth: 6, lat: 36.6, lon: 2.2,
    affectedWilayas: ['Tipaza (Zone III)', 'Alger (Zone III)', 'Blida (Zone IIb)', 'Chlef (Zone III)'],
    isMajor: true,
  },
  {
    magnitude: 3.7,
    location: 'Région de Sétif, Algérie',
    depth: 18, lat: 36.2, lon: 5.4,
    affectedWilayas: ['Sétif (Zone IIa)', 'BBA (Zone IIa)'],
    isMajor: false,
  },
]
