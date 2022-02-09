import { BotConfig } from 'botpress/sdk'
import { Serialize } from 'cerialize' // TODO: we don't use this lib
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { Instance } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class ConfigRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Config', services)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const botConfig: BotConfig = await Instance.readFile('bot.config.json').then((buf) =>
          JSON.parse(buf.toString())
        )
        res.send(botConfig)
      })
    )

    router.post(
      '/',
      this.needPermissions('write', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const botConfig = <BotConfig>req.body
        await Instance.upsertFile('bot.config.json', JSON.stringify(botConfig))
        res.send({ botId })
      })
    )
  }
}
