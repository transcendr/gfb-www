module.exports = {
  siteMetadata: {
    title: 'Gatsby FB Manager',
  },
  plugins: [
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
