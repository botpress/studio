import { FlowGeneratorMetadata, Logger } from 'botpress/sdk'
import { UnexpectedError } from 'common/http'
import { BotService } from 'core/bots'
import { SkillService } from 'core/dialog'
import { ModuleLoader } from 'core/modules'
import { CustomRouter } from 'core/routers/customRouter'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import yn from 'yn'

export class ModulesRouter extends CustomRouter {
  constructor(
    private logger: Logger,
    private moduleLoader: ModuleLoader,
    private skillService: SkillService,
    private botService: BotService
  ) {
    super('Modules', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get('/', (_req, res) => {
      res.json(this.moduleLoader.getLoadedModules())
    })

    this.router.get(
      '/skills',
      this.asyncMiddleware(async (_req, res, _next) => {
        res.send(await this.moduleLoader.getAllSkills())
      })
    )

    this.router.post(
      '/:moduleName/skill/:skillId/generateFlow',
      this.asyncMiddleware(async (req, res) => {
        const flowGenerator = this.moduleLoader.getFlowGenerator(req.params.moduleName, req.params.skillId)
        if (!flowGenerator) {
          return res.status(404).send('Invalid module name or flow name')
        }

        try {
          const metadata: FlowGeneratorMetadata = {
            botId: req.query.botId?.toString() || ''
          }
          res.send(this.skillService.finalizeFlow(await flowGenerator(req.body, metadata)))
        } catch (err) {
          throw new UnexpectedError('Could not generate flow', err)
        }
      })
    )

    this.router.get(
      '/translations',
      this.asyncMiddleware(async (req, res, _next) => {
        const moduleTranslations = await this.moduleLoader.getTranslations()
        const botTranslations = await this.botService.getBotTranslations(req.query.botId as string)

        res.send(_.merge({}, moduleTranslations, botTranslations))
      })
    )
  }
}
