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
import { Alert, Box, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { getPatientStationSummary } from 'src/api/stationsApi'

const toTimelineItem = (station) => ({
  key: station.key,
  label: station.displayName,
  path: station.route,
  eligibilityName: station.eligibilityName,
  eligible: station.eligible,
})

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
  const eligibilityName = item.eligibilityName
  const isEligible =
    typeof item.eligible === 'boolean'
      ? item.eligible
      : formDone.eligibleStations?.includes(eligibilityName)

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
  const [timelineItems, setTimelineItems] = useState([])
  const [loadError, setLoadError] = useState('')
  const [admin, isAdmins] = useState(false)
  const { scrollTop } = useContext(ScrollTopContext)

  useEffect(() => {
    let mounted = true

    const createFormsStatus = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const summaryRes = await getPatientStationSummary(props.patientId)
        const summary = summaryRes.data || {}
        const activeStations = summary.stations || []
        const status = {
          ...(summary.status || {}),
          eligibleStations: summary.eligibleStations || summary.status?.eligibleStations || [],
        }

        if (mounted) {
          setTimelineItems(activeStations.map(toTimelineItem))
          setFormDone(status)
          isAdmins(await isAdmin())
        }
      } catch (err) {
        console.error('Failed to load backend station summary:', err)
        if (mounted) {
          setLoadError('Unable to load station progress from the backend.')
          setTimelineItems([])
          setFormDone({})
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    createFormsStatus()

    return () => {
      mounted = false
    }
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
    if (loadError) {
      return <Alert severity='error'>{loadError}</Alert>
    }

    return (
      <Timeline>
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
            <TimelineDot
              color={timelineItems.every((item) => formDone?.[item.key]) ? 'primary' : 'grey'}
            />
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
            <TimelineDot
              color={timelineItems.every((item) => formDone?.[item.key]) ? 'primary' : 'grey'}
            />
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
