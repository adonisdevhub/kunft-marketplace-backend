import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { ApolloServer } from 'apollo-server-express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import responseTime from 'response-time'

import { APP_ENV, MONGODB_URL, PORT, SENTRY_DSN } from '@/config'

// import redisClient from '@/providers/redis'
import apiRouter from '@/routes'

import { authLimiter } from './middlewares'
import { startMarketplaceEventStream } from './web3/event'

import config from '@/graphql'

async function startServer() {
  await mongoose.connect(MONGODB_URL).then(() => {
    console.info(`Connected to ${MONGODB_URL}`)
  })

  // await redisClient.connect()

  const server = express()

  if (SENTRY_DSN)
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app: server }),
      ],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    })

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  server.use(Sentry.Handlers.requestHandler())
  // TracingHandler creates a trace for every incoming request
  server.use(Sentry.Handlers.tracingHandler())

  server.use(cors())
  server.use(express.json({ limit: '25mb' }))
  server.use(express.urlencoded({ limit: '25mb', extended: true }))
  server.use(cookieParser())
  server.use(morgan('dev'))

  server.use(responseTime())

  const apolloServer = new ApolloServer(config)
  await apolloServer.start()
  apolloServer.applyMiddleware({
    app: server,
    path: '/graphql',
  })

  // limit repeated failed requests to auth endpoints
  if (APP_ENV !== 'development') {
    server.use('/v1/auth', authLimiter)
  }
  server.use(apiRouter)

  server.use(Sentry.Handlers.errorHandler())

  server.use(function onError(
    err: Error,
    req: express.Request,
    res: express.Response,
  ) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500
    res.end((res as any).sentry + '\n')
  })

  server.listen(PORT, () => {
    try {
      startMarketplaceEventStream()
    } catch (err: any) {
      console.error(`***Marketplace EventStream Error***`)
      console.error(err)
      console.error(`*** ***`)
    }

    console.info(`Server is running on ${PORT}`)
  })
}

startServer()

process.on('uncaughtException', function (err) {
  Sentry.captureException(err)
})
