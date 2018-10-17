import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import Layout from '../components/layout'

const styles = {
  container: {
    margin: '0 auto',
    maxWidth: '1280px',
  },
  adImage: {
    display: 'block',
    margin: '0 auto',
  },
  adText: {
    margin: '25px auto',
    textAlign: 'center',
  },
}

class FacebookAd extends Component {
  render() {
    const { title, body, image_url, creative_id } = this.props.data.facebookAds
    console.log('Generating Ad Page:', creative_id)
    return (
      <Layout node={this.props.data.facebookAds}>
        {/*<h1>{title}</h1>*/}
        <div className="container" style={styles.container}>
          <img src={image_url} alt={title} style={styles.adImage} />
          <div class="adText" style={styles.adText}>
            {body}
          </div>
        </div>
      </Layout>
    )
  }
}

FacebookAd.propTypes = {
  data: PropTypes.object.isRequired,
}
export default FacebookAd

export const pageQuery = graphql`
  query fbAdQuery($slug: String!) {
    facebookAds(slug: { eq: $slug }) {
      id
      slug
      title
      body
      image_url
      creative_id
    }
  }
`

// export const query = graphql`
//   query {
//     allFacebookAds(limit: 10) {
//       edges {
//         node {
//           creative_id
//           image_url
//           body
//           title
//         }
//       }
//     }
//   }
// `

// export const pageQuery = graphql`
//   query videoQuery($slug: String!) {
//     allFacebookAds(slug: { eq: $slug }) {
//       id
//       slug
//       title
//       videoId
//     }
//   }
// `

// export const pageQuery = graphql`
// {
//   allFacebookAds(limit: 10) {
//     edges {
//       node {
//         creative_id
// 				image_url
//         body
//         title
//       }
//     }
//   }
// }
// `
