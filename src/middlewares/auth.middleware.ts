import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { JWT_NAME } from '@/config'

import { decodeJwtToken } from '@/services/auth'

import { ApiError } from '@/utils'

export const auth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const token = req.cookies[JWT_NAME]
  if (token === undefined) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Authentication')
  }
  try {
    const decoded = decodeJwtToken(token)
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    req.headers.user = decoded
    next()
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: err.message || 'Internal error',
    })
  }
}
