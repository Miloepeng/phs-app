import mongoDB, { getName, isAdmin } from '../services/mongoDB'

import { bloodpressureQR, bmiQR, tempQR } from 'src/icons/QRCodes'
import updatedLogo from 'src/icons/UpdatedIcon'

import pdfMake from '../reports/pdfMake'
import { updateAllStationCounts } from '../services/stationCounts'
import { normalizeLangName, parseFromLangKey, setLangUpdated } from './langutil'

import { addToFormAQueue, getSavedData, getSavedPatientData } from '../services/mongoDB'

import { generateStatusObject } from 'src/components/dashboard/PatientTimeline'

import { createPatient } from './patientsApi'
import { submitPatientForm } from './formsApi'
import { toFormKey } from '../forms/formKeys'
export { generateDoctorPdf } from '../reports/doctorPdf'
export { generateFormAPdf } from '../reports/formAPdf'
export {
  addBmi,
  addBloodPressure,
  addFollowUp,
  addMemos,
  addOtherScreeningModularities,
  addRecommendation,
  calculateY,
  followUpWith,
  generate_pdf,
  kNewlines,
  patient,
} from '../reports/patientReportPdf'

// export async function preRegister(preRegArgs) {
//   let gender = preRegArgs.gender
//   let initials = preRegArgs.initials.trim()
//   let age = preRegArgs.age
//   let preferredLanguage = preRegArgs.preferredLanguage.trim()
//   let goingForPhlebotomy = preRegArgs.goingForPhlebotomy
//   // validate params
//   if (
//     gender == null ||
//     initials == null ||
//     age == null ||
//     preferredLanguage == null ||
//     goingForPhlebotomy == null
//   ) {
//     return { result: false, error: 'Function Arguments canot be undefined.' }
//   }
//   if (
//     typeof goingForPhlebotomy === 'string' &&
//     goingForPhlebotomy !== 'Y' &&
//     goingForPhlebotomy !== 'N'
//   ) {
//     return { result: false, error: 'The value of goingForPhlebotomy must either be "T" or "F"' }
//   }
//   // TODO: more exhaustive error handling. consider abstracting it in a validation function, and using schema validation
//   let data = {
//     gender: gender,
//     initials: initials,
//     age: age,
//     preferredLanguage: preferredLanguage,
//     goingForPhlebotomy: goingForPhlebotomy,
//   }
//   let isSuccess = false
//   let errorMsg = ''
//   try {
//     const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas')
//     const patientsRecord = mongoConnection.db('phs').collection('patients')
//     const qNum = await mongoDB.currentUser.functions.getNextQueueNo()
//     await patientsRecord.insertOne({ queueNo: qNum, ...data })
//     data = { patientId: qNum, ...data }
//     isSuccess = true
//   } catch (err) {
//     // TODO: more granular error handling
//     return { result: false, error: err }
//   }
//   return { result: isSuccess, data: data, error: errorMsg }
// }

// export async function submitForm(args, patientId, formCollection) {
//   try {
//     const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas')
//     const patientsRecord = mongoConnection.db('phs').collection('patients')
//     const registrationForms = mongoConnection.db('phs').collection(formCollection)
//     const record2 = await patientsRecord.findOne({ queueNo: patientId })

//     let qNum = 0

//     let gender = args.registrationQ5
//     let initials = args.registrationQ2
//     let age = args.registrationQ4
//     let preferredLanguage = args.registrationQ14
//     let goingForPhlebotomy = args.registrationQ15

//     let data = {
//       gender: gender,
//       initials: initials,
//       age: age,
//       preferredLanguage: preferredLanguage,
//       goingForPhlebotomy: goingForPhlebotomy,
//     }

//     console.log('patient id: ' + record2)

//     if (record2 == null) {
//       qNum = await mongoDB.currentUser.functions.getNextQueueNo()
//       await patientsRecord.insertOne({ queueNo: qNum, ...data })
//       patientId = qNum
//     }

//     const record = await patientsRecord.findOne({ queueNo: patientId })

//     if (record) {
//       // Adds a key-value pair for each form submitted for the first time to the patient's document in the patients collection
//       // in MongoDB to track which forms have been successfully submitted
//       if (record[formCollection] === undefined) {
//         await patientsRecord.updateOne(
//           { queueNo: patientId },
//           { $set: { [formCollection]: patientId } },
//         )

