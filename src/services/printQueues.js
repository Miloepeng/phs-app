import {
  addDoctorPdfQueueEntry,
  deleteDoctorPdfQueueEntry,
  deleteFormAQueueEntry,
  getPrintedDoctorPdfQueue,
  getPrintedFormAQueue,
  getUnprintedDoctorPdfQueue,
  getUnprintedFormAQueue,
  markDoctorPdfPrinted,
  markFormAPrinted,
} from '../api/printQueuesApi'
import { isLoggedin } from './authSession'

export const getUnprintedDocPdfQueue = async () => {
  if (!isLoggedin()) return []
  const response = await getUnprintedDoctorPdfQueue()
  return response.data || []
}

export const getPrintedDocPdfQueue = async () => {
  if (!isLoggedin()) return []
  const response = await getPrintedDoctorPdfQueue()
  return response.data || []
}

export const addToDocPdfQueue = async (patientId, doctorName) => {
  if (!isLoggedin()) return false
  await addDoctorPdfQueueEntry(patientId, doctorName)
  return true
}

export const markDocPdfAsPrinted = async (docId) => {
  if (!isLoggedin()) return false
  await markDoctorPdfPrinted(docId)
  return true
}

export const deleteDocPdfFromQueue = async (docId) => {
  if (!isLoggedin()) return false
  await deleteDoctorPdfQueueEntry(docId)
  return true
}

export const getUnprintedFormAPdfQueue = async () => {
  if (!isLoggedin()) return []
  const response = await getUnprintedFormAQueue()
  return response.data || []
}

export const getPrintedFormAPdfQueue = async () => {
  if (!isLoggedin()) return []
  const response = await getPrintedFormAQueue()
  return response.data || []
}

export const markFormAAsPrinted = async (docId) => {
  if (!isLoggedin()) return false
  await markFormAPrinted(docId)
  return true
}

export const deleteFormAFromQueue = async (docId) => {
  if (!isLoggedin()) return false
  await deleteFormAQueueEntry(docId)
  return true
}
