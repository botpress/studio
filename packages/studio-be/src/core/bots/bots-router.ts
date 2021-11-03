import { Logger } from 'botpress/sdk'
import { BotService } from 'core/bots'
import { ConfigProvider } from 'core/config'
import { checkBotVisibility } from 'core/security'
import express, { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../routers/customRouter'

export class BotsRouter extends CustomRouter {
  constructor(private botService: BotService, private configProvider: ConfigProvider, private logger: Logger) {
    super('Bots', logger, Router({ mergeParams: true }))
  }

  async setupRoutes(app: express.Express) {
    app.use('/api/v1/bots/:botId', this.router)
    this.router.use(checkBotVisibility(this.configProvider))

    this.router.get(
      '/workspaceBotsIds',
      this.asyncMiddleware(async (req, res) => {
        res.send([])
      })
    )

    this.router.get(
      '/export',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const tarball = await this.botService.exportBot(botId)

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=bot_${botId}_${Date.now()}.tgz`,
          'Content-Length': tarball.length
        })
        res.end(tarball)
      })
    )

    this.router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const bot = await this.botService.findBotById(req.params.botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        res.send(bot)
      })
    )
  }
}
