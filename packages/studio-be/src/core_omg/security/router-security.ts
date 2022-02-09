import { RequestWithUser } from 'common/typings'

import { NextFunction, Response } from 'express'
import { UnauthorizedError } from 'studio/utils/http-errors'
import { AuthService, WORKSPACE_HEADER } from './auth-service'

export const CSRF_TOKEN_HEADER = 'CSRF-Token'
export const CSRF_TOKEN_HEADER_LC = 'csrf-token'
export const JWT_COOKIE_NAME = 'jwtToken'

export const STANDALONE_USER = { email: 'admin', strategy: 'default', tokenVersion: 1, isSuperAdmin: true }

export const checkTokenHeader =
  (authService: AuthService, audience?: string) => async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (process.IS_STANDALONE) {
      req.tokenUser = STANDALONE_USER
      req.workspace = 'default'
      return next()
    }

    let token

    if (process.USE_JWT_COOKIES) {
      if (!req.cookies[JWT_COOKIE_NAME]) {
        return next(new UnauthorizedError(`${JWT_COOKIE_NAME} cookie is missing`))
      }

      token = req.cookies[JWT_COOKIE_NAME]
    } else {
      if (!req.headers.authorization) {
        return next(new UnauthorizedError('Authorization header is missing'))
      }

      const [scheme, bearerToken] = req.headers.authorization.split(' ')
      if (scheme.toLowerCase() !== 'bearer') {
        return next(new UnauthorizedError(`Unknown scheme "${scheme}"`))
      }

      token = bearerToken
    }

    if (!token) {
      return next(new UnauthorizedError('Authentication token is missing'))
    }

    try {
      const csrfToken = req.headers[CSRF_TOKEN_HEADER_LC] as string
      const tokenUser = await authService.checkToken(token, csrfToken, audience)

      if (!tokenUser) {
        return next(new UnauthorizedError('Token verification failed'))
      }

      req.tokenUser = tokenUser
      req.workspace = req.headers[WORKSPACE_HEADER] as string
    } catch (err) {
      return next(new UnauthorizedError('Error while validating token'))
    }

    next()
  }
