/**
 * @fileoverview Simulation type definitions for RASED Monte Carlo engine.
 */

/**
 * @typedef {Object} SimulationResult
 * @property {string} id
 * @property {string} scenario_name
 * @property {'national'|'wilaya'|'commune'} scope
 * @property {string|null} scope_code
 * @property {number} affected_policies
 * @property {number} expected_gross_loss
 * @property {number} expected_net_loss
 * @property {number} var_95
 * @property {number} var_99
 * @property {number} pml_999
 * @property {number[]} distribution_json   - sampled loss values for histogram
 * @property {CommuneLoss[]} per_commune_json
 * @property {string|Object|null} [recommendation]
 * @property {string|Object|null} [ai_recommendation]
 * @property {string|Object|null} [recommendations]
 * @property {string} created_at
 */

/**
 * @typedef {Object} CommuneLoss
 * @property {string} commune_name
 * @property {string} wilaya_code
 * @property {number} expected_loss
 * @property {number} affected_policies
 */

/**
 * @typedef {Object} SimulationRequest
 * @property {'boumerdes_2003'|'el_asnam_1980'|'custom'} scenario
 * @property {'national'|'wilaya'|'commune'} scope
 * @property {string} [scope_code]
 * @property {CustomScenarioParams} [custom_params]
 */

/**
 * @typedef {Object} CustomScenarioParams
 * @property {number} epicenter_lat
 * @property {number} epicenter_lon
 * @property {number} magnitude
 */

/**
 * @typedef {Object} ScenarioMeta
 * @property {string} id
 * @property {string} label
 * @property {number} magnitude
 * @property {number[]} epicenter   - [lat, lon]
 * @property {string[]} affected_wilayas
 */

export const SCENARIOS = {
  boumerdes_2003: {
    id: 'boumerdes_2003',
    label: 'Boumerdès 2003 — M6.8',
    magnitude: 6.8,
    epicenter: [36.83, 3.65],
    affected_wilayas: ['35', '16', '15', '09', '42'],
  },
  el_asnam_1980: {
    id: 'el_asnam_1980',
    label: 'El Asnam 1980 — M7.3',
    magnitude: 7.3,
    epicenter: [36.14, 1.41],
    affected_wilayas: ['02', '14', '27', '38', '45'],
  },
}
