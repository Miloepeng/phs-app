import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FastField } from 'formik'
import { validationSchema } from './registrationSchema'

import {
  Divider,
  Paper,
  CircularProgress,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  InputLabel,
} from '@mui/material'

import { submitForm } from '../api/api.jsx'
import { FormContext } from '../api/utils.js'
import { getClinicSlotsCollection, getSavedData } from '../services/mongoDB'
import PopupText from 'src/utils/popupText'
import './fieldPadding.css'
import './forms.css'
import CustomTextField from '../components/form-components/CustomTextField'
import CustomCheckbox from '../components/form-components/CustomCheckbox'
import CustomRadioGroup from '../components/form-components/CustomRadioGroup'

export const defaultSlots = {
  648886: 50,
  610064: 50,
  640638: 50,
  641518: 50,
  640762: 50,
  None: 10000,
}

const initialValues = {
  registrationQ1: 'Mr',
  registrationQ2: '',
  registrationQ3: new Date(),
  registrationQ4: 0,
  registrationQ5: '',
  registrationQ6: '',
  registrationQ7: '',
  registrationQ8: '',
  registrationQ9: '',
  registrationQ10: '',
  registrationQ11: '',
  registrationQ12: '',
  registrationQ13: '',
  registrationQ14: '',
  registrationQ17: false,
  registrationQ18: '',
  registrationQ20: '',
  registrationShortAnsQ6: '',
}

const formName = 'registrationForm'

