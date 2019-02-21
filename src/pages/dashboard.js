/*jshint esversion: 6 */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/layout'
import ProgressBar from '../components/progress-bar'
import FacebookLogin from 'react-facebook-login'

import '../../node_modules/bootstrap/dist/css/bootstrap.css'

class DashboardPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      authData: {},
      appId: null,
      isUser: false,
    }
    this.debug = true
    this.apiBaseURL = 'https://jn82y8mrx5.sse.codesandbox.io'
    this.apiAuthToken = ''
    this.apiRequestKey = 'client'
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
    const rawResponse = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    return await rawResponse.json()
  }

  parseAuthToken() {
    let result
    let parsed = Buffer.from(this.apiAuthToken, 'base64')
      .toString('ascii')
      .split(',')
    try {
      parsed = JSON.parse(parsed)
      const { fbAccountId, apiKey } = parsed
      result = {
        fbAccountId,
        apiKey,
      }
    } catch (e) {
      result = {
        fbAccountId: parsed[0],
        apiKey: parsed[1],
      }
    }
    console.warn('PARSED API', result)
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
    const query = `mutation{isUser(fbAccountId: "${id}") {exists isReady token}}`
    // Check user status by FB account ID
    const response = await this.apiRequest(this.apiRequestKey, query)
    this.handleApiError(response, true, 'checkUser')
    // Set user status to state
    this.setState({ isUser: response.data.isUser })
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
  }

  updateUser = async () => {
    console.log('AuthData', {
      authToken: this.apiAuthToken,
      parsedAuthToken: this.parseAuthToken(),
    })
    const variables = {
      adAccountId: '1804348333164926',
      apiKey: '123456',
      buildQueue: 1,
      accessToken: this.state.authData.accessToken,
    }
    const query = `mutation{updateUser(adAccountId: "${
      variables.adAccountId
    }", apiKey: "${variables.apiKey}", buildQueue: ${
      variables.buildQueue
    }, accessToken: "${variables.accessToken}") {success authToken}}`
    // Request user data update
    const response = await this.apiRequest(this.apiRequestKey, query, true)
    this.handleApiError(response, true, 'updateUser')
    // Upon success save the permanent user-ready auth token
    this.apiAuthToken = response.data.updateUser.authToken
    this.apiRequestKey = variables.apiKey
  }

  responseFacebook = response => {
    console.log('FB Auth Response', response)
    this.setState({ authData: response })
    // Check for user from API
    this.checkUser(response.id)
  }

  componentClicked(e) {
    console.log(e)
  }

  DashboardLayout = () => {
    const { isUser } = this.state
    return (
      <Layout>
        <h1> Dashboard </h1>
        <p> This is where the magic shall happen </p>
        <ul>
          <li>isUser: {isUser.exists ? 'Yes' : 'No'}</li>
          <li>isReady: {isUser.isReady ? 'Yes' : 'No'}</li>
        </ul>
        <button
          type="button"
          onClick={() => this.updateUser()}
          className="btn btn-primary"
        >
          Primary
        </button>
      </Layout>
    )
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
