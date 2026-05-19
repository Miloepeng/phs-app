import allForms from '../forms/forms.json'
import { getPatientStationEligibility } from '../api/stationsApi'
import { getSavedData } from './mongoDB'
import { getEligibilityRows } from './stationCounts'

async function getFrontendEligibilityRows(patientId) {
  const [pmhx, hxsocial, reg, hxfamily, triage, hcsr, hxoral, wce, phq, hxm4m5, hxgynae, ophthal] =
    await Promise.all([
      getSavedData(patientId, allForms.hxNssForm),
      getSavedData(patientId, allForms.hxSocialForm),
      getSavedData(patientId, allForms.registrationForm),
      getSavedData(patientId, allForms.hxFamilyForm),
      getSavedData(patientId, allForms.triageForm),
      getSavedData(patientId, allForms.hxHcsrForm),
      getSavedData(patientId, allForms.hxOralForm),
      getSavedData(patientId, allForms.wceForm),
      getSavedData(patientId, allForms.geriPhqForm),
      getSavedData(patientId, allForms.hxM4M5ReviewForm),
      getSavedData(patientId, allForms.hxGynaeForm),
      getSavedData(patientId, allForms.ophthalForm),
    ])

  return getEligibilityRows({
    reg: reg || {},
    pmhx: pmhx || {},
    hxsocial: hxsocial || {},
    hxfamily: hxfamily || {},
    triage: triage || {},
    hcsr: hcsr || {},
    hxoral: hxoral || {},
    wce: wce || {},
    phq: phq || {},
    hxm4m5: hxm4m5 || {},
    hxgynae: hxgynae || {},
    ophthal: ophthal || {},
  })
}

function compareRows(frontendRows, backendRows) {
  const backendByName = new Map(backendRows.map((row) => [row.name, row.eligibility]))
  const frontendByName = new Map(frontendRows.map((row) => [row.name, row.eligibility]))
  const names = new Set([...frontendByName.keys(), ...backendByName.keys()])

  return Array.from(names)
    .map((name) => ({
      name,
      frontend: frontendByName.get(name),
      backend: backendByName.get(name),
    }))
    .filter((row) => row.frontend !== row.backend)
}

function summarizeRows(rows) {
  return rows
    .filter((row) => row.eligibility === 'YES')
    .map((row) => row.name)
}

export async function compareStationEligibility(patientId) {
  const [frontendRows, backend] = await Promise.all([
    getFrontendEligibilityRows(patientId),
    getPatientStationEligibility(patientId),
  ])
  const backendRows = backend.data?.rows || []
  const differences = compareRows(frontendRows, backendRows)

  return {
    patientId,
    matches: differences.length === 0,
    frontendRows,
    backendRows,
    frontendEligibleStations: summarizeRows(frontendRows),
    backendEligibleStations: summarizeRows(backendRows),
    differences,
  }
}