//         await registrationForms.insertOne({ _id: patientId, ...args })

//         await updateAllStationCounts(patientId)

//         await updateGeriGraceEligibility(args, patientId, formCollection)

//         return { result: true, data: data, qNum: patientId }
//       } else {
//         if (await isAdmin()) {
//           args.lastEdited = new Date()
//           args.lastEditedBy = getName()
//           await registrationForms.updateOne({ _id: patientId }, { $set: { ...args } })
//           if (formCollection == 'registrationForm') {
//             await patientsRecord.updateOne(
//               { queueNo: patientId },
//               { $set: { initials: args.registrationQ2 } },
//             )
//             await patientsRecord.updateOne(
//               { queueNo: patientId },
//               { $set: { age: args.registrationQ4 } },
//             )
//           }
//           await updateAllStationCounts(patientId)
//           await updateGeriGraceEligibility(args, patientId, formCollection, patientsRecord)
//           // replace form
//           // registrationForms.findOneAndReplace({_id: record[formCollection]}, args);
//           // throw error message
//           // const errorMsg = "This form has already been submitted. If you need to make "
//           //         + "any changes, please contact the admin."
//           return { result: true, data: data, qNum: patientId }
//         } else {
//           const errorMsg =
//             'This form has already been submitted. If you need to make ' +
//             'any changes, please contact the admin.'
//           return { result: false, error: errorMsg }
//         }
//       }
//     } else {
//       // TODO: throw error, not possible that no document is found
//       // unless malicious user tries to change link to directly access reg page
//       // Can check in every form page if there is valid patientId instead
//       // cannot use useEffect since the form component is class component
//       const errorMsg = 'An error has occurred.'
//       console.log('There is an error here')
//       // You will be directed to the registration page." logic not done
//       return { result: false, error: errorMsg }
//     }
//   } catch (err) {
//     return { result: false, error: err }
//   }
// }

export async function submitForm(args, patientId, formCollection) {
  try {
    // Registers the patient in the patients collection if they do not exist yet
    let effectiveId = patientId
    let patientData = {}

    if (effectiveId === -1 || effectiveId == null) {
      const payload = {
        gender: args.registrationQ5,
        initials: (args.registrationQ2 || '').trim(),
        age: Number(args.registrationQ4 ?? 0),
        preferredLanguage: (args.registrationQ14 || '').trim(),
      }
      const created = await createPatient(payload)
      if (!created?.result) return { result: false, error: 'Failed to create patient' }
      effectiveId = created.data.queueNo
      patientData = payload
    } else {
      patientData = {
        gender: args.registrationQ5,
        initials: args.registrationQ2,
        age: args.registrationQ4,
        preferredLanguage: args.registrationQ14,
      }
    }

    // Upsert form data
    const upsert = await submitPatientForm(effectiveId, toFormKey(formCollection), args)
    if (!upsert?.result) return { result: false, error: 'Failed to save form' }

    // Return same shape expected by frontend logic
    return {
      result: true,
      data: patientData,
      qNum: effectiveId,
    }
  } catch (err) {
    return { result: false, error: err.message || String(err) }
  }
}

// UNUSED IN 2025, not sure what is the purpose of this
export async function submitPreRegForm(args, patientId, formCollection) {
  try {
    const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas')
    const patientsRecord = mongoConnection.db('phs').collection(formCollection)
    const record = await patientsRecord.findOne({ queueNo: patientId })
    if (record) {
      if (await isAdmin()) {
        args.lastEdited = new Date()
        args.lastEditedBy = getName()
        await patientsRecord.updateOne({ queueNo: patientId }, { $set: { ...args } })
        return { result: true, data: args }
      } else {
        const errorMsg =
          'This form has already been submitted. If you need to make ' +
          'any changes, please contact the admin.'
        return { result: false, error: errorMsg }
      }
    } else {
      const errorMsg = 'An error has occurred.'
      return { result: false, error: errorMsg }
    }
  } catch (e) {
    return { result: false, error: e }
  }
}

