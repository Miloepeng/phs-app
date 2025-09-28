import * as Realm from 'realm-web'
import { apiGet, apiPost, apiPatch, apiDelete } from '../apiClient'

const REALM_APP_ID = import.meta.env.VITE_MONGO_KEY
// contact developer for .env file for key
const app = new Realm.App({ id: REALM_APP_ID })

export default app

export const getName = (profile) => {
  // admins have email, guests have name
  if (!profile) return '';
  return profile.name === undefined ? profile.email : profile.name;
}

// export const isLoggedin = () => {
//   return app.currentUser !== null && app.currentUser.accessToken
// }

export const isLoggedin = () => {
  const token = localStorage.getItem('authToken');
  return !!token; // Check if token exists
}

// export const logOut = () => {
//   return app.currentUser.logOut()
// }

export const logOut = async () => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('profile');

  } catch (error) {
    console.error('Error logging out:', error)
  }
}

// export const guestUserCount = async () => {
//   const query = await app.currentUser
//     .mongoClient('mongodb-atlas')
//     .db('phs')
//     .collection('profiles')
//     .count({ is_admin: null })
//   return query
// }

export const guestUserCount = async (collection = 'profiles') => {
  try {
    const data = await apiGet(`/guestUserCount?collection=${encodeURIComponent(collection)}`)
    return data.count || 0
  } catch (error) {
    console.error('Error fetching guest user count:', error)
    return 0
  }
}

export const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const encodePassword = encoder.encode(password)
  const hashPassword = await crypto.subtle.digest('SHA-256', encodePassword)
  const hashArray = Array.from(new Uint8Array(hashPassword))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// export const profilesCollection = () => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const userProfile = mongoConnection.db('phs').collection('profiles')
//   return userProfile
// }

export const profilesCollection = async (collection = 'profiles') => {
  if (!isLoggedin()) return null
  try {
    const res = await apiGet(`/getCollection?collection=${encodeURIComponent(collection)}`)
    return res.data || []
  } catch {
    return null
  }
}

// export const getQueueCollection = () => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const queue = mongoConnection.db('phs').collection('queue')
//   return queue
// }

export const getQueueCollection = async (collection = 'queue') => {
  try {
    const res = await apiGet(`/getCollection?collection=${encodeURIComponent(collection)}`)
    return res.data || []
  } catch {
    return null
  }
}

// export const getProfile = async () => {
//   if (isLoggedin()) {
//     const profile = await app.currentUser
//       .mongoClient('mongodb-atlas')
//       .db('phs')
//       .collection('profiles')
//       .findOne({ username: getName() })
//     return profile
//   }

//   return null
// }

export const getProfile = async () => {
  if (!isLoggedin()) return null;
  try {
    const data = await apiGet('/profile');
    return data.user;
  } catch {
    return null;
  }
};

// export const isAdmin = async () => {
//   // admins have email, guests do not
//   if (isLoggedin()) {
//     return app.currentUser.profile.email !== undefined
//   }
//   return false
// }

export const isAdmin = async (email) => {
  const p = await getProfile()
  return !!p?.is_admin
}


// export const isValidQueueNo = async (queueNo) => {
//     const mongoConnection = app.currentUser.mongoClient("mongodb-atlas");
//     const patientsRecord = mongoConnection.db("phs").collection("patients");
//     const record = await patientsRecord.findOne({queueNo});
//     return record !== null;
// }

// export const getAllPatientNames = async (collectionName) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const data = await mongoConnection
//     .db('phs')
//     .collection(collectionName)
//     .find({}, { projection: { initials: 1, _id: 0 } })
//   return data === null ? {} : data
// }

export const getAllPatientNames = async (collectionName) => {
  try {
    const res = await apiGet(`/patientNames?collection=${encodeURIComponent(collectionName)}`)
    return res.data || []
  } catch {
    return []
  }
}
// export const getSavedData = async (patientId, collectionName) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const savedData = await mongoConnection
//     .db('phs')
//     .collection(collectionName)
//     .findOne({ _id: patientId })
//   return savedData === null ? {} : savedData
// }

export const getSavedData = async (patientId, collectionName) => {
  try {
    const res = await apiGet(
      `/savedData?patientId=${encodeURIComponent(patientId)}&collectionName=${encodeURIComponent(collectionName)}`
    )
    return res.data || {}
  } catch {
    return {}
  }
}

export const getPreRegDataById = async (patientId, collectionName) => {
  try {
    const res = await apiGet(`/patients/${patientId}?collection=${encodeURIComponent(collectionName)}`)
    return res.data || {}
  } catch {
    return {}
  }
}

// export const getPreRegDataByName = async (patientName, collectionName) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const savedData = await mongoConnection
//     .db('phs')
//     .collection(collectionName)
//     .findOne({ initials: patientName })
//   return savedData === null ? {} : savedData
// }

