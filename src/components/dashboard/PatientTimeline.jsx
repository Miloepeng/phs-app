import React from 'react'
import { useState, useEffect, useContext } from 'react'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../services/mongoDB'
import { ScrollTopContext } from '../../api/utils.js'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { getPatient } from 'src/api/patientsApi'
import { getPatientStationEligibility, getPatientStationStatus } from 'src/api/stationsApi'
import { compareStationEligibility } from 'src/services/stationParity'

// Timeline item configuration - add/delete stations here (comment out)
const timelineItems = [
  /*{ key: 'reg', label: 'Registration', path: 'reg' },
  { key: 'hxtaking', label: 'History Taking', path: 'hxtaking' },
  { key: 'triage', label: 'Triage', path: 'triage' },*/
  { key: 'hsg', label: 'HealthierSG', path: 'hsg' },
  { key: 'lungfn', label: 'Lung Function', path: 'lungfn' },
  { key: 'wce', label: 'WCE', path: 'wce' },
  // { key: 'osteo', label: 'Osteoporosis', path: 'osteoporosis' },
  { key: 'podiatry', label: 'Podiatry', path: 'podiatry' },
  { key: 'dietitiansconsult', label: "Dietitian's Consultation", path: 'dietitiansconsultation' },
  { key: 'gericog', label: 'Geriatrics - Cognitive', path: 'gericog' },
  { key: 'gerimobility', label: 'Geriatrics - Mobility', path: 'gerimobility' },
  { key: 'ophthal', label: 'Ophthalmology', path: 'ophthal' },
  { key: 'oralhealth', label: 'Oral Health', path: 'oralhealth' },
  { key: 'socialservice', label: 'Social Services', path: 'socialservice' },
  { key: 'mentalhealth', label: 'Mental Health', path: 'mentalhealth' },
  { key: 'mammobus', label: 'Mammobus', path: 'mammobus' },
  { key: 'hpv', label: 'HPV', path: 'hpv' },
  { key: 'audio', label: 'Audiometry', path: 'audio' },
  { key: 'vax', label: 'Vaccination', path: 'vax' },
  { key: 'doctorsconsult', label: "Doctor's Station", path: 'doctorsconsult' },
]

// Map between timeline keys and eligibility names -
const eligibilityKeyMap = {
  hxtaking: 'History Taking',
  triage: 'Triage',
  hsg: 'Healthier SG Booth',
  lungfn: 'Lung Function Testing',
  wce: "Women's Cancer Education",
  osteo: 'Osteoporosis',
  mentalhealth: 'Mental Health',
  vax: 'Vaccination',
  gericog: 'Geriatric Screening',
  gerimobility: 'Geriatric Screening',
  ophthal: 'Ophthalmology',
  audio: 'Audiometry',
  hpv: 'HPV On-Site Testing',
  doctorsconsult: "Doctor's Station",
  dietitiansconsult: "Dietitian's Consult",
  socialservice: 'Social Services',
  oralhealth: 'Oral Health',
  mammobus: 'Mammobus',
  podiatry: 'Podiatry',
}

// Refactor the generateStatusArray to generate an object instead
export function generateStatusObject(record) {
  const recordStatus = {
    reg: false,
    triage: false,
    hxtaking: false,
    vax: false,
    hsg: false,
    lungfn: false,
    gynae: false,
    wce: false,
    osteo: false,
    mentalhealth: false,
    hpv: false,
    gerimobility: false,
    audio: false,
    ophthal: false,
    doctorsconsult: false,
    dietitiansconsult: false,
    socialservice: false,
    oralhealth: false,
    mammobus: false,
    podiatry: false,
  }

  if (record) {
    return {
      reg: record.registrationForm !== undefined, // registration
      hxtaking:
        record.hxHcsrForm !== undefined &&
        record.hxNssForm !== undefined &&
        record.hxSocialForm !== undefined &&
        record.hxOralForm !== undefined &&
        record.geriPhqForm !== undefined &&
        record.hxFamilyForm !== undefined &&
        record.hxM4M5ReviewForm !== undefined,
      triage: record.triageForm !== undefined, // triage
      hsg: record.hsgForm !== undefined,
      lungfn: record.lungFnForm !== undefined,
      gynae: record.gynaeForm !== undefined,
      wce: record.wceForm !== undefined, // wce
      osteo: record.osteoForm !== undefined,
      mentalhealth: record.mentalHealthForm !== undefined,
      vax: record.vaccineForm !== undefined,
      gericog:
        record.geriAmtForm !== undefined &&
        record.isEligibleForGrace !== undefined &&
        (record.isEligibleForGrace === false ||
          (record.isEligibleForGrace === true && record.geriGraceForm !== undefined)),
      gerimobility:
        record.geriPhysicalActivityLevelForm !== undefined &&
        record.geriOtQuestionnaireForm !== undefined &&
        record.geriSppbForm !== undefined &&
        record.geriPtConsultForm !== undefined &&
        record.geriOtConsultForm !== undefined,
      ophthal: record.ophthalForm !== undefined,
      audio: record.audiometryForm !== undefined,
      hpv: record.hpvForm !== undefined,
      doctorsconsult: record.doctorConsultForm !== undefined, // doctor's consult
      dietitiansconsult: record.dietitiansConsultForm !== undefined, // dietitian's consult
      socialservice: record.socialServiceForm !== undefined, // social service,
      oralhealth: record.oralHealthForm !== undefined, // Oral Health
      mammobus: record.mammobusForm !== undefined, // Mammobus
      podiatry: record.podiatryForm !== undefined, // Podiatry
      // Add eligibility data to the status object
      eligibleStations: record.eligibleStations || [],
    }
  }

  return recordStatus
}