// Calcuates the BMI
export function formatBmi(heightInCm, weightInKg) {
  const bmi = calculateBMI(heightInCm, weightInKg)

  if (bmi > 27.5) {
    return (
      <p className='summary--red-text'>
        {bmi}
        <br />
        BMI is obese
      </p>
    )
  } else if (bmi >= 23.0) {
    return (
      <p className='summary--red-text'>
        {bmi}
        <br />
        BMI is overweight
      </p>
    )
  } else if (bmi < 18.5) {
    return (
      <p className='summary--red-text'>
        {bmi}
        <br />
        BMI is underweight
      </p>
    )
  } else {
    return <p className='summary--blue-text'>{bmi}</p>
  }
}

export function calculateBMI(heightInCm, weightInKg) {
  const height = heightInCm / 100
  const bmi = (weightInKg / height / height).toFixed(1)

  return bmi
}

// Formats the response for the geri vision section
export const formatGeriVision = (acuityString, questionNo) => {
  const acuity = parseInt(acuityString)
  if (acuity >= 6) {
    return <p className='summary--red-text'>{parseGeriVision(acuity, questionNo)}</p>
  }
  if (questionNo === 6) {
    return <p className='summary--red-text'>{parseGeriVision(acuity, questionNo)}</p>
  }
  return <p className='summary--blue-text'>{parseGeriVision(acuity, questionNo)}</p>
}
export function parseGeriVision(acuity, questionNo) {
  var result
  var additionalInfo

  switch (questionNo) {
    case 3:
    case 4:
      if (acuity >= 6) {
        additionalInfo = '\nSee VA with pinhole'
        result = 'Visual acuity (w/o pinhole occluder) - Right Eye 6/' + acuity + additionalInfo
      } else {
        result = 'Visual acuity (w/o pinhole occluder) - Left Eye 6/' + acuity
      }
      return result
    case 5:
    case 6:
      if (acuity >= 6) {
        result = 'Visual acuity (with pinhole occluder) - Right Eye 6/' + acuity
        additionalInfo = '\nNon-refractive error, participant should have consulted on-site doctor'
      } else {
        result = 'Visual acuity (with pinhole occluder) - Left Eye 6/' + acuity
        additionalInfo =
          '\nRefractive error, participant can opt to apply for Senior Mobility Fund (SMF)'
      }
      result = result + additionalInfo
      return result
  }
}

export const formatWceStation = (gender, question, answer) => {
  if (gender == 'Male' || gender == 'Not Applicable') {
    return '-'
  }
  return (
    <div>
      <p className='summary--blue-text'>{parseWceStation(question, answer).result}</p>
      <p className='summary--red-text'>{parseWceStation(question, answer).additionalInfo}</p>
    </div>
  )
}
export function parseWceStation(question, answer) {
  var result = { result: answer, additionalInfo: null }
  var additionalInfo
  switch (question) {
    case 2:
    case 3:
      additionalInfo =
        'If participant is interested in WCE, check whether they have' +
        'completed the station. Referring to the responses below, please check with them if the relevant appointments have been made based on their indicated interests.'
      break
    case 4:
      if (answer == 'Yes') {
        additionalInfo = 'Kindly remind participant that SCS will be contacting them.'
      }
      break
    case 5:
      if (answer == 'Yes') {
        additionalInfo = 'Kindly remind participant that SCS will be contacting them.'
      }
      break
    case 6:
      if (answer == 'Yes') {
        additionalInfo = 'Kindly remind participant that NHGD will be contacting them.'
      }
      break
  }
  result.additionalInfo = additionalInfo

  return result
}

export function calculateSppbScore(q2, q6, q8) {
  let score = 0
  if (q2 !== undefined) {
    score += parseInt(q2.slice(0))
  }
  if (q6 !== undefined) {
    const num = parseInt(q6.slice(0))
    if (!Number.isNaN(num)) {
      score += num
    }
  }
  if (q8 !== undefined) {
    score += parseInt(q8.slice(0))
  }
  return score
}

export const regexPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/

// export const deleteFromAllDatabase = async () => {
//   const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas')
//   const mongoDBConnection = mongoConnection.db('phs')

