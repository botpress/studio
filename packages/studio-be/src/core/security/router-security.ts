import { checkRule, CSRF_TOKEN_HEADER_LC, JWT_COOKIE_NAME, STANDALONE_USER } from 'common/auth'
import { RequestWithUser } from 'common/typings'
import { ConfigProvider } from 'core/config'
import { NotFoundError, UnauthorizedError } from 'core/routers'
import { WorkspaceService } from 'core/users'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { AuthService, WORKSPACE_HEADER, SERVER_USER } from './auth-service'

export const checkTokenHeader = (authService: AuthService, audience?: string) => async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  req.tokenUser = STANDALONE_USER
  req.workspace = 'default'

  next()
}

/**
 * This method checks if the user exists, if he has access to the requested workspace, and if his role
 * allows him to do the requested operation. No other security checks should be needed.
 */
export const needPermissions = (workspaceService: WorkspaceService) => (operation: string, resource: string) => async (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  return next()
}

/**
 * Just like needPermissions but returns a boolean and can be used inside an express middleware
 */
export const hasPermissions = (workspaceService: WorkspaceService) => async (
  req: RequestWithUser,
  operation: string,
  resource: string,
  noAudit?: boolean
) => {
  return true
}

export const checkBotVisibility = (configProvider: ConfigProvider) => async (req, res, next) => {
  // '___' is a non-valid botId, but here acts as for "all bots"
  // This is used in modules when they setup routes that work on a global level (they are not tied to a specific bot)
  // Check the 'sso-login' module for an example
  if (req.params.botId === '___' || req.originalUrl.endsWith('env.js')) {
    return next()
  }

  try {
    const config = await configProvider.getBotConfig(req.params.botId)
    if (config.disabled) {
      // The user must be able to get the config to change the bot status
      if (req.originalUrl.endsWith(`/api/v1/studio/${req.params.botId}/config`)) {
        return next()
      }

      return next(new NotFoundError('Bot is disabled'))
    }
  } catch (err) {
    return next(new NotFoundError('Invalid Bot ID'))
  }

  next()
}