function navigateTo(event, navigate, page, scrollTop) {
  event.preventDefault()
  scrollTop()
  const path = '/app/' + page
  navigate(path, { replace: true })
}

const TimelineItemComponent = ({ item, formDone, admin, navigate, scrollTop }) => {
  // Check if this station is eligible
  const eligibilityName = eligibilityKeyMap[item.key]
  const isEligible = formDone.eligibleStations?.includes(eligibilityName)

  // Determine dot color based on completion status and eligibility
  let dotColor
  if (formDone?.[item.key]) {
    dotColor = 'primary' // Completed stations are primary color
  } else if (eligibilityName && !isEligible) {
    dotColor = 'error' // Not eligible stations are red
  } else {
    dotColor = 'grey' // Default color for incomplete but eligible stations
  }

  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color={dotColor} />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <a
          href={`/app/${item.path}`}
          onClick={(event) => navigateTo(event, navigate, item.path, scrollTop)}
        >
          {item.label}
          {!formDone?.[item.key] ? ' [Incomplete]' : admin ? ' [Edit]' : ' [Completed]'}
        </a>
      </TimelineContent>
    </TimelineItem>
  )
}

const BasicTimeline = (props) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [formDone, setFormDone] = useState({})
  const [admin, isAdmins] = useState(false)
  const { scrollTop } = useContext(ScrollTopContext)

  useEffect(() => {
    // const createFormsStatus = async () => {
    //   try {
    //     const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas')
    //     const patientsRecord = mongoConnection.db('phs').collection('patients')
    //     // patientId must be valid for this component to even render
    //     // checks done in parent component Dashboard.js
    //     // hence, if there is no record, likely there is implementation bug
    //     const record = await patientsRecord.findOne({ queueNo: props.patientId })

    //     setFormDone(generateStatusObject(record))
    //     setLoading(false)
    //     isAdmins(await isAdmin())
    //   } catch (err) {
    //     alert(err)
    //     console.log('error is here')
    //     navigate('/app/registration', { replace: true })
    //   }
    // }
    const loadLocalStatusFallback = async () => {
      const res = await getPatient(props.patientId)
      return generateStatusObject(res.data)
    }

    const createFormsStatus = async () => {
      try {
        let status
        try {
          const res = await getPatientStationStatus(props.patientId)
          status = res.data
          try {
            const eligibilityRes = await getPatientStationEligibility(props.patientId)
            status = {
              ...status,
              eligibleStations: eligibilityRes.data?.eligibleStations || status.eligibleStations,
            }
            if (import.meta.env.DEV) {
              compareStationEligibility(props.patientId)
                .then((comparison) => {
                  if (!comparison.matches) {
                    console.warn('Station eligibility mismatch', {
                      patientId: comparison.patientId,
                      differences: comparison.differences,
                      frontendEligibleStations: comparison.frontendEligibleStations,
                      backendEligibleStations: comparison.backendEligibleStations,
                    })
                  }
                })
                .catch(() => {})
            }
          } catch {
            // Keep backend completion status even if backend eligibility is unavailable.
          }
        } catch {
          status = await loadLocalStatusFallback()
        }

        setFormDone(status)
        setLoading(false)
        isAdmins(await isAdmin())
      } catch (err) {
        alert(err)
        navigate('/app/registration', { replace: true })
      }
    }
    createFormsStatus()
  }, [navigate, props.patientId])
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </div>
    )
  } else {
    return (
      <Timeline>
        {/* Registration as fixed item */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={formDone?.reg ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <a href='/app/reg' onClick={(event) => navigateTo(event, navigate, 'reg', scrollTop)}>
              Registration
              {!formDone?.reg ? ' [Incomplete]' : admin ? ' [Edit]' : ' [Completed]'}
            </a>
          </TimelineContent>
        </TimelineItem>

        {/* Triage as fixed item */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={formDone?.triage ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <a
              href='/app/triage'
              onClick={(event) => navigateTo(event, navigate, 'triage', scrollTop)}
            >
              Triage
              {!formDone?.triage ? ' [Incomplete]' : admin ? ' [Edit]' : ' [Completed]'}
            </a>
          </TimelineContent>
        </TimelineItem>

        {/* History Taking as fixed item */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={formDone?.hxtaking ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <a
              href='/app/hxtaking'
              onClick={(event) => navigateTo(event, navigate, 'hxtaking', scrollTop)}
            >
              History Taking
              {!formDone?.hxtaking ? ' [Incomplete]' : admin ? ' [Edit]' : ' [Completed]'}
            </a>
          </TimelineContent>
        </TimelineItem>

        {timelineItems.map((item) => (
          <TimelineItemComponent
            key={item.key}
            item={item}
            formDone={formDone}
            admin={admin}
            navigate={navigate}
            scrollTop={scrollTop}
          />
        ))}

        {/* Summary and End items */}
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={Object.values(formDone).every(Boolean) ? 'primary' : 'grey'} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <a
              href='/app/summary'
              onClick={(event) => navigateTo(event, navigate, 'summary', scrollTop)}
            >
              Summary [View Only]
            </a>
          </TimelineContent>
        </TimelineItem>

        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color={Object.values(formDone).every(Boolean) ? 'primary' : 'grey'} />
          </TimelineSeparator>
          <TimelineContent>END</TimelineContent>
        </TimelineItem>
      </Timeline>
    )
  }
}

const PatientTimeline = (props) => {
  const { patientId, ...cardProps } = props
  return (
    <Card {...cardProps}>
      <CardHeader title='Patient Dashboard' />
      <Divider />
      <CardContent>
        <Box
          sx={{
            height: 'auto',
            position: 'relative',
          }}
        >
          <BasicTimeline patientId={patientId} />
        </Box>
      </CardContent>
      <Divider />
    </Card>
  )
}

export default PatientTimeline
