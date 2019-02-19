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
    }
    this.apiBaseURL = 'https://jn82y8mrx5.sse.codesandbox.io'
  }

  componentWillMount() {
    console.log('##', 'Dashboard Component Mount')
    this.retrieveAppId()
  }

  async apiRequest(path, query, variables) {
    const body = {
      query,
      variables,
    }
    const apiUrl = `${this.apiBaseURL}/${path}`
    const rawResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    return await rawResponse.json()
  }

  retrieveAppId = async () => {
    const query = `mutation AppId{appId}`
    const response = await this.apiRequest('/appId', query)
    response.data && this.setState({ appId: response.data.appId })
  }

  responseFacebook = response => {
    console.log('FB Response', response)
    // this.setState({ authData: response })
  }

  componentClicked(e) {
    console.log(e)
  }

  DashboardLayout = () => {
    return (
      <Layout>
        <h1> Dashboard </h1>
        <p> This is where the magic shall happen </p>
        <button type="button" className="btn btn-primary">
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
    console.log('Rendering', authData)
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
