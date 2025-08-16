import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import * as Yup from 'yup'
import { Formik } from 'formik'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useContext, useState } from 'react'
import { LoginContext } from '../App.jsx'
import { Visibility, VisibilityOff } from '@mui/icons-material'

const Login = () => {
  const navigate = useNavigate()
  const [accountOptions, /*setAccountOptions*/] = useState(['Guest', 'Admin'])
  const [accountOption, setAccountOption] = useState('Guest')
  const { isLogin } = useContext(LoginContext)
  const { setProfile } = useContext(LoginContext)
  const [loading, isLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const handleClickShowPassword = () => setShowPassword(!showPassword)
  const handleMouseDownPassword = () => setShowPassword(!showPassword)


  // sign up API version
  const handleSignUp = async (values) => {
    isLoading(true)
    try {
      const res = await fetch('/api/handleSignup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const data = await res.json();
      if (data.result) {
        alert('Account Created: ' + values.email + '\nYou can now sign in.');
        setTimeout(() => setIsSignUp(false), 1500);        
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
        alert('Contact Developer: ' + e);
    }
    isLoading(false);
  }

  // we need to allow anonymous users to sign up(settle in mongoDB)
  // const handleSignUp = async (values) => {
  //   isLoading(true)
  //   try {
  //     // Log in as anonymous user if not already logged in
  //     if (!mongoDB.currentUser) {
  //       const credentials = Realm.Credentials.anonymous();
  //       await mongoDB.logIn(credentials);
  //     }
  //     const mongoConnection = mongoDB.currentUser.mongoClient('mongodb-atlas');
  //     const guestProfiles = mongoConnection.db('phs').collection('profiles');
  //     const searchUnique = await guestProfiles.findOne({ username: values.email });
  //     if (searchUnique === null) {
  //       if (values.password.length < 6) {
  //         alert('Password must contain at least one six characters!');
  //         isLoading(false);
  //       } else {
  //         const hashHex = await hashPassword(values.password);
  //         await guestProfiles.insertOne({
  //           username: values.email,
  //           email: values.email,
  //           password: hashHex,
  //           is_admin: false,
  //           lastLogin: null,
  //         });
  //         alert('Account Created: ' + values.email + '\nYou can now sign in.');
  //         setTimeout(() => setIsSignUp(false), 1500);
  //         isLoading(false);
  //       }
  //     } else {
  //       alert('Username ' + values.email + ' taken! Try another username!');
  //       isLoading(false);
  //     }
  //   } catch (e) {
  //     alert('Contact Developer: ' + e);
  //     isLoading(false);
  //   }
  // }


  // login API version
  const handleLogin = async (values) => {
    isLoading(true)
    try {
      let type = 'Guest';
      if (accountOption === accountOptions[1]) {
        type = 'Admin';
      }
      const res = await fetch('/api/handleLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email, password: values.password, type: type }),
      });

      const data = await res.json();
      if (data.result) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        alert('Login successful!');
        localStorage.setItem('profile', JSON.stringify(data.user));
        setProfile(data.user);
        isLogin(true);
        navigate('/app/registration', { replace: true });
      } else {
        alert(data.error || 'Invalid Username or Password!');
      }
    } catch (e) {
      alert('Login error!');
    }
    isLoading(false);
  }

  // const handleLogin = async (values) => {
  //   try {
  //     // fix uid?
  //     isLoading(true)
  //     if (accountOption === accountOptions[1]) {
  //       //admin
  //       const credentials = Realm.Credentials.emailPassword(values.email, values.password)
  //       //console.log("test")
  //       // Authenticate the user
  //       // eslint-disable-next-line
  //       const user = await mongoDB.logIn(credentials)
  //       const userProfile = profilesCollection()
  //       const profile = await userProfile.findOne({ username: values.email })
  //       setProfile(profile)
  //       isLogin(true)
  //     } else {
  //       const hashHex = await hashPassword(values.password)

  //       const credentials = Realm.Credentials.function({
  //         username: values.email,
  //         password: hashHex,
  //       })

  //       // Authenticate the user
  //       // eslint-disable-next-line
  //       const user = await mongoDB.logIn(credentials)
  //       const userProfile = profilesCollection()
  //       const profile = await userProfile.findOne({ username: values.email })
  //       isLogin(true)
  //       setProfile(profile)
  //     }
  //     const userProfile = profilesCollection()
  //     await userProfile.updateOne(
  //       {
  //         username: values.email,
  //       },
  //       { $set: { lastLogin: new Date() } },
  //     )
  //     isLoading(false)
  //     navigate('/app/registration', { replace: true })
  //   } catch (err) {
  //     isLoading(false)
  //     alert('Invalid Username or Password!')
  //   }
  //   isLoading(false)
  // }

  const handleReset = async (values) => {
    // const email = values.email
    // try {
    //   await mongoDB.emailPasswordAuth.sendResetPasswordEmail(email)
    //   alert('Email sent to your account!')
    // } catch (e) {
    //   alert('Invalid Email!')
    // }
    alert('Password reset is not implemented yet.');
  }

  const connectionTest = async () => {
    try {
      const res = await fetch('/api/test-mongo');
      const data = await res.json();
      if (data.result) {
        console.log('MongoDB Test:', data.message, data.collections);
        alert('MongoDB connection successful!');
      } else {
        console.error('MongoDB Test Failed:', data.error);
        alert('MongoDB connection failed!');
      }
    } catch (e) {
      console.error('MongoDB Test Error:', e);
      alert('MongoDB test error!');
    }
  }

  return (
     <>
      <Button
        variant="outlined"
        color="secondary"
        onClick={connectionTest}
        style={{ marginTop: 16 }}
      >
        Test MongoDB Connection
      </Button>
      <Helmet>
        <title>{isSignUp ? 'Sign up' : 'Login'}</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth='sm'>
          <Formik
            initialValues={{
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string()
                .email('Must be a valid email')
                .max(255)
                .required('Username is required, you can use your email'),
              password: Yup.string()
                .min(6, 'Password must be at least 6 characters')
                .max(255)
                .required('Password is required'),
              ...(isSignUp && {
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('password'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              }),
            })}
            onSubmit={(values) => {
              if (isSignUp) {
                handleSignUp(values)
              } else {
                handleLogin(values)
              }
            }}
          >
            {({
              errors,
              handleBlur,
              handleChange,
              handleSubmit,
              touched,
              values,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <Typography color='textPrimary' variant='h2'>
                    {isSignUp ? 'Sign up' : 'Sign in'}
                  </Typography>
                  <Typography color='textSecondary' gutterBottom variant='body2'>
                    PHS {new Date().getFullYear()}
                  </Typography>
                  {!isSignUp && (
                    <select
                      onChange={(e) => {
                        setAccountOption(e.target.value)
                      }}
                    >
                      {accountOptions.map((account) => (
                        <option name={'account'} value={account} key={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  )}
                </Box>
                <TextField
                  fullWidth
                  helperText={touched.email && errors.email}
                  label='Username'
                  margin='normal'
                  name='email'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  variant='outlined'
                />
                <TextField
                  fullWidth
                  helperText={touched.password && errors.password}
                  label='Password'
                  margin='normal'
                  name='password'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  variant='outlined'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          aria-label='toggle password visibility'
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          size='large'
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {isSignUp && (
                  <TextField
                    fullWidth
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    label='Confirm Password'
                    margin='normal'
                    name='confirmPassword'
                    onBlur={handleBlur}
                    onChange={handleChange}
                    type='password'
                    value={values.confirmPassword}
                    variant='outlined'
                  />
                )}

                <Box sx={{ py: 2 }}>
                  <Button
                    color='primary'
                    fullWidth
                    size='large'
                    type='submit'
                    variant='contained'
                    disabled={loading}
                    sx={{
                      ...(loading && {
                        backgroundColor: '#bdbdbd',
                        color: '#fff',
                      }),
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        {isSignUp ? 'Signing up...' : 'Logging in...'}
                      </>
                    ) : (
                      isSignUp ? 'Sign up' : 'Sign in now'
                    )}
                  </Button>
                </Box>

                

                {/* Reset Password only for Sign In and Admin */}
                {!isSignUp && accountOption === accountOptions[1] && (
                  <Button
                    color='primary'
                    fullWidth
                    size='large'
                    type='button'
                    variant='contained'
                    onClick={() => {
                      handleReset(values)
                    }}
                  >
                    Reset Password
                  </Button>
                )}
                {/* Toggle between Sign In and Sign Up */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  {!isSignUp ? (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => setIsSignUp(true)}
                    >
                      Don&apos;t have an account? Sign up here.
                    </Link>
                  ) : (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => setIsSignUp(false)}
                    >
                      Already have an account? Sign in here.
                    </Link>
                  )}
                </Box>
              </form>
            )}
          </Formik>
        </Container>
      </Box>
    </>
  )
}

export default Login