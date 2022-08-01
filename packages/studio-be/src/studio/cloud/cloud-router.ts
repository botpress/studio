import { UnreachableCaseError } from 'common/errors'
import { UnauthorizedError } from 'common/http'
import { BadRequestError, ConflictError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { CloudClient } from './cloud-client'
import { CloudService } from './cloud-service'
import { CreateBotError } from './errors'
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
        const parseResult = DeployRequestSchema.safeParse(req)
        if (!parseResult.success) {
          throw new BadRequestError(parseResult.error.message)
        }

        const {
          params: { botId },
          body: { workspaceId, personalAccessToken }
        } = parseResult.data

        const deployResult = await this.cloudService.deployBot({ personalAccessToken, botId, workspaceId })

        if (deployResult.err) {
          const { val } = deployResult

          if (val === 'message too large') {
            throw new BadRequestError(val)
          } else if (val === 'no bot config') {
            throw new BadRequestError(val)
          } else if (val === 'invalid pat') {
            throw new UnauthorizedError(val)
          } else if (val instanceof CreateBotError) {
            throw new ConflictError(val.message)
          }

          throw new UnreachableCaseError(val)
        }

        return res.sendStatus(204)
      })
    )
  }
}
