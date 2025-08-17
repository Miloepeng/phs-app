import allForms from '../forms/forms.json'
import { getSavedData, getSavedPatientData, updateStationCounts } from './mongoDB'

export const getEligibilityRows = (forms = {}) => {
  const {
    reg = {},
    pmhx = {},
    hxsocial = {},
    // hxfamily = {},
    hxgynae = {},
    triage = {},
    hcsr = {},
    hxoral = {},
    phq = {},
    hxm4m5 = {},
    ophthal = {},
  } = forms

  const createData = (name, isEligible) => ({
    name,
    eligibility: isEligible ? 'YES' : 'NO',
  })

  const isVaccinationEligible = reg?.registrationQ4 >= 65
  const isHealthierSGEligible = reg?.registrationQ11 !== 'Yes'
  const isLungFunctionEligible =
    reg?.registrationQ21 === 'Yes' &&
    hxsocial?.SOCIAL16 === 'Yes' &&
    (hxsocial?.SOCIAL10 === 'Yes' || hxsocial?.SOCIAL11 === 'Yes')
  const isWomenCancerEducationEligible = reg?.registrationQ5 === 'Female'
  const isPodiatryEligible = pmhx?.PMHX5?.includes('Diabetes/Pre-Diabetic')
  const isMentalHealthEligible =
    (phq?.PHQ10 >= 10 && reg?.registrationQ4 < 60) || phq?.PHQ11 === 'Yes'
  const isMammobusEligible = reg.registrationQ19 === 'Yes'
  const isHPVEligible =
    (hxgynae?.GYNAE12 === '5 years or longer' || hxgynae?.GYNAE12 === 'Never before') &&
    hxgynae?.GYNAE14 === 'Yes' &&
    hxgynae?.GYNAE15 === 'No' &&
    (hxgynae?.GYNAE13 === '3 years or longer' || hxgynae?.GYNAE13 === 'Never before') &&
    hxgynae?.GYNAE16 === 'Yes'
  const isAudiometryEligible = reg?.registrationQ4 >= 60 && hcsr?.hxHcsrQ5 === 'No'
  const isGeriatricScreeningEligible = reg?.registrationQ4 >= 60
  const isOphthalmologyEligible = reg?.registrationQ4 >= 60

  const isDoctorStationEligible =
    triage?.triageQ9 === 'Yes' ||
    hcsr?.hxHcsrQ7 === 'Yes' ||
    hcsr?.hxHcsrQ6 === 'Yes' ||
    pmhx?.PMHX7 === 'Yes' ||
    //phq?.PHQ9 !== '0 - Not at all'
    // NOTE^ this makes Doctor's Station Eligible with phq?.PHQ9 !== '0 - Not at all'
    phq?.PHQ10 >= 10 ||
    phq?.PHQ9 == '1 - Several days' ||
    phq?.PHQ9 == '2 - More than half the days' ||
    phq?.PHQ9 == '3 - Nearly everyday' ||
    hxm4m5?.hxM4M5Q1 === 'Yes' ||
    ophthal?.OphthalQ9?.includes("Referred to Doctor's Station")

  const isDietitianEligible = hxsocial?.SOCIAL15 === 'Yes'
  const isSocialServicesEligible =
    hxsocial?.SOCIAL6 === 'Yes' ||
    hxsocial?.SOCIAL7 === 'Yes' ||
    (hxsocial?.SOCIAL8 === 'Yes' && hxsocial?.SOCIAL9 === 'No') ||
    ophthal?.OphthalQ13 === 'Yes'

  const isDentalEligible =
    pmhx?.PMHX5?.includes('Diabetes/Pre-Diabetic') ||
    hxsocial?.SOCIAL10 === 'Yes' ||
    hxsocial?.SOCIAL11 === 'Yes' ||
    hxoral?.ORAL2 === 'Yes' ||
    hxoral?.ORAL1 === 'Poor'
  hxoral?.ORAL4 === 'No' || hxoral?.ORAL5 === 'Yes'

  return [
    createData('Healthier SG Booth', isHealthierSGEligible),
    createData('Lung Function Testing', isLungFunctionEligible),
    createData("Women's Cancer Education", isWomenCancerEducationEligible),
    createData('Podiatry', isPodiatryEligible),
    createData("Dietitian's Consult", isDietitianEligible),
    createData('Geriatric Screening', isGeriatricScreeningEligible),
    createData('Ophthalmology', isOphthalmologyEligible),
    createData('Oral Health', isDentalEligible),
    createData('Social Services', isSocialServicesEligible),
    createData('Mental Health', isMentalHealthEligible),
    createData('Mammobus', isMammobusEligible),
    createData('HPV On-Site Testing', isHPVEligible),
    createData('Audiometry', isAudiometryEligible),
    createData('Vaccination', isVaccinationEligible),
    createData("Doctor's Station", isDoctorStationEligible),
  ]
}

