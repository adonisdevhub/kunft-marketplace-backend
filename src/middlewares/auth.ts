import express from 'express'
import { StatusCodes } from 'http-status-codes'
import passport from 'passport'

import { roleRights } from '@/config/roles'

import { ApiError } from '@/utils'

const verifyCallback =
  (req: express.Request, resolve: any, reject: any, requiredRights: string[]) =>
  async (err: any, user: any, info: any) => {
    if (err || info || !user) {
      return reject(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'),
      )
    }
    req.headers.user = user

    if (requiredRights.length) {
      const userRights = roleRights.get(user.role)
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        // @ts-ignore
        userRights.includes(requiredRight),
      )
      if (!hasRequiredRights && req.params.userId !== user.id) {
        return reject(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'))
      }
    }

    resolve()
  }

const auth =
  (...requiredRights: string[]) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights),
      )(req, res, next)
    })
      .then(() => next())
      .catch((err) => next(err))
  }
export default auth
