/*jshint esversion: 6 */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/layout'
import ProgressBar from '../components/progress-bar'
import FacebookLogin from 'react-facebook-login'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'
import '../../node_modules/bootstrap/dist/css/bootstrap.css'

class DashboardPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      authData: {},
      appId: null,
      isUser: false,
      adAccounts: [],
      settings: {},
      formValid: true,
    }
    this.debug = true
    this.apiBaseURL = 'https://jn82y8mrx5.sse.codesandbox.io'
    this.apiAuthToken = ''
    this.apiRequestKey = 'client'
    this.settings = {
      apiKey: '',
      adAccountId: '',
      buildQueue: 0,
    }
  }

  componentWillMount() {
    console.log('##', 'Dashboard Component Mount')
    // Get the app ID to use for FB connect button
    this.retrieveAppId()
  }

  handleApiError(response, critical, tag) {
    const isError = !!response.errors
    if (!isError && this.debug) {
      console.group(`API Response \`${tag}\``)
      console.log(response.data)
      console.log({
        apiAuthToken: this.apiAuthToken,
        parsedAuthToken: this.parseAuthToken(),
      })
      console.groupEnd()
    }

    if (critical) {
      if (isError) {
        console.warn('API Error', response.errors)
        throw new Error(
          `API response \`${tag}\` generated critical error`,
          response.errors
        )
      }
    } else {
      if (isError) {
        console.warn('API Error', response.errors)
      }
    }
  }

  async apiRequest(path, query, authToken) {
    let rawResponse
    const body = {
      query,
    }
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    if (authToken) {
      headers['authorization'] = this.apiAuthToken
    }
    const apiUrl = `${this.apiBaseURL}/${path}`

    try {
      rawResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      return await rawResponse.json()
    } catch (e) {
      console.log('## ', 'Component Mount Error', e.message)
    }
  }

  parseAuthToken() {
    let result
    let parsed = Buffer.from(this.apiAuthToken, 'base64')
      .toString('ascii')
      .split(',')
    try {
      parsed = JSON.parse(parsed)
      const { adAccountId, fbAccountId, apiKey } = parsed
      result = {
        adAccountId,
        fbAccountId,
        apiKey,
      }
    } catch (e) {
      result = {
        fbAccountId: parsed[0],
        apiKey: parsed[1],
      }
    }
    return result
  }

  retrieveAppId = async () => {
    const query = `mutation AppId{appId}`
    const response = await this.apiRequest(this.apiRequestKey, query)
    this.handleApiError(response, true, 'retrieveAppId')
    response.data && this.setState({ appId: response.data.appId })
  }

  checkUser = async () => {
    const { id } = this.state.authData
    const query = `mutation{isUser(fbAccountId: "${id}") {exists ready token settings{adAccountId}}}`
    // Check user status by FB account ID
    const response = await this.apiRequest(this.apiRequestKey, query)
    this.handleApiError(response, true, 'checkUser')
    // Set user status to state
    this.setState({ isUser: response.data.isUser })
    // Save retrieved user settings
    this.setState({ settings: response.data.isUser.settings })
    // Save the single-use client auth token
    this.apiAuthToken = response.data.isUser.token
    // Parse and set request key
    const { apiKey } = this.parseAuthToken()
    this.apiRequestKey = !!apiKey ? apiKey : this.apiRequestKey
    // API Login
    this.loginUser()
  }

  loginUser = async () => {
    let response
    const { isUser, authData } = this.state
    const { exists } = isUser
    let settings = this.state.settings
    let query
    if (!exists) {
      // login new user with FB access token
      query = `mutation {authToken(loginToken: "${authData.accessToken}")}`
      response = await this.apiRequest(this.apiRequestKey, query)
      this.handleApiError(response, true, 'loginUser (!exists)')
    } else {
      // login existing user with single-use client token
      query = `mutation {authToken(loginToken: "${this.apiAuthToken}")}`
      response = await this.apiRequest(this.apiRequestKey, query)
      this.handleApiError(response, true, 'loginUser (exists)')
    }

    // Save the new user auth token
    this.apiAuthToken = response.data.authToken

    // Setup settings
    const { apiKey } = this.parseAuthToken()
    settings.apiKey = apiKey
    settings.accessToken = authData.accessToken
    this.setState({ settings })

    // Update user
    this.updateUser(false)

    // Set user ad accounts to state
    this.setUserAdAccounts()
  }

  setUserAdAccounts = async () => {
    let { settings } = this.state
    // Request user ad account ID's
    const query = `query {adaccounts{results{id}}}`
    const response = await this.apiRequest(this.apiRequestKey, query, true)
    this.handleApiError(response, true, 'setUserAdAccounts')
    const adAccounts = response.data.adaccounts.results
    // Set results to state
    this.setState({ adAccounts })
    // If user doesn't have saved ad account ID, set it to the first result
    settings.adAccountId = settings.adAccountId
      ? settings.adAccountId
      : adAccounts[0].id
    this.setState({ settings })
  }

  updateUser = async showMessage => {
    const { settings } = this.state
    this.apiRequestKey = settings.apiKey ? settings.apiKey : this.apiRequestKey
    // Setup iterable valid form keys
    const keys = ['adAccountId', 'apiKey', 'buildQueue', 'accessToken']
    // Iterate form keys to build request query
    let query = 'mutation{updateUser('
    for (const key of keys) {
      query += settings[key] ? `${key}: "${settings[key]}",` : ''
    }
    query = query.slice(0, -1)
    query += `) {success authToken isUser{ready}}}`
    // Request user update
    const response = await this.apiRequest(this.apiRequestKey, query, true)
    this.handleApiError(response, false, 'updateUser')
    // Check for error saving
    if (response.errors) {
      alert(
        'There was an issue saving.  Please try again, verifying that you are saving a valid API key.'
      )
    } else {
      // Upon success, show message
      if (showMessage !== false) {
        const success = { saveSuccess: 'Settings saved successfuly.' }
        this.setState({ formValid: success })
        setTimeout(() => this.setState({ formValid: {} }), 3000)
      }
      // save the permanent user-ready auth token
      this.apiAuthToken = response.data.updateUser.authToken
      this.apiRequestKey = settings.apiKey
        ? settings.apiKey
        : this.apiRequestKey
    }
  }

  responseFacebook = response => {
    console.log('FB Auth Response', response)
    this.setState({ authData: response })
    // Check for user from API
    this.checkUser(response.id)
  }

  handleFormChange = e => {
    const { target } = e
    const key = target.id.split('.')[1]
    let { settings } = this.state
    settings[key] = target.value
    this.setState({ settings })
    this.validateForm()
  }

  validateForm() {
    let formValid = {}
    const { settings } = this.state
    if (!settings.apiKey || !settings.apiKey.trim()) {
      formValid.error = 'API Key cannot be empty'
    }
    this.setState({ formValid })
    return formValid
  }

  LoadingDashboard = () => {
    return (
      <Layout>
        <div className="container">
          <div className="row">
            <div className="col-sm" />
            <div className="col-sm">
              <h3 className="text-center">Loading Dashboard...</h3>
              <p className="text-center">
                Please wait: Initializing Application...
              </p>
              <ProgressBar />
            </div>
            <div className="col-sm" />
          </div>
        </div>
      </Layout>
    )
  }

  DashboardLayout = () => {
    const { adAccounts, settings, formValid } = this.state
    const { apiKey } = this.parseAuthToken()

    const Dashboard = (
      <Layout>
        <h1> Dashboard </h1>

        <Row>
          <Col>
            <Form>
              <Form.Group controlId="settings.apiKey">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  defaultValue={apiKey}
                  onChange={e => this.handleFormChange(e)}
                  type="text"
                  placeholder="Enter a API key"
                />
              </Form.Group>
              <Form.Group controlId="settings.adAccountId">
                <Form.Label>Ad Account</Form.Label>
                <Form.Control
                  as="select"
                  value={settings.adAccountId || ''}
                  onChange={e => this.handleFormChange(e)}
                >
                  {adAccounts.map((x, index) => (
                    <option value={x.id} key={index}>
                      {x.id}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Alert
              defaultShow={false}
              show={!!formValid.error}
              variant="danger"
            >
              {formValid.error}
            </Alert>
            <Alert
              defaultShow={false}
              show={!!formValid.saveSuccess}
              variant="success"
            >
              {formValid.saveSuccess}
            </Alert>
            <Button
              disabled={!!formValid.error ? 'disabled' : ''}
              onClick={() => this.updateUser()}
            >
              Save
            </Button>
          </Col>
        </Row>
      </Layout>
    )

    const loading = <this.LoadingDashboard />

    return !!this.state.adAccounts && this.state.adAccounts.length > 0
      ? Dashboard
      : loading
  }

  LoadingFacebookLoginButton = () => {
    return (
      <Layout>
        <div className="container">
          <div className="row">
            <div className="col-sm" />
            <div className="col-sm">
              <h3 className="text-center">Loading Dashboard...</h3>
              <p className="text-center">
                Please wait: Initializing Application...
              </p>
              <ProgressBar />
            </div>
            <div className="col-sm" />
          </div>
        </div>
      </Layout>
    )
  }

  FacebookLoginButton = () => {
    const button = (
      <Layout>
        <div className="container">
          <div className="row">
            <div className="col-sm" />
            <div className="col-sm">
              <h3 className="text-center">Access Dashboard</h3>
              <p className="text-center">Use Facebook to authorize access.</p>
              <div className="mx-auto" style={{ width: '243px' }}>
                <FacebookLogin
                  appId={this.state.appId}
                  autoLoad={true}
                  fields="name,email,picture"
                  onClick={this.componentClicked}
                  callback={this.responseFacebook}
                />
              </div>
            </div>
            <div className="col-sm" />
          </div>
        </div>
      </Layout>
    )

    const loading = <this.LoadingFacebookLoginButton />

    return !!this.state.appId ? button : loading
  }

  render() {
    const { authData } = this.state
    return !!authData.accessToken ? (
      <this.DashboardLayout />
    ) : (
      <this.FacebookLoginButton />
    )
  }
}

DashboardPage.propTypes = {
  data: PropTypes.object,
}
export default DashboardPage

// import React from 'react'
// import Layout from '../components/layout'
// import FacebookLogin from 'react-facebook-login'

// let authData = {}
// const isAuthenticated = () => !!authData.accessToken

// const DashboardLayout = () => (
//   <Layout>
//     <h1> Dashboard </h1>
//     <p> This is where the magic shall happen </p>
//   </Layout>
// )

// const FacebookLoginButton = () => (
//   <FacebookLogin
//     appId="2806157496076867"
//     autoLoad={true}
//     fields="name,email,picture"
//     onClick={componentClicked}
//     callback={responseFacebook}
//   />
// )

// const responseFacebook = response => {
//   console.log('FB Response', response)
//   authData = response
// }

// const componentClicked = e => {
//   console.log(e)
// }

// const DashboardPage = () => {
//   return isAuthenticated() ? <DashboardLayout /> : <FacebookLoginButton />
// }

// export default DashboardPage
