module.exports = {
  siteMetadata: {
    title: 'Gatsby Default Starter',
  },
  plugins: [
    {
      resolve: `gatsby-source-contentful`,
      options: {
        spaceId: '67jsh0m93kts',
        accessToken:
          'd967421986af9d85c4c0570cef07b930ac9d4ebfd83643676f929fe55c36e6e6',
      },
    },
    {
      resolve: 'gatsby-source-fbads',
      options: {
        key: 'secure_key',
        q: 'another_param',
      },
    },
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
      },
    },
    'gatsby-plugin-offline',
  ],
}
