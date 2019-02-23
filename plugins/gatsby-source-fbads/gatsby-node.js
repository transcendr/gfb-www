const fetch = require('node-fetch')
const queryString = require('query-string')

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  let cycles = 0
  let complete = { more: true }
  let totalProcessed = 0
  const { createNode } = actions

  const sampleData = {
    data: {
      adcreatives: {
        results: [
          {
            id: '1',
            title: 'title',
            body: 'body',
            image_url: 'image',
          },
        ],
      },
    },
    hasMore: false,
  }

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

  // Generate at least one node
  const sampleNodeData = processAdNode(sampleData.data.adcreatives.results[0])
  createNode(sampleNodeData)

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

  const apiOptions = queryString.stringify(configOptions)

  // const apiUrl = `https://jn82y8mrx5.sse.codesandbox.io/build`
  const apiUrl = `https://gfb-apollo.herokuapp.com/build`

  const fetchAds = async after => {
    const body = {
      query: `query {adcreatives(limit: 25, after: "${after}") {results {id,title,body,image_url},hasMore,after}}`,
    }
    const rawResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await rawResponse.json()

    if (data.errors && data.errors.length > 0) {
      console.log('\nAPI BUILD ERROR:', data.errors[0].message, '\n\n')
      if (totalProcessed === 0) return sampleData
    }

    return data
  }

  let countGenerated = 0

  const processAPIRequest = async after => {
    cycles++
    const response = await fetchAds(after)
    let data = response.data && response.data.adcreatives
    const numResults = data && data.results ? data.results.length : 0

    if (numResults < 25) {
      countGenerated += numResults
      console.log(
        `\n--------------------------------\nCOMPLETE: All ${countGenerated} Ads Generated to Pages\n`
      )
      return { more: false }
    }

    countGenerated += data.results.length

    // For each query result (or 'hit')
    data.results.forEach(adNode => {
      console.log('\nProcessing Ad ID >>>', adNode.id)
      totalProcessed++
      const nodeData = processAdNode(adNode)
      createNode(nodeData)
    })

    if (data.after) {
      return {
        more: true,
        after: data.after,
      }
    } else {
      return {
        more: false,
      }
    }
  }

  while (complete.more) {
    console.log('\n\nCompleted Cycles', cycles, '\n\n')
    complete = await processAPIRequest(complete.after)
  }
}
