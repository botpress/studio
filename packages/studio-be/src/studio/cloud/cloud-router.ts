import { UnreachableCaseError } from 'common/errors'
import { UnauthorizedError } from 'common/http'
import { BadRequestError, ConflictError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { CloudClient } from './cloud-client'
import { CloudService, CreateBotError } from './cloud-service'
import { DeployRequestSchema } from './schemas'

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

        if (deployResult.isErr()) {
          const { error } = deployResult

          if (error === 'message too large') {
            throw new BadRequestError(error)
          } else if (error === 'no bot config') {
            throw new BadRequestError(error)
          } else if (error === 'invalid pat') {
            throw new UnauthorizedError(error)
          } else if (error === 'create bot error') {
            throw new ConflictError(error.message)
          }

          throw new UnreachableCaseError(error)
        }

        return res.sendStatus(204)
      })
    )
  }
}