/**
 * TODO for 2026 Devs: THIS IS A KNOWN BUG.
 * Searching for patients by name does not return the correct list/patients while volunteer is typing in the patient name
 * High priority bug as volunteers find it easier to search by name than queue number
 */
export const getPreRegDataByName = async (initials, collection) => {
  if (!isLoggedin()) return {}
  try {
    const res = await apiGet(
      `/patients/by-initials/${encodeURIComponent(initials)}?collection=${encodeURIComponent(collection)}`
    )
    return res.data || {}
  } catch {
    return {}
  }
}

// export const getSavedPatientData = async (patientId, collectionName) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const savedData = await mongoConnection
//     .db('phs')
//     .collection(collectionName)
//     .findOne({ queueNo: patientId })
//   return savedData === null ? {} : savedData
// }

export const getSavedPatientData = async (patientId, collectionName) => {
  try {
    const res = await apiGet(
      `/patientSavedData?patientId=${encodeURIComponent(patientId)}&collectionName=${encodeURIComponent(collectionName)}`
    )
    return res.data || {}
  } catch {
    return {}
  }
}

// export const getClinicSlotsCollection = () => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   const phlebCounters = mongoConnection.db('phs').collection('queueCounters')
//   return phlebCounters
// }

export const getClinicSlotsCollection = async (collection = 'queueCounters') => {
  try {
    const data = await apiGet(`/getCollection?collection=${encodeURIComponent(collection)}`);
    return data.data || [];
  } catch {
    return [];
  }
};


// export const updatePhlebotomyCounter = async (seq) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   await mongoConnection
//     .db('phs')
//     .collection('queueCounters')
//     .updateOne({ _id: 'phlebotomyQ3' }, { $set: { seq } })
//   return
// }

export const updatePhlebotomyCounter = async (seq) => {
  if (!isLoggedin()) return false
  try {
    await apiPost('/updatePhlebotomyCounter', { seq })
    return true
  } catch {
    return false
  }
}

// export const updateStationCounts = async (
//   patientId,
//   visitedStationsCount,
//   eligibleStationsCount,
//   visitedStations = [],
//   eligibleStations = [],
// ) => {
//   const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
//   await mongoConnection.db('phs').collection('patients').updateOne(
//     { queueNo: patientId },
//     {
//       $set: {
//         visitedStationsCount,
//         eligibleStationsCount,
//         visitedStations,
//         eligibleStations,
//       },
//     },
//   )
// }

export const updateStationCounts = async (
  patientId,
  visitedStationsCount,
  eligibleStationsCount,
  visitedStations = [],
  eligibleStations = []
) => {
  try {
    // Match backend field names exactly:
    await apiPost(`/updateStationCount`, {
      patientId,
      visitedStationCount: visitedStationsCount,
      eligibleStationCount: eligibleStationsCount,
      visitedStation: visitedStations,
      eligibleStation: eligibleStations,
    })
    return true
  } catch (error) {
    console.error('Error updating station counts:', error)
    return false
  }
}

export const getDocPdfQueueCollection = () => {
  const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
  return mongoConnection.db('phs').collection('docPdfQueue')
}

// Get unprinted documents from docPdfQueue
export const getUnprintedDocPdfQueue = async () => {
  if (!isLoggedin()) return [];
  try {
    const response = await apiGet('/docPdfQueue');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching unprinted doc queue:', error);
    return [];
  }
};

// Get printed documents from docPdfQueue
export const getPrintedDocPdfQueue = async () => {
  if (!isLoggedin()) return [];
  try {
    const response = await apiGet('/docPdfQueue/printed');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching printed doc queue:', error);
    return [];
  }
};

// Mark document in docPdfQueue as printed
export const markDocPdfAsPrinted = async (docId) => {
  if (!isLoggedin()) return false;
  try {
    await apiPatch(`/docPdfQueue/${docId}`, {});
    return true;
  } catch (error) {
    console.error('Error marking document as printed:', error);
    return false;
  }
};

// Delete document from docPdfQueue
export const deleteDocPdfFromQueue = async (docId) => {
  if (!isLoggedin()) return false;
  try {
    await apiDelete(`/docPdfQueue/${docId}`);
    return true;
  } catch (error) {
    console.error('Error deleting document from queue:', error);
    return false;
  }
};

export const getFormAPdfQueueCollection = () => {
  const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
  return mongoConnection.db('phs').collection('formAPdfQueue')
}

export const addToFormAQueue = async (patientId) => {
  const mongoConnection = app.currentUser.mongoClient('mongodb-atlas')
  const queue = mongoConnection.db('phs').collection('formAPdfQueue')

  await queue.insertOne({
    patientId: patientId,
    printed: false,
    createdAt: new Date(),
  })


}
