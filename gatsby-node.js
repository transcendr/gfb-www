const path = require('path')

exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators
  return new Promise((resolve, reject) => {
    const FBAdPageTemplate = path.resolve('src/templates/facebook-ad.js')
    resolve(
      graphql(`
        {
          allFacebookAds(limit: 1000) {
            edges {
              node {
                id
                slug
              }
            }
          }
        }
      `).then(result => {
        if (result.errors) {
          console.log('ERROR', result.errors)
          reject(result.errors)
        } else {
          console.log('SUCCESS', result)
        }

        result.data.allFacebookAds.edges.forEach(edge => {
          createPage({
            path: edge.node.slug,
            component: FBAdPageTemplate,
            context: {
              slug: edge.node.slug,
            },
          })
        })
        return
      })
    )
  })
}
