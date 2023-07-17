import express from 'express'
import request from 'request'

const router = express.Router()

router.use('/', (req, res) => {
  const { url } = req.query

  // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    req.header('access-control-request-headers'),
  )

  if (req.method === 'OPTIONS') {
    // CORS Preflight
    res.send()
  } else {
    if (url === undefined || typeof url !== 'string') {
      res.status(500).send({
        error: 'There is no Target-Endpoint header in the request',
      })
      return
    }

    request(
      {
        body: req.body,
        url,
        method: req.method,
        json: req.body,
        headers: { Authorization: req.header('Authorization') },
      },
      (error) => {
        if (error) {
          console.error(`cors error: ${error}`)
        }
      },
    ).pipe(res)
  }
})

export default router
