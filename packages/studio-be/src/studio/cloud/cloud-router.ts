import { BadRequestError, InternalServerError, UnauthorizedError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import VError from 'verror'
import { CloudClient } from './cloud-client'
import { CloudService } from './cloud-service'
import { NAMES } from './errors'

export class CloudRouter extends CustomStudioRouter {
  private readonly cloudService: CloudService

  constructor(services: StudioServices) {
    super('Cloud', services)

    this.cloudService = new CloudService(
      new CloudClient(services.logger),
      services.authService,
      services.botService,
      services.nluService
    )
  }

  setupRoutes() {
    this.router.post(
      '/deploy',
      this.asyncMiddleware(async (req, res) => {
        const { tokenUser } = req
        const botId = req.params.botId
        const workspaceId = req.body.workspaceId

        if (!tokenUser) {
          throw new UnauthorizedError('No authenticated user')
        }

        try {
          await this.cloudService.deployBot({ tokenUser, botId, workspaceId })
        } catch (e) {
          if (e instanceof VError) {
            if (e.name === NAMES.cannot_find_user || e.name === NAMES.no_personal_access_token) {
              throw new UnauthorizedError(e.message)
            }
            if (e.name === NAMES.too_large_message) {
              throw new BadRequestError(e.message)
            }
            throw new InternalServerError(e.message)
          }
          if (e instanceof Error) {
            throw new InternalServerError(e.message)
          }
          throw new InternalServerError(`unexpected error: ${e}`)
        }

        res.end()
      })
    )
  }
}