// console.log(await mongoDBConnection.collection("patients").deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriPtConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.dietitiansConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.doctorConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.fitForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriAmtForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriEbasDepForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriFrailScaleForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriGeriApptForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriOtConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriOtQuestionnaireForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriParQForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriMmseForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriPhysicalActivityLevelForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriAudiometryForm).deleteMany({}))
// console.log("half")
// console.log(await mongoDBConnection.collection(forms.geriSppbForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.phlebotomyForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriTugForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriVisionForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxCancerForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxHcsrForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxNssForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxSocialForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.phleboForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.registrationForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.oralHealthForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.socialServiceForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.wceForm).deleteMany({}))
// console.log('done')
// deletes volunteer accounts
// console.log(await mongoDBConnection.collection("profiles").deleteMany({is_admin:{$eq : undefined}}))

export function generate_pdf_updated(
  reg,
  patients,
  cancer,
  phlebotomy,
  fit,
  wce,
  doctorSConsult,
  socialService,
  geriMmse,
  geriVision,
  geriAudiometry,
  dietitiansConsult,
  oralHealth,
  triage,
  vaccine,
  lung,
  nkf,
  hsg,
  grace,
  hearts,
  geriPtConsult,
  geriOtConsult,
  mental,
  social,
  podiatry,
  mammobus,
  hpv,
) {
  console.log('TRIAGE', triage)
  const language = normalizeLangName(reg?.registrationQ14)
  const reportFont =
    language === 'tamil' ? 'NotoTamil' : language === 'mandarin' ? 'PingFangSC' : 'Roboto'

  setLangUpdated(language)
  let content = []

  content.push(...patientSection(reg, patients))
  content.push(...temperatureSection(triage))
  content.push(...bloodPressureSection(triage))
  content.push(...bmiSection(triage.triageQ10, triage.triageQ11, triage.triageQ12))
  content.push(...otherScreeningModularitiesSection(reg, geriVision, podiatry, vaccine))
  //content.push({ text: '', pageBreak: 'before' })
  content.push(
    ...followUpSection(
      reg,
      vaccine,
      hsg,
      lung,
      phlebotomy,
      fit,
      wce,
      nkf,
      grace,
      hearts,
      oralHealth,
      mental,
      mammobus,
      hpv,
      socialService,
    ),
  )
  content.push(
    ...memoSection(geriAudiometry, dietitiansConsult, geriPtConsult, geriOtConsult, doctorSConsult),
  )
  content.push(...recommendationSection())

  let fileName = 'Report.pdf'
  if (patients.initials) {
    fileName = patients.initials.split(' ').join('_') + '_Report.pdf'
  }

  pdfMake.fonts = {
    // download default Roboto font from cdnjs.com
    Roboto: {
      normal:
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
      bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
      italics:
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
      bolditalics:
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf',
    },

    NotoTamil: {
      normal: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansTamil-Regular.ttf',
      bold: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansTamil-Bold.ttf',
      italics: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansTamil-Regular.ttf',
      bolditalics:
        'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansTamil-Regular.ttf',
    },

    // example of usage fonts in collection
    PingFangSC: {
      normal: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansSC-Regular.ttf',
      bold: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansSC-Bold.ttf',
      italics: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansSC-Regular.ttf',
      bolditalics: 'https://cdn.jsdelivr.net/gh/choijiwonsoc/my-fonts@main/NotoSansSC-Regular.ttf',
    },
  }

  const docDefinition1 = {
    content: content,
    styles: {
      header: {
        font: reportFont,
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      subheader: {
        font: reportFont,
        fontSize: 13,
        bold: true,
        margin: [0, 3, 0, 3],
      },
      normal: {
        font: reportFont,
        fontSize: 10,
        margin: [0, 0, 0, 4],
      },
      italicSmall: {
        font: reportFont,
        italics: true,
        fontSize: 10,
      },
    },
    defaultStyle: {
      font: reportFont,
      fontSize: 11,
    },
    pageMargins: [40, 60, 40, 60],
  }

  pdfMake.createPdf(docDefinition1).download(fileName)
}

function patientSection(reg, patients) {
  const salutation = reg.registrationQ1 || 'Dear'

  const mainLogo = {
    image: updatedLogo,
    width: 150,
  }

  const title = [{ text: parseFromLangKey('title'), style: 'header' }]

  const thanksNote = [
    { text: `${parseFromLangKey('dear', salutation, reg.registrationQ2)}`, style: 'normal' },
    { text: `${parseFromLangKey('intro')}`, style: 'normal' },
  ]

  return [mainLogo, ...title, ...thanksNote]
}

export function temperatureSection(triage) {
  const textSection = [
    { text: `${parseFromLangKey('temp_title')}`, style: 'subheader' },
    {
      text: `${parseFromLangKey('temp_reading')} ${triage.triageQ14} °C.\n`,
      style: 'normal',
    },
    {
      text: `${parseFromLangKey('temp_tip')}`,
      style: 'normal',
    },
  ]

  const imageSection = [
    {
      image: tempQR,
      width: 60,
      margin: [0, 0, 0, 5],
    },
  ]

  return [
    {
      columns: [
        { width: '*', stack: textSection },
        { width: 'auto', stack: imageSection, alignment: 'right' },
      ],
      columnGap: 13,
      margin: [0, 10, 0, 10],
    },
  ]
}

export function bloodPressureSection(triage) {
  const textSection = [
    { text: parseFromLangKey('bp_title'), style: 'subheader' },
    {
      text: `${parseFromLangKey('bp_reading')} ${triage.triageQ7}/${triage.triageQ8} mmHg.\n`,
      style: 'normal',
    },
    { text: `${parseFromLangKey('bp_tip')}`, style: 'normal' },
  ]

  const imageSection = [
    {
      image: bloodpressureQR,
      width: 60,
      margin: [0, 0, 0, 5],
    },
    {
      text: 'https://www.healthhub.sg/a-z/diseases-and-conditions/understanding-blood-pressure-readings',
      style: 'italicSmall',
      fontSize: 7,
      color: 'blue',
      link: 'https://www.healthhub.sg/a-z/diseases-and-conditions/understanding-blood-pressure-readings',
    },
  ]

  return [
    {
      columns: [
        { width: '*', stack: textSection },
        { width: 'auto', stack: imageSection, alignment: 'right' },
      ],
      columnGap: 13,
      margin: [0, 10, 0, 10],
    },
  ]
}

export function bmiSection(height, weight, bmiString) {
  const bmi = calculateBMI(Number(height), Number(weight))

  const imageSection = [
    {
      image: bmiQR,
      width: 60,
      margin: [0, 0, 0, 5],
    },
    // {
    //   text: 'https://www.healthhub.sg/live-healthy/weight_putting_me_at_risk_of_health_problems',
    //   style: 'italicSmall',
    //   fontSize: 7,
    //   color: 'blue',
    //   link: 'https://www.healthhub.sg/live-healthy/weight_putting_me_at_risk_of_health_problems',
    // },
  ]

  return [
    { text: parseFromLangKey('bmi_title'), style: 'subheader' },
    {
      text: parseFromLangKey('bmi_reading', height, weight, bmiString),
      style: 'normal',
    },

    {
      columns: [
        {
          style: 'tableExample',
          margin: [0, 5, 0, 5],
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: parseFromLangKey('bmi_tbl_l_header'), style: 'tableHeader', bold: true },
                { text: parseFromLangKey('bmi_tbl_r_header'), style: 'tableHeader', bold: true },
              ],
              ['18.5 - 22.9', parseFromLangKey('bmi_tbl_low')],
              ['23.0 - 27.4', parseFromLangKey('bmi_tbl_mod')],
              ['27.5 - 32.4', parseFromLangKey('bmi_tbl_high')],
              ['32.5 - 37.4', parseFromLangKey('bmi_tbl_vhigh')],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => 'black',
            vLineColor: () => 'black',
          },
        },
        { width: 'auto', stack: imageSection, alignment: 'right' },
      ],
    },
    { text: '', margin: [0, 5] },
  ]
}