// groups station keys which are counted as one logical station
export function computeVisitedStationsCount(record) {
  const stationFormMap = {
    hsg: ['hsgForm'],
    lungfn: ['lungFnForm'],
    wce: ['wceForm', 'gynaeForm'],
    podiatry: ['podiatryForm'],
    dietitiansconsult: ['dietitiansConsultForm'],
    geriscreening: [
      'geriAmtForm',
      'geriGraceForm',
      'geriWhForm',
      'geriInterForm',
      'geriPhysicalActivityLevelForm',
      'geriOtQuestionnaireForm',
      'geriSppbForm',
      'geriPtConsultForm',
      'geriOtConsultForm',
    ],
    ophthalmology: ['ophthalForm'],
    oralhealth: ['oralHealthForm'],
    socialservice: ['socialServiceForm'],
    mentalhealth: ['mentalHealthForm'],
    mammobus: ['mammobusForm'],
    hpv: ['hpvForm'],
    geriaudio: ['geriAudiometryForm'],
    vax: ['vaccineForm'],
    doctorsconsult: ['doctorConsultForm'],
  }

  let visitedCount = 0

  for (const [stationKeys, formKeys] of Object.entries(stationFormMap)) {
    console.log(stationKeys)
    const allFilled = formKeys.every((formKey) => {
      const form = record[formKey]
      return form != undefined
    })

    if (allFilled) {
      visitedCount++
    }
  }
  return visitedCount
}

// compute and update visited and eligible station counts
export const updateAllStationCounts = async (patientId) => {
  // fetch patient record (used for visited station logic)
  const patient = await getSavedPatientData(patientId, 'patients')
  const visitedStationsCount = computeVisitedStationsCount(patient)

  // fetch all relevant forms for eligibility
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
  const eligibleStationsCount = rows.filter((r) => r.eligibility === 'YES').length

  const eligibleStations = getEligibleStationNames(formData)
  const visitedStations = getVisitedStationNames(patient)

  await updateStationCounts(
    patientId,
    visitedStationsCount,
    eligibleStationsCount,
    visitedStations,
    eligibleStations,
  )

  console.log('visited:', visitedStationsCount, 'eligible:', eligibleStationsCount)
  console.log('eligible stations:', eligibleStations)
  console.log('visited stations:', visitedStations)
}

export const getEligibleStationNames = (forms = {}) => {
  const eligibleStations = []
  const rows = getEligibilityRows(forms)

  rows.forEach((row) => {
    if (row.eligibility === 'YES') {
      eligibleStations.push(row.name)
    }
  })

  return eligibleStations
}

export const getVisitedStationNames = (record) => {
  const visitedStations = []
  const stationFormMap = {
    'Healthier SG Booth': ['hsgForm'],
    'Lung Function Testing': ['lungFnForm'],
    "Women's Cancer Education": ['wceForm', 'gynaeForm'],
    Podiatry: ['podiatryForm'],
    "Dietitian's Consult": ['dietitiansConsultForm'],
    'Geriatric Screening': [
      'geriAmtForm',
      'geriGraceForm',
      'geriWhForm',
      'geriInterForm',
      'geriPhysicalActivityLevelForm',
      'geriOtQuestionnaireForm',
      'geriSppbForm',
      'geriPtConsultForm',
      'geriOtConsultForm',
    ],
    Ophthalmology: ['ophthalForm'],
    'Oral Health': ['oralHealthForm'],
    'Social Services': ['socialServiceForm'],
    'Mental Health': ['mentalHealthForm'],
    Mammobus: ['mammobusForm'],
    'HPV On-Site Testing': ['hpvForm'],
    Audiometry: ['geriAudiometryForm'],
    Vaccination: ['vaccineForm'],
    "Doctor's Station": ['doctorConsultForm'],
  }

  for (const [stationName, formKeys] of Object.entries(stationFormMap)) {
    const allFilled = formKeys.every((formKey) => {
      return record[formKey] !== undefined
    })

    if (allFilled) {
      visitedStations.push(stationName)
    }
  }

  return visitedStations
}
