import express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import swaggerDefinition from '../../docs/swaggerDef'

const router = express.Router()

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['server/docs/*.yml', 'server/routes/v1/*.ts'],
})

router.use('/', swaggerUi.serve)
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
  }),
)
export default router
