import { recalculatePatientStationCounts } from '../api/stationsApi'

export const updateAllStationCounts = async (patientId) => {
  try {
    const recalculated = await recalculatePatientStationCounts(patientId)
    const data = recalculated.data || {}
    console.log('visited:', data.visitedStationCount, 'eligible:', data.eligibleStationCount)
    console.log('eligible stations:', data.eligibleStations || [])
    console.log('visited stations:', data.visitedStations || [])
    return data
  } catch (error) {
    console.error('Failed to recalculate station counts via backend:', error)
    return {
      visitedStationCount: 0,
      eligibleStationCount: 0,
      visitedStations: [],
      eligibleStations: [],
    }
  }
}
