const nextRoutes = require('next-routes')
const routes = module.exports = nextRoutes()

routes
.add({name: 'index', pattern: '/', page: 'index'})

.add({name: 'projects', pattern: '/projects', page: 'page'})
.add({name: 'career', pattern: '/career', page: 'page'})
.add({name: 'blog', pattern: '/blog', page: 'page'})
.add({name: 'about', pattern: '/about', page: 'page'})

.add({name: 'projectview', pattern: '/projects/:slug', page: 'page'})
.add({name: 'careerview', pattern: '/career/:slug', page: 'page'})
.add({name: 'blogview', pattern: '/blog/:slug', page: 'page'})


//.add({name: 'posttype', pattern: '/:posttype', page: 'list'})
//.add({name: 'posttype/:slug', pattern: '/:posttype/:slug', page: 'list'})
