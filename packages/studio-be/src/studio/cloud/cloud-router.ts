import { BadRequestError, InternalServerError, UnauthorizedError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import VError from 'verror'
import { CloudClient } from './cloud-client'
import { CloudService } from './cloud-service'
import { NAMES } from './errors'
import { DeployRequestSchema } from './validation'

export class CloudRouter extends CustomStudioRouter {
  private readonly cloudService: CloudService

  constructor(services: StudioServices) {
    super('Cloud', services)

    this.cloudService = new CloudService(new CloudClient(services.logger), services.botService, services.nluService)
  }

  setupRoutes() {
    this.router.post(
      '/deploy',
      this.asyncMiddleware(async (req, res) => {
        const result = DeployRequestSchema.safeParse(req)
        if (!result.success) {
          throw new BadRequestError(result.error.message)
        }

        const {
          params: { botId },
          body: { workspaceId, personalAccessToken }
        } = result.data

        try {
          await this.cloudService.deployBot({ personalAccessToken, botId, workspaceId })
        } catch (e) {
          if (e instanceof VError) {
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

        return res.sendStatus(204)
      })
    )
  }
}
