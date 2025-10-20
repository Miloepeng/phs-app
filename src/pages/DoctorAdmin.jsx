import React, { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Typography, Paper, Stack } from '@mui/material'
import { getProfile, getPrintedDocPdfQueue, getUnprintedDocPdfQueue, markDocPdfAsPrinted, deleteDocPdfFromQueue } from '../services/mongoDB'
import { generateDoctorPdf } from '../api/api.jsx'

const DoctorAdmin = () => {
  const [pdfQueue, setPdfQueue] = useState([])
  const [printedQueue, setPrintedQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true) // NEW
  const [view, setView] = useState('queue') // 'queue' = active jobs, 'history' = printed jobs

  // runs only on page load
  useEffect(() => {
    let isMounted = true
    const fetchProfileAndQueue = async () => {
      try {
        const profile = await getProfile()
        const isAdminUser = profile?.is_admin || false
        if (!isMounted) return

        setAdmin(isAdminUser)
        setCheckingAdmin(false)

        if (!isAdminUser) return

        // Use the new separate functions
        const unprinted = await getUnprintedDocPdfQueue()
        const printed = await getPrintedDocPdfQueue()

        if (!isMounted) return

        // Sort by newest first
        unprinted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        printed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setPdfQueue(unprinted)
        setPrintedQueue(printed)
        setLoading(false)
      } catch (err) {
        console.error('Initial fetch error:', err)
        setCheckingAdmin(false)
      }
    }

    fetchProfileAndQueue()
    return () => {
      isMounted = false
    }
  }, [])

  // polling to refresh queue every 5sec while tab is visible
  useEffect(() => {
    let isMounted = true

    const fetchQueue = async () => {
      try {
        const unprinted = await getUnprintedDocPdfQueue()
        const printed = await getPrintedDocPdfQueue()

        if (!isMounted) return

        unprinted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        printed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setPdfQueue(unprinted)
        setPrintedQueue(printed)
      } catch (err) {
        console.error('Failed to fetch PDF queue:', err)
      }
    }

    fetchQueue()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefresh((r) => !r)
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [refresh])

  const handlePrint = async (entry) => {
    await generateDoctorPdf(entry)
    await markDocPdfAsPrinted(entry._id)
    setRefresh((r) => !r)
  }

  const handleRemove = async (entry) => {
    await deleteDocPdfFromQueue(entry._id)
    setRefresh((r) => !r)
  }

  if (checkingAdmin) return <CircularProgress />

  if (!admin) return <Typography variant='h6'>Access denied. Admins only.</Typography>

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant='h4' gutterBottom>
        Doctor PDF Print Queue
      </Typography>

      <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
        <Button
          variant={view === 'queue' ? 'contained' : 'outlined'}
          onClick={() => setView('queue')}
        >
          Show Current Queue
        </Button>
        <Button
          variant={view === 'history' ? 'contained' : 'outlined'}
          onClick={() => setView('history')}
        >
          Show Print History
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : view === 'history' ? (
        printedQueue.length === 0 ? (
          <Typography>No printed records found.</Typography>
        ) : (
          printedQueue.map((entry) => (
            <Paper
              key={entry._id}
              sx={{
                padding: 2,
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant='subtitle1'>Patient ID: {entry.patientId}</Typography>
                <Typography variant='body2'>Doctor: {entry.doctorName}</Typography>
                <Typography variant='body2'>
                  Created At: {new Date(entry.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Button variant='outlined' onClick={() => generateDoctorPdf(entry)}>
                Reprint
              </Button>
            </Paper>
          ))
        )
      ) : (
        pdfQueue.map((entry) => (
          <Paper
            key={entry._id}
            sx={{
              padding: 2,
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant='subtitle1'>Patient ID: {entry.patientId}</Typography>
              <Typography variant='body2'>Doctor: {entry.doctorName}</Typography>
              <Typography variant='body2'>
                Created At: {new Date(entry.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Stack direction='row' spacing={1}>
              <Button variant='contained' color='primary' onClick={() => handlePrint(entry)}>
                Print
              </Button>
              <Button variant='outlined' color='error' onClick={() => handleRemove(entry)}>
                Remove
              </Button>
            </Stack>
          </Paper>
        ))
      )}
    </Box>
  )
}

export default DoctorAdmin
