const withSass = require('@zeit/next-sass')
module.exports = withSass({
  useFileSystemPublicRoutes: false,
  webpack: function (c) {
    if (c.resolve.alias) {
      delete c.resolve.alias['react']
      delete c.resolve.alias['react-dom']
    }
    return c
  },
  publicRuntimeConfig: {
      node_env: process.env.NODE_ENV || 'development'
  }
})
