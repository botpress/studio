import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { HintsService } from './hints-service'

export class HintsRouter extends CustomStudioRouter {
  protected hintsService: HintsService = new HintsService()
  protected hasRefreshed: boolean = false

  constructor(services: StudioServices) {
    super('Hints', services)
  }

  setupRoutes() {
    this.router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'), // if you can read content you can get suggestions
      this.asyncMiddleware(async (req, res) => {
        if (!this.hasRefreshed) {
          await this.hintsService.refreshAll()
          this.hasRefreshed = true // TODO: we should set this to false when  files change
        }

        const allHints = this.hintsService.getHints()
        res.send({ inputs: allHints.filter((x) => x.scope === 'inputs') })
      })
    )
  }
}
