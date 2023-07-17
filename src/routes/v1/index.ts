import express from 'express'

import { APP_ENV } from '@/config'

import authRoutes from './auth.routes'
import collectionsRoutes from './collections.routes'
import corsRoutes from './cors.routes'
import docsRoutes from './docs.routes'
import tokensRoutes from './tokens.routes'
import userRoutes from './user.routes'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/cors',
    route: corsRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/user',
    route: userRoutes,
  },
  // @deprecated Use GraphQL entrypoints
  {
    path: '/collections',
    route: collectionsRoutes,
  },
  {
    path: '/tokens',
    route: tokensRoutes,
  },
]

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoutes,
  },
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

/* istanbul ignore next */
if (APP_ENV === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route)
  })
}

export default router
