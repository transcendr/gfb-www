const fetch = require('node-fetch')
const queryString = require('query-string')

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions

  const processAdNode = ad => {
    const nodeId = createNodeId(`ad-${ad.id}`)
    ad.creative_id = ad.id
    ad.slug = ad.id
    const nodeContent = JSON.stringify(ad)

    const nodeData = Object.assign({}, ad, {
      id: nodeId,
      slug: ad.slug,
      parent: null,
      children: [],
      internal: {
        type: `FacebookAds`,
        content: nodeContent,
        contentDigest: createContentDigest(ad),
      },
    })

    return nodeData
  }

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

  const apiOptions = queryString.stringify(configOptions)
  const apiUrl = `https://three-ear.glitch.me/?${apiOptions}`

  return (
    // Fetch a response from the apiUrl
    fetch(apiUrl)
      // Parse the response as JSON
      .then(response => response.json())
      // Process the JSON data into a node
      .then(data => {
        // For each query result (or 'hit')
        data.forEach(adNode => {
          const nodeData = processAdNode(adNode)
          createNode(nodeData)
          // console.log('Ad Node data is:', nodeData)
        })
      })
  )

  // plugin code goes here...
  console.log('Testing my plugin', configOptions)
}
