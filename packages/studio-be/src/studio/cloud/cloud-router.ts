import { UnreachableCaseError } from 'common/errors'
import { UnauthorizedError, UnexpectedError } from 'common/http'
import { BadRequestError, ConflictError, InternalServerError } from 'core/routers'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { DeployRequestSchema } from './schemas'

export class CloudRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Cloud', services)
  }

  setupRoutes() {
    this.router.post(
      '/activate',
      this.needPermissions('write', 'bot.training'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { workspaceId, personalAccessToken } = req.body

        const result = await this.cloudService.activateCloudForBot({ botId, workspaceId, personalAccessToken })

        if (result.isErr()) {
          const { error } = result

          switch (error.name) {
            case 'create_bot':
              throw new InternalServerError(error.message)
            case 'no_bot_config':
              throw new BadRequestError(error.message)
            default:
              throw new UnreachableCaseError(error)
          }
        }

        return res.sendStatus(204)
      })
    )

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
            case 'no_oauth_access_token':
              throw new InternalServerError(error.message)
            default:
              throw new UnreachableCaseError(error)
          }
        }

        return res.sendStatus(204)
      })
    )
  }
}
