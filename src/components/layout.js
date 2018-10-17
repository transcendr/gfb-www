import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'

import Header from './header'
import './layout.css'

const Layout = ({ children, node = {} }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <Helmet
          title={node.title || data.site.siteMetadata.title}
          meta={[
            { name: 'description', content: node.body },
            { name: 'keywords', content: '' },
            {
              name: 'google-site-verification',
              content: 'gvgaIA35NAU5AEzzGiKVqZg3FBlVOdIBz_jKAS-BLh4',
            },
          ]}
        >
          <html lang="en" />
        </Helmet>
        <Header siteTitle={node.title || data.site.siteMetadata.title} />
        <div
          style={{
            margin: '0 auto',
            maxWidth: 960,
            padding: '0px 1.0875rem 1.45rem',
            paddingTop: 0,
          }}
        >
          {children}
        </div>
      </>
    )}
  />
)

Layout.propTypes = {
  node: PropTypes.object,
  children: PropTypes.node.isRequired,
}

export default Layout
