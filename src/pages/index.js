import React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'

const PostLink = ({ node }) => {
  return (
    <li>
      <Link to={node.slug}>
        {node.title || 'Untitled Ad: ' + node.creative_id}
      </Link>
    </li>
  )
}

const IndexPage = ({ data }) => (
  <Layout node={{}}>
    <ul>
      {data.allFacebookAds.edges.map(edge => (
        <PostLink node={edge.node} key={edge.node.id} />
      ))}
    </ul>
  </Layout>
)

export default IndexPage

export const pageQuery = graphql`
  query pageQuery {
    allFacebookAds {
      edges {
        node {
          id
          title
          slug
          creative_id
        }
      }
    }
  }
`
