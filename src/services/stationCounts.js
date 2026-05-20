import allForms from '../forms/forms.json'
import { getPatientStationSummary, recalculatePatientStationCounts } from '../api/stationsApi'
import { getSavedData, getSavedPatientData, updateStationCounts } from './mongoDB'
import {
  getEligibilityRows,
  getEligibleStationNames,
  getVisitedStationNames,
} from './stationFallbacks'

async function updateAllStationCountsFallback(patientId) {
  const patient = await getSavedPatientData(patientId, 'patients')
  let eligibleStations = []
  let eligibleStationsCount = 0
  let visitedStations = []
  let usedBackendEligibility = false
  let usedBackendSummary = false

  try {
    const summary = await getPatientStationSummary(patientId)
    eligibleStations = summary.data?.eligibleStations || []
    eligibleStationsCount = summary.data?.eligibleStationCount ?? eligibleStations.length
    visitedStations = summary.data?.visitedStations || []
    usedBackendEligibility = true
    usedBackendSummary = true
  } catch {
    usedBackendEligibility = false
  }

  if (!usedBackendEligibility) {
    const [
      pmhx,
      hxsocial,
      reg,
      hxfamily,
      triage,
      hcsr,
      hxoral,
      wce,
      phq,
      hxm4m5,
      hxgynae,
      ophthal,
    ] = await Promise.all([
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

    const formData = {
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
    }

    const rows = getEligibilityRows(formData)
    eligibleStationsCount = rows.filter((r) => r.eligibility === 'YES').length
    eligibleStations = getEligibleStationNames(formData)
  }

  if (!usedBackendSummary) {
    visitedStations = getVisitedStationNames(patient)
  }

  await updateStationCounts(
    patientId,
    visitedStations.length,
    eligibleStationsCount,
    visitedStations,
    eligibleStations,
  )

  return {
    visitedStationCount: visitedStations.length,
    eligibleStationCount: eligibleStationsCount,
    visitedStations,
    eligibleStations,
  }
}

// Prefer backend station recalculation. The client fallback exists only for migration resilience.
export const updateAllStationCounts = async (patientId) => {
  try {
    const recalculated = await recalculatePatientStationCounts(patientId)
    const data = recalculated.data || {}
    console.log('visited:', data.visitedStationCount, 'eligible:', data.eligibleStationCount)
    console.log('eligible stations:', data.eligibleStations || [])
    console.log('visited stations:', data.visitedStations || [])
    return data
  } catch {
    const data = await updateAllStationCountsFallback(patientId)
    console.log('visited:', data.visitedStationCount, 'eligible:', data.eligibleStationCount)
    console.log('eligible stations:', data.eligibleStations)
    console.log('visited stations:', data.visitedStations)
    return data
  }
}
