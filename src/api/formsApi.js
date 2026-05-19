import { apiGet, apiPost } from '../apiClient'

export function getFormsRegistry() {
  return apiGet('/forms/registry')
}

export function getPatientForm(patientId, formKey) {
  return apiGet(
    `/patients/${encodeURIComponent(patientId)}/forms/${encodeURIComponent(formKey)}`,
  )
}

export function submitPatientForm(patientId, formKey, data) {
  return apiPost(
    `/patients/${encodeURIComponent(patientId)}/forms/${encodeURIComponent(formKey)}`,
    { data },
  )
}
