import { apiGet } from '../apiClient'

export function getPatientStationStatus(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/station-status`)
}

export function getPatientStationEligibility(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/station-eligibility`)
}
