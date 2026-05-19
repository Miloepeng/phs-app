import { apiGet, apiPost } from '../apiClient'

export function createPatient(payload) {
  return apiPost('/patients', payload)
}

export function getPatient(patientId) {
  return apiGet(`/patients/${encodeURIComponent(patientId)}`)
}

export function getPatientNames() {
  return apiGet('/patients/names')
}

export function searchPatientsByInitials(initials) {
  return apiGet(`/patients/search?initials=${encodeURIComponent(initials)}`)
}