export function otherScreeningModularitiesSection(reg, eye, podiatry, vaccine) {
  return [
    { text: parseFromLangKey('other_title'), style: 'subheader' },
    { text: `${parseFromLangKey('other_eye')}\n`, style: 'normal' },
    ...(reg?.registrationQ4 >= 60
      ? [
          {
            columns: [
              {
                width: '70%',
                style: 'tableExample',
                margin: [0, 5, 0, 5],
                table: {
                  widths: ['*', '*', '*'],
                  body: [
                    [
                      { text: '', style: 'tableHeader' },
                      {
                        text: parseFromLangKey('other_eye_tbl_l_header'),
                        style: 'tableHeader',
                        bold: true,
                      },
                      {
                        text: parseFromLangKey('other_eye_tbl_r_header'),
                        style: 'tableHeader',
                        bold: true,
                      },
                    ],
                    [
                      parseFromLangKey('other_eye_tbl_t_row'),
                      `6/${eye.OphthalQ3}`,
                      `6/${eye.OphthalQ4}`,
                    ],
                    [
                      parseFromLangKey('other_eye_tbl_b_row'),
                      `6/${eye.OphthalQ5}`,
                      `6/${eye.OphthalQ6}`,
                    ],
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => 'black',
                  vLineColor: () => 'black',
                },
              },
              {
                width: '*', // takes remaining space
                text: '', // or you can add other content here or leave blank
              },
            ],
          },
          { text: '', margin: [0, 5] },
          { text: `${parseFromLangKey('other_eye_error')} ${eye.OphthalQ8}\n`, style: 'normal' },
        ]
      : []),
    { text: '', margin: [0, 5] },
    ...(podiatry?.podiatryQ1 === 'Yes'
      ? [{ text: `${parseFromLangKey('podiatry_screening_true')}\n`, style: 'normal' }]
      : []),
    ...(vaccine?.VAX1 === 'Yes'
      ? [{ text: `${parseFromLangKey('vaccine_1')}\n`, style: 'normal' }]
      : []),
    ...(vaccine?.VAX2 === 'Yes'
      ? [{ text: `${parseFromLangKey('vaccine_2')}\n`, style: 'normal', margin: [20, 0, 0, 0] }]
      : []),
    ...(vaccine?.VAX3 === 'Yes'
      ? [{ text: `${parseFromLangKey('vaccine_3')}\n`, style: 'normal', margin: [20, 0, 0, 20] }]
      : []),
  ]
}

export function followUpSection(
  reg,
  vaccine,
  hsg,
  lung,
  phlebotomy,
  fit,
  wce,
  nkf,
  grace,
  geriWhForm,
  oral,
  mental,
  mammobus,
  hpv,
  socialService,
) {
  let vaccineString = null
  if (vaccine.VAX1 == 'Yes') {
    vaccineString = `${parseFromLangKey('fw_vax', vaccine.VAX2)}\n`
  }

  let hsgString = null
  if (hsg.HSG1 == 'Yes, I signed up for HSG today') {
    hsgString = `${parseFromLangKey('fw_hsg')}\n`
  }

  let lungString = null
  if (lung.LUNG2 == 'Yes') {
    lungString = `${parseFromLangKey('fw_lung')}\n`
  }

  let mammobusString = null
  if (mammobus.mammobusQ1 == 'Yes') {
    mammobusString = `${parseFromLangKey('fw_mammobus')}\n`
  }

  let hpvString = null
  if (hpv.HPV1 == 'Yes') {
    hpvString = `${parseFromLangKey('fw_hpv')}\n`
  }

  let mentalString = null
  if (mental.SAMH2 == 'Yes') {
    mentalString = `${parseFromLangKey('fw_samh')}\n`
  }

  let graceString = null
  if (grace.GRACE2 == 'Yes') {
    graceString = `${parseFromLangKey('fw_grace', grace.GRACE3)}\n`
  }

  let whisperString = null
  if (geriWhForm.WH1 == 'Yes') {
    whisperString = `${parseFromLangKey('fw_wh')}\n`
  }

  let aicString = null
  if (socialService.socialServiceQ4 == 'Yes') {
    aicString = `${parseFromLangKey('fw_aic')}\n`
  }

  let oralString = null
  if (oral.DENT4 == 'Yes') {
    oralString = `${parseFromLangKey('fw_dent')}\n`
  }

  return [
    { text: parseFromLangKey('fw_title'), style: 'subheader' },
    { text: parseFromLangKey('fw_intro'), style: 'normal' },
    //...(vaccineString ? [{ text: vaccineString, style: 'normal' }] : []),
    ...(hsgString ? [{ text: hsgString, style: 'normal' }] : []),
    ...(lungString ? [{ text: lungString, style: 'normal' }] : []),
    ,
    // ...(phlebotomyString ? [{ text: phlebotomyString, style: 'normal' }] : []),
    // ...(fitString ? [{ text: fitString, style: 'normal' }] : []),
    // ...(hpvString ? [{ text: hpvString, style: 'normal' }] : []),
    // ...(nkfString ? [{ text: nkfString, style: 'normal' }] : []),

    ...(graceString ? [{ text: graceString, style: 'normal' }] : []),
    ...(oralString ? [{ text: oralString, style: 'normal' }] : []),
    ...(aicString ? [{ text: aicString, style: 'normal' }] : []),
    ...(mentalString ? [{ text: mentalString, style: 'normal' }] : []),
    ...(mammobusString ? [{ text: mammobusString, style: 'normal' }] : []),
    ...(hpvString ? [{ text: hpvString, style: 'normal' }] : []),
    //...(whisperString ? [{ text: whisperString, style: 'normal' }] : []),
    { text: '', margin: [0, 5] },
    //{ text: parseFromLangKey('fw_empty'), style: 'normal' },
  ]
}

export function memoSection(audioData, dietData, ptData, otData, doctorData) {
  let audio =
    parseFromLangKey('memo_audio') +
    parseFromLangKey('memo_audio_1', audioData.AudiometryQ12) +
    parseFromLangKey('memo_audio_2', audioData.AudiometryQ13)

  let diet = parseFromLangKey('memo_diet') + `${dietData.dietitiansConsultQ4}`
  if (dietData.dietitiansConsultQ5) {
    diet += parseFromLangKey(
      'memo_diet_1',
      dietData.dietitiansConsultQ5,
      dietData.dietitiansConsultQ6,
    )
  }

  const pt = parseFromLangKey('memo_pt') + `${ptData.geriPtConsultQ1}`
  const ot = parseFromLangKey('memo_ot') + `${otData.geriOtConsultQ1}`
  const doctor = parseFromLangKey('memo_doctor') + `${doctorData.doctorSConsultQ3}`

  return [
    { text: parseFromLangKey('memo_title'), style: 'subheader' },
    {
      table: {
        widths: ['*'],
        body: [
          [{ text: diet, style: 'normal' }],
          [{ text: pt, style: 'normal' }],
          [{ text: ot, style: 'normal' }],
          [{ text: audio, style: 'normal' }],
          [{ text: doctor, style: 'normal' }],
        ],
      },
      layout: {
        fillColor: () => null,
        hLineColor: () => '#444',
        vLineColor: () => '#444',
      },
      margin: [0, 0, 0, 10],
    },
  ]
}

export function recommendationSection() {
  return [
    { text: parseFromLangKey('rec_title'), style: 'subheader' },
    { text: `${parseFromLangKey('rec')}\n`, style: 'normal' },
    { text: '', margin: [0, 5] },
    { text: parseFromLangKey('disclaimer_title'), style: 'subheader' },
    { text: `${parseFromLangKey('disclaimer')}\n`, style: 'normal' },
  ]
}

// console.log(await mongoDBConnection.collection("patients").deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriPtConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.dietitiansConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.doctorConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.fitForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriAmtForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriEbasDepForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriFrailScaleForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriGeriApptForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriOtConsultForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriOtQuestionnaireForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriParQForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriMmseForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriPhysicalActivityLevelForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriAudiometryForm).deleteMany({}))
// console.log("half")
// console.log(await mongoDBConnection.collection(forms.geriSppbForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.phlebotomyForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriTugForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.geriVisionForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxCancerForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxHcsrForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxNssForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.hxSocialForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.phleboForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.registrationForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.oralHealthForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.socialServiceForm).deleteMany({}))
// console.log(await mongoDBConnection.collection(forms.wceForm).deleteMany({}))
// console.log('done')
// deletes volunteer accounts
// console.log(await mongoDBConnection.collection("profiles").deleteMany({is_admin:{$eq : undefined}}))
// }

async function updateGeriGraceEligibility(args, patientId, formCollection, patientsRecord) {
  if (formCollection == 'geriAmtForm') {
    const eligibleForGrace = args.geriAmtQ12 === 'Yes (Eligible for G-RACE)'
    await patientsRecord.updateOne(
      { queueNo: patientId },
      { $set: { isEligibleForGrace: eligibleForGrace } },
    )
  }
}

export const checkFormA = async (patientId) => {
  const patient = await getSavedPatientData(patientId, 'patients')
  const status = generateStatusObject(patient)

  if (status.reg && status.triage && status.hxtaking) {
    await addToFormAQueue(patientId)
  }
}
