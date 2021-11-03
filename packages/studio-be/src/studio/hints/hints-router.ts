import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class HintsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Hints', services)
  }

  setupRoutes() {
    this.router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const allHints = this.hintsService.getHintsForBot(botId)
        res.send({ inputs: allHints.filter(x => x.scope === 'inputs') })
      })
    )
  }
}
