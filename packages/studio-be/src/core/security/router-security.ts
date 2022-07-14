import { checkRule, CSRF_TOKEN_HEADER_LC, JWT_COOKIE_NAME, STANDALONE_USER } from 'common/auth'
import { RequestWithUser } from 'common/typings'
import { ConfigProvider } from 'core/config'
import { InvalidOperationError, ForbiddenError, NotFoundError, UnauthorizedError } from 'core/routers'
import { WorkspaceService } from 'core/users'
import { NextFunction, RequestHandler, Response } from 'express'
import { AuthService, WORKSPACE_HEADER, SERVER_USER } from './auth-service'

const debugFailure = DEBUG('audit:collab:fail')
const debugSuccess = DEBUG('audit:collab:success')

export const ALL_BOTS = '___'

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

/**
 * This method checks if the user exists, if he has access to the requested workspace, and if his role
 * allows him to do the requested operation. No other security checks should be needed.
 */
export const needPermissions =
  (workspaceService: WorkspaceService) =>
  (operation: string, resource: string) =>
  async (req: RequestWithUser, _res: Response, next: NextFunction) => {
    const err = await checkPermissions(workspaceService)(operation, resource)(req)
    return next(err)
  }

/**
 * Just like needPermissions but returns a boolean and can be used inside an express middleware
 */
export const hasPermissions =
  (workspaceService: WorkspaceService) =>
  async (req: RequestWithUser, operation: string, resource: string, noAudit?: boolean) => {
    const err = await checkPermissions(workspaceService)(operation, resource, noAudit)(req)
    return !err
  }

const checkPermissions =
  (workspaceService: WorkspaceService) =>
  (operation: string, resource: string, noAudit?: boolean) =>
  async (req: RequestWithUser) => {
    const audit = (debugMethod: Function, args?: any) => {
      if (noAudit) {
        return
      }

      debugMethod(`${req.originalUrl} %o`, {
        method: req.method,
        email: req.tokenUser?.email,
        operation,
        resource,
        ip: req.ip,
        ...args
      })
    }

    if (!req.tokenUser) {
      audit(debugFailure, { email: 'n/a', reason: 'unauthenticated' })
      return new ForbiddenError('Unauthorized')
    }

    if (!req.workspace && req.params.botId) {
      req.workspace = await workspaceService.getBotWorkspaceId(req.params.botId)
    }

    if (!req.workspace) {
      throw new InvalidOperationError('Workspace is missing. Set header X-BP-Workspace')
    }

    const { email, strategy, isSuperAdmin } = req.tokenUser

    // The server user is used internally, and has all the permissions
    if (email === SERVER_USER || isSuperAdmin) {
      audit(debugSuccess, { userRole: 'superAdmin' })
      return
    }

    if (!email || !strategy) {
      audit(debugFailure, { reason: 'missing auth parameter' })
      return new NotFoundError('Missing one of the required parameters: email or strategy')
    }

    const user = await workspaceService.findUser(email, strategy, req.workspace)

    if (!user) {
      audit(debugFailure, { reason: 'missing workspace access' })
      return new ForbiddenError(`User "${email}" doesn't have access to workspace "${req.workspace}"`)
    }

    const isBotIdValid = req.params.botId && req.params.botId !== ALL_BOTS
    if (isBotIdValid && !(await workspaceService.isBotInWorkspace(req.workspace, req.params.botId))) {
      return new NotFoundError(`Bot "${req.params.botId}" doesn't exist in workspace "${req.workspace}"`)
    }

    const role = await workspaceService.getRoleForUser(email, strategy, req.workspace)

    if (!role || !checkRule(role.rules, operation, resource)) {
      audit(debugFailure, { userRole: role?.id, reason: 'lack sufficient permissions' })
      return new ForbiddenError(`user does not have sufficient permissions to "${operation}" on resource "${resource}"`)
    }

    audit(debugSuccess, { userRole: role?.id })
  }

const mediaPathRegex = new RegExp(/^\/api\/v(\d)\/bots\/[A-Z0-9_-]+\/media\//, 'i')
export const checkBotVisibility =
  (configProvider: ConfigProvider, checkTokenHeader: RequestHandler) => async (req, res, next) => {
    // '___' is a non-valid botId, but here acts as for "all bots"
    // This is used in modules when they setup routes that work on a global level (they are not tied to a specific bot)
    // Check the 'sso-login' module for an example
    if (req.params.botId === '___' || req.originalUrl.endsWith('env')) {
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

      if (config.private && !mediaPathRegex.test(req.originalUrl)) {
        return checkTokenHeader(req, res, next)
      }
    } catch (err) {
      return next(new NotFoundError('Invalid Bot ID'))
    }

    next()
  }
