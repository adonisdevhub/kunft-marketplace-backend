import * as redis from 'redis'

import { REDIS_URL } from '@/config'

// create redis redisClient
const redisClient = redis.createClient({
  url: REDIS_URL,
})

redisClient.on('connect', function () {
  console.log(`Redis connected : ${REDIS_URL}`)
})

export default redisClient
