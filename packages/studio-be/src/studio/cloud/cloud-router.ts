import { UnreachableCaseError } from 'common/errors'
import { UnauthorizedError, UnexpectedError } from 'common/http'
import { BadRequestError, ConflictError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { CloudClient } from './cloud-client'
import { CloudService } from './cloud-service'
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

          switch (error.name) {
            case 'no_bot_config':
              throw new BadRequestError(error.message)
            case 'invalid_pat':
              throw new UnauthorizedError(error.message)
            case 'message_too_large':
              throw new BadRequestError(
                `Message too large. Max size is ${error.info.maxSize} bytes. Current size is ${error.info.actualSize} bytes`
              )
            case 'create_bot':
              throw new ConflictError(error.message)
            case 'bot_not_uploadable':
              throw new UnexpectedError(error.message)
            default:
              throw new UnreachableCaseError(error)
          }
        }

        return res.sendStatus(204)
      })
    )
  }
}
