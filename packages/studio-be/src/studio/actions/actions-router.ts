import { Serialize } from 'cerialize'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { bpfs } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class ActionsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Actions', services)
  }

  protected bpfs: bpfs

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const service = await this.actionService.forBot(botId)
        const actions = await service.listActions()
        res.send(Serialize(actions))
      })
    )
  }
}
