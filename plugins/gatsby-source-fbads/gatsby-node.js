const fetch = require('node-fetch')
const queryString = require('query-string')

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
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

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

  const apiOptions = queryString.stringify(configOptions)

  const apiUrl = `https://jn82y8mrx5.sse.codesandbox.io/build`

  const fetchAds = async after => {
    const body = {
      query:
        'query GetAdCreatives($limit: Int, $after: String) {adcreatives(limit: $limit, after: $after) {results {id,title,body,image_url},hasMore,after}}',
      variables: {
        limit: 25,
        after: after,
      },
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
    const response = await fetchAds(after)
    let data = response.data && response.data.adcreatives
    const numResults = data.results.length

    if ((!data && totalProcessed > 0) || numResults < 25) {
      countGenerated += numResults
      console.log(
        `\n--------------------------------\nCOMPLETE: All ${countGenerated} Ads Generated to Pages\n`
      )
      return
    } else if (!data && totalProcessed === 0) {
      data = sampleData.data.adcreatives
    }

    countGenerated += data.results.length

    // For each query result (or 'hit')
    data.results.forEach(adNode => {
      console.log('\nProcessing Ad ID >>>', adNode.id)
      totalProcessed++
      const nodeData = processAdNode(adNode)
      createNode(nodeData)
    })

    // Run recursively until no 'after' cursor is present
    if (data.after) {
      processAPIRequest(data.after)
    }
  }

  return processAPIRequest()
}
