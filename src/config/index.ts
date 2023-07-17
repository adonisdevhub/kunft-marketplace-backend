/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv'

import contrats from './contracts'

dotenv.config()

const PORT = process.env.PORT || 8000
const { SENTRY_DSN, NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS } = process.env

const NEXT_PUBLIC_CASPER_NODE_ADDRESS =
  process.env.NEXT_PUBLIC_CASPER_NODE_ADDRESS!
const NEXT_PUBLIC_CASPER_CHAIN_NAME = process.env
  .NEXT_PUBLIC_CASPER_CHAIN_NAME! as CasperChainName

type CasperChainName = 'casper' | 'casper-test'

const NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH =
  contrats.marketplace[NEXT_PUBLIC_CASPER_CHAIN_NAME].contractPackageHash

const MONGODB_URL = process.env.MONGODB_URL!
const REDIS_URL = process.env.REDIS_URL!
const NODE_ENV = (process.env.NODE_ENV || 'development') as
  | 'development'
  | 'production'

const APP_ENV = NODE_ENV

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'r4u7x!A%D*G-KaPdSgVkXp2s5v8y/B?E(H+MbQeThWmZq3t6w9z$C&F)J@NcRfUjXn2r5u7x!A%D*G-KaPdSgVkYp3s6v9y/B?E(H+MbQeThWmZq4t7w!z%C&F)J@NcRfUjXn2r5u8x/A?D(G-KaPdSgVkYp3s6v9y$B&E)H@MbQeThWmZq4t7w!z%C*F-JaNdRfUjXn2r5u8x/A?D(G+KbPeShVmYp3s6v9y$B&E)H@McQfTjWnZr4t7w!z%C*F-JaNdRgUkXp2s5v8x/A?D(G+KbPeShVmYq3t6w9z$B&E)H@McQfTjWnZr4u7x!A%D*F-JaNdRgUkXp2s5v8y/B?E(H+KbPeShVmYq3t6w9z$C&F)J@NcQfTjWnZr4u7x!A%D*G-KaPdSgUkXp2s5v8y/B?E(H+MbQeThWmYq3t6w9z$C&F)J@NcRfUjXn2r4u7x!A%D*G-KaPdSgVkYp3s6v8y/B?E(H+MbQeThWmZq4t7w!z$C&F)J@NcRfUjXn'
const JWT_EXPIRE = 15 * 24 * 3600
const JWT_NAME = 'kunft'

export {
  APP_ENV,
  JWT_EXPIRE,
  JWT_NAME,
  JWT_SECRET,
  MONGODB_URL,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH,
  NODE_ENV,
  PORT,
  REDIS_URL,
  SENTRY_DSN,
}