const RegForm = () => {
  const { patientId, updatePatientId, updatePatientInfo } = useContext(FormContext)
  const [loading, isLoading] = useState(true)
  const navigate = useNavigate()
  const [savedData, setSavedData] = useState(initialValues)
  const [birthday, setBirthday] = useState(new Date())
  const [patientAge, setPatientAge] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      console.log('Patient ID: ' + patientId)
      const res = await getSavedData(patientId, formName)

      // const phlebCountersCollection = getClinicSlotsCollection()
      // const phlebCounters = await phlebCountersCollection.find()
      // for (const { postalCode, counterItems } of phlebCounters) {
      //   if (postalCode && counterItems) {
      //     temp[postalCode] -= counterItems.length
      //   }
      // }

      // Set date to current date if no birthday was previously saved
      if (patientId == -1) {
        res.registrationQ3 = birthday
      }

      // Calculate age if birthday exists in saved data
      if (res.registrationQ3) {
        const calculatedAge = calculateAge(res.registrationQ3)
        setPatientAge(calculatedAge)
      }
      setSavedData(res)
      isLoading(false)
    }
    fetchData()
  }, [patientId])

  const calculateAge = (birthDate) => {
    const today = new Date()
    if (birthDate) {
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      // Adjust age if birthday hasn't occurred this year yet
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      setBirthday(birth)
      setPatientAge(age)
      return age
    }
    return 0
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    isLoading(true)
    setSubmitting(true)
    values.registrationQ4 = patientAge

    console.log('Patient ID: ' + patientId)
    const response = await submitForm(values, patientId, formName)

    console.log('test  _' + response.result + ' ' + patientAge)
    if (response.result) {
      setTimeout(() => {
        console.log('response data: ' + response.qNum)
        alert('Successfully submitted form')
        console.log('Successfully submitted form')
        updatePatientInfo(response.data)
        updatePatientId(response.qNum)
        navigate('/app/dashboard', { replace: true })
      }, 80)
    } else {
      setTimeout(() => {
        console.log('Form submission failed')
        alert(`Unsuccessful. ${response.error}`)
      }, 80)
    }

    isLoading(false)
    setSubmitting(false)
  }

  // Custom Field Components
  const FormikSelect = ({ field, form, options, label, ...props }) => {
    const selectId = `${field.name}-select`

    return (
      <FormControl
        fullWidth
        margin='normal'
        error={form.touched[field.name] && Boolean(form.errors[field.name])}
        variant='outlined'
      >
        {label && (
          <InputLabel shrink htmlFor={selectId}>
            {label}
          </InputLabel>
        )}
        <Select
          {...field}
          {...props}
          label={label}
          id={selectId}
          displayEmpty
          value={field.value || ''}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {form.touched[field.name] && form.errors[field.name] && (
          <Typography variant='caption' color='error'>
            {form.errors[field.name]}
          </Typography>
        )}
      </FormControl>
    )
  }

  const FormikDateField = ({ field, form, ...props }) => {
    const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime())

    // Convert Date object to YYYY-MM-DD string for input
    const dateToString = (date) => {
      if (isValidDate(date)) {
        return date.toISOString().split('T')[0]
      }
      return ''
    }

    return (
      <TextField
        {...props}
        type='date'
        fullWidth
        margin='normal'
        error={form.touched[field.name] && Boolean(form.errors[field.name])}
        helperText={form.touched[field.name] && form.errors[field.name]}
        value={dateToString(field.value)}
        onChange={(e) => {
          const dateValue = e.target.value
          if (dateValue) {
            const date = new Date(dateValue)
            if (isValidDate(date)) {
              form.setFieldValue(field.name, date)
            }
          } else {
            // Set to null instead of empty string to avoid reinitialize
            form.setFieldValue(field.name, null)
          }
        }}
        onBlur={(e) => {
          const dateValue = e.target.value
          if (dateValue) {
            const date = new Date(dateValue)
            if (isValidDate(date)) {
              const calculatedAge = calculateAge(date)
              form.setFieldValue('registrationQ4', calculatedAge)
            }
          }
          // Don't set field value on blur - let onChange handle it
        }}
      />
    )
  }

  const formOptions = {
    registrationQ1: [
      { label: 'Mr', value: 'Mr' },
      { label: 'Ms', value: 'Ms' },
      { label: 'Mrs', value: 'Mrs' },
      { label: 'Dr', value: 'Dr' },
    ],
    registrationQ5: [
      { label: 'Male', value: 'Male' },
      { label: 'Female', value: 'Female' },
    ],
    registrationQ6: [
      { label: 'Chinese 华裔', value: 'Chinese 华裔' },
      { label: 'Malay 巫裔', value: 'Malay 巫裔' },
      { label: 'Indian 印裔', value: 'Indian 印裔' },
      { label: 'Eurasian 欧亚裔', value: 'Eurasian 欧亚裔' },
      { label: 'Others 其他', value: 'Others 其他' },
    ],
    registrationQ7: [
      { label: 'Singapore Citizen 新加坡公民', value: 'Singapore Citizen 新加坡公民' },
      {
        label: 'Singapore Permanent Resident (PR) \n新加坡永久居民',
        value: 'Singapore Permanent Resident (PR) \n新加坡永久居民',
      },
    ],
    registrationQ8: [
      { label: 'Single 单身', value: 'Single 单身' },
      { label: 'Married 已婚', value: 'Married 已婚' },
      { label: 'Widowed 已寡', value: 'Widowed 已寡' },
      { label: 'Separated 已分居', value: 'Separated 已分居' },
      { label: 'Divorced 已离婚', value: 'Divorced 已离婚' },
    ],
    registrationQ10: [
      { label: 'Jurong', value: 'Jurong' },
      { label: 'Yuhua', value: 'Yuhua' },
      { label: 'Bukit Batok', value: 'Bukit Batok' },
      { label: 'Pioneer', value: 'Pioneer' },
      { label: 'West Coast', value: 'West Coast' },
      { label: 'Hong Kah North', value: 'Hong Kah North' },
      { label: 'Others', value: 'Others' },
    ],
    registrationQ11: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
      { label: 'Unsure', value: 'Unsure' },
    ],
    registrationQ12: [
      { label: 'CHAS Orange', value: 'CHAS Orange' },
      { label: 'CHAS Green', value: 'CHAS Green' },
      { label: 'CHAS Blue', value: 'CHAS Blue' },
      { label: 'No CHAS', value: 'No CHAS' },
    ],
    registrationQ13: [
      { label: 'Pioneer generation card holder', value: 'Pioneer generation card holder' },
      { label: 'Merdeka generation card holder', value: 'Merdeka generation card holder' },
      { label: 'None', value: 'None' },
    ],
    registrationQ14: [
      { label: 'English', value: 'English' },
      { label: 'Mandarin', value: 'Mandarin' },
      { label: 'Malay', value: 'Malay' },
      { label: 'Tamil', value: 'Tamil' },
    ],
    registrationQ18: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    registrationQ19: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    registrationQ20: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  }

  const renderForm = () => (
    <Formik
      initialValues={savedData}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, submitCount, ...formikProps }) => (
        <Form className='fieldPadding'>
          <div className='form--div'>
            <Typography variant='h4' component='h1' gutterBottom>
              Registration
            </Typography>

            <Typography variant='h6' component='h3' gutterBottom>
              Salutation 称谓
            </Typography>
            <FastField
              name='registrationQ1'
              label='registrationQ1'
              component={FormikSelect}
              options={formOptions.registrationQ1}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Initials (e.g Chen Ren Ying - Chen R Y, Christie Tan En Ning - Christie T E N)
            </Typography>
            <FastField
              name='registrationQ2'
              label='registrationQ2'
              component={CustomTextField}
              multiline
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Birthday
            </Typography>
            <FastField name='registrationQ3' label='registrationQ3' component={FormikDateField} />

            <Typography variant='h6' component='h3' gutterBottom>
              Age
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              registrationQ4
            </Typography>
            <Typography className='blue'>{patientAge}</Typography>

            <Typography variant='h6' component='h3' gutterBottom>
              Gender
            </Typography>
            <FastField
              name='registrationQ5'
              label='registrationQ5'
              component={CustomRadioGroup}
              options={formOptions.registrationQ5}
              row
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Race 种族
            </Typography>
            <FastField
              name='registrationQ6'
              label='registrationQ6'
              component={CustomRadioGroup}
              options={formOptions.registrationQ6}
            />

            <PopupText qnNo='registrationQ6' triggerValue='Others 其他'>
              <Field
                name='registrationShortAnsQ6'
                label='registrationShortAnsQ6'
                component={CustomTextField}
                multiline
                rows={2}
                placeholder='Please specify'
              />
            </PopupText>

            <Typography variant='h6' component='h3' gutterBottom>
              Nationality 国籍
            </Typography>
            <Typography>
              Please Note: Non Singapore Citizens/ Non-PRs are unfortunately not eligible for this
              health screening
            </Typography>
            <FastField
              name='registrationQ7'
              label='registrationQ7'
              component={CustomRadioGroup}
              options={formOptions.registrationQ7}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Marital Status 婚姻状况
            </Typography>
            <FastField
              name='registrationQ8'
              label='registrationQ8'
              component={FormikSelect}
              options={formOptions.registrationQ8}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Occupation 工作
            </Typography>
            <FastField name='registrationQ9' label='registrationQ9' component={CustomTextField} />

            <Typography variant='h6' component='h3' gutterBottom>
              GRC/SMC Subdivision{' '}
              <a
                href='https://www.parliament.gov.sg/mps/find-my-mp'
                target='_blank'
                rel='noreferrer'
              >
                [https://www.parliament.gov.sg/mps/find-my-mp]
              </a>
            </Typography>
            <FastField
              name='registrationQ10'
              label='registrationQ10'
              component={FormikSelect}
              options={formOptions.registrationQ10}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Are you currently part of HealthierSG?
            </Typography>
            <FastField
              name='registrationQ11'
              label='registrationQ11'
              component={CustomRadioGroup}
              options={formOptions.registrationQ11}
              row
            />

            <Typography variant='h6' component='h3' gutterBottom>
              CHAS Status 社保援助计划
            </Typography>
            <FastField
              name='registrationQ12'
              label='registrationQ12'
              component={FormikSelect}
              options={formOptions.registrationQ12}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Pioneer Generation Status 建国一代配套
            </Typography>
            <FastField
              name='registrationQ13'
              label='registrationQ13'
              component={CustomRadioGroup}
              options={formOptions.registrationQ13}
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Preferred Language for Health Report
            </Typography>
            <FastField
              name='registrationQ14'
              label='registrationQ14'
              component={CustomRadioGroup}
              options={formOptions.registrationQ14}
            />

            <Typography variant='h4' component='h2' gutterBottom sx={{ mt: 4 }}>
              Compliance to PDPA 同意书
            </Typography>
            <Typography paragraph>
              I hereby give consent to having photos and/or videos taken of me for publicity
              purposes. I hereby give my consent to the Public Health Service Executive Committee to
              collect my personal information for the purpose of participating in the Public Health
              Service (hereby called &quot;PHS&quot;) and its related events, and to contact me via
              calls, SMS, text messages or emails regarding the event and follow-up process.
            </Typography>
            <Typography paragraph>
              Should you wish to withdraw your consent for us to contact you for the purposes stated
              above, please notify a member of the PHS Executive Committee at &nbsp;
              <a href='mailto:ask.phs@gmail.com'>ask.phs@gmail.com</a> &nbsp; in writing. We will
              then remove your personal information from our database. Please allow 3 business days
              for your withdrawal of consent to take effect. All personal information will be kept
              confidential, will only be disseminated to members of the PHS Executive Committee, and
              will be strictly used by these parties for the purposes stated.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              registrationQ17
            </Typography>
            <Field
              name='registrationQ17'
              component={CustomCheckbox}
              label='I agree and consent to the above.'
            />

            <Typography variant='h6' component='h3' gutterBottom sx={{ mt: 4 }}>
              Has patient attended any health screenings before? (e.g. Annual Health Screening etc.)
            </Typography>
            <FastField
              name='registrationQ18'
              label='registrationQ18'
              component={CustomRadioGroup}
              options={formOptions.registrationQ18}
              row
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Has patient pre-registered for the Mammobus station?
            </Typography>
            <FastField
              name='registrationQ19'
              label='registrationQ19'
              component={CustomRadioGroup}
              options={formOptions.registrationQ19}
              row
            />

            <Typography variant='h6' component='h3' gutterBottom>
              Patient consented to being considered for participation in Long Term Follow-Up (LTFU)?
              (Patient has to sign and tick Form C)
            </Typography>
            <FastField
              name='registrationQ20'
              label='registrationQ20'
              component={CustomRadioGroup}
              options={formOptions.registrationQ20}
              row
            />
          </div>

          <Box mt={2} mb={2}>
            {submitCount > 0 && Object.keys(formikProps.errors || {}).length > 0 && (
              <Typography color='error' variant='body2' sx={{ mb: 1 }}>
                Please fill in all required fields correctly.
              </Typography>
            )}
            {loading || isSubmitting ? (
              <CircularProgress />
            ) : (
              <Button
                type='submit'
                variant='contained'
                color='primary'
                size='large'
                disabled={isSubmitting}
              >
                Submit
              </Button>
            )}
          </Box>

          <Divider />
        </Form>
      )}
    </Formik>
  )

  return (
    <Paper elevation={2} p={0} m={0}>
      {renderForm()}
    </Paper>
  )
}

export default RegForm
