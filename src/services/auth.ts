import Chance from 'chance'
import { StatusCodes } from 'http-status-codes'
import jwt, { sign as signJwt } from 'jsonwebtoken'

import { JWT_EXPIRE, JWT_SECRET } from '@/config'

import { ApiError } from '@/utils'

export interface UserSignObject {
  publicKey: string
  verified: boolean
  emailVerified: boolean
  role: string
  email: string
  id: string
  name: string
  iat: number
  exp: number
}

export const generateNonce = () => {
  const chance = new Chance()
  const nonce = chance.string({ length: 20 })

  return nonce
}

export const generateJwtToken = (signObject: any) => {
  const token = signJwt(signObject, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  })
  return token
}

export const decodeJwtToken = (token: string): UserSignObject => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    return decoded as unknown as UserSignObject
  } catch (error: any) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Authentication')
  }
}
