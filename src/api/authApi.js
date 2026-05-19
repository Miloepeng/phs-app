import { apiPost } from '../apiClient'

export function login(email, password, type) {
  return apiPost('/handleLogin', { email, password, type })
}

export function signup(email, password) {
  return apiPost('/handleSignup', { email, password })
}

export function deleteAccount(username) {
  return apiPost('/deleteAccount', { username })
}

export function resetPassword(username, newPassword) {
  return apiPost('/resetPassword', { username, newPassword })
}
