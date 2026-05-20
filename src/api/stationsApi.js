import { apiGet } from '../apiClient'

export function getStations() {
  return apiGet('/stations')
}

export function getPatientStationStatus(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/station-status`)
}

export function getPatientStationSummary(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/station-summary`)
}

export function getPatientStationEligibility(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/station-eligibility`)
}
