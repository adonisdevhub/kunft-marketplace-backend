import express from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { APP_ENV } from '@/config'
import logger from '@/config/logger'

import { ApiError } from '@/utils'

export const errorConverter = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  let error = err
  if (!(error instanceof ApiError)) {
    const statusCode =
      // @ts-ignore
      error.statusCode || error instanceof mongoose.Error
        ? StatusCodes.BAD_REQUEST
        : StatusCodes.INTERNAL_SERVER_ERROR
    const message = error.message || StatusCodes[statusCode]
    error = new ApiError(statusCode, message, false, err.stack)
  }
  next(error)
}

export const errorHandler = (
  err: ApiError,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  console.error(err)
  let { statusCode, message } = err
  if (APP_ENV === 'production' && !err.isOperational) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    message = StatusCodes[StatusCodes.INTERNAL_SERVER_ERROR]
  }

  res.locals.errorMessage = err.message

  const response = {
    code: statusCode,
    message,
    ...(APP_ENV === 'development' && { stack: err.stack }),
  }

  if (APP_ENV === 'development') {
    logger.error(err)
  }

  res.status(statusCode).send(response)
}
