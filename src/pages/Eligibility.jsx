import React, { useState, useContext, useEffect, useRef } from 'react'
import {
  Box,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { Helmet } from 'react-helmet-async'

import { getSavedData, getSavedPatientData, updateStationCounts } from '../services/mongoDB'
import { FormContext } from '../api/utils.js'
import allForms from '../forms/forms.json'
import {
  getEligibilityRows,
  computeVisitedStationsCount,
  getVisitedStationNames,
} from '../services/stationFallbacks'
import { generateFormAPdf } from '../api/api.jsx'
import { getPatientStationEligibility, recalculatePatientStationCounts } from '../api/stationsApi'

// Eligibility page

function Eligibility() {
  const { patientId } = useContext(FormContext)
  const [rows, setRows] = useState([])
  const [loadingPrevData, isLoadingPrevData] = useState(true)
  const generatePDFRef = useRef(() => {})

  useEffect(() => {
    const loadAndCompute = async () => {
      isLoadingPrevData(true)

      try {
        const [eligibility] = await Promise.all([
          getPatientStationEligibility(patientId),
          recalculatePatientStationCounts(patientId),
        ])
        setRows(eligibility.data?.rows || [])
        isLoadingPrevData(false)
        return
      } catch {
        // Keep local computation as a migration fallback.
      }

      const [
        pmhx,
        hxsocial,
        reg,
        hxfamily,
        triage,
        hcsr,
        hxoral,
        wce,
        phq,
        hxm4m5,
        hxgynae,
        ophthal,
      ] = await Promise.all([
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

      const patient = await getSavedPatientData(patientId, 'patients')
      const visitedCount = computeVisitedStationsCount(patient)

      const eligibilityRows = getEligibilityRows(formData)
      const eligibleCount = eligibilityRows.filter((r) => r.eligibility === 'YES').length
      setRows(eligibilityRows)

      // NEW: Get the actual station names (not just counts)
      const visitedStationNames = getVisitedStationNames(patient)
      const eligibleStationNames = eligibilityRows
        .filter((r) => r.eligibility === 'YES')
        .map((r) => r.name)

      // Update existing counts and station names
      await updateStationCounts(
        patientId,
        visitedCount,
        eligibleCount,
        visitedStationNames,
        eligibleStationNames,
      )

      console.log('visited:', visitedCount, 'eligible:', eligibleCount)
      console.log('visited stations:', visitedStationNames)
      console.log('eligible stations:', eligibleStationNames)
      isLoadingPrevData(false)
    }

    if (patientId !== null && patientId !== undefined) loadAndCompute()
  }, [patientId])

  generatePDFRef.current = async () => {
    await generateFormAPdf(patientId)
  }

  return (
    <>
      <Helmet>
        <title>registrationQ5 Eligibility</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100%',
          py: 3,
        }}
      >
        {loadingPrevData ? (
          <CircularProgress />
        ) : (
          <Button onClick={() => generatePDFRef.current()}>Download Form A</Button>
        )}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Modality</TableCell>
                <TableCell>ELIGIBILITY (highlighted in blue)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell component='th' scope='row'>
                    {row.name}
                  </TableCell>
                  <TableCell sx={{ color: row.eligibility === 'YES' ? 'blue' : 'red' }}>
                    {row.eligibility}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default Eligibility
