import { Logger } from 'botpress/sdk'
import { AsyncMiddleware, asyncMiddleware } from 'common/http'
import { BotService } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { ConfigProvider } from 'core/config/config-loader'
import { FlowService, SkillService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { ActionServersService, ActionService, HintsService } from 'core/user-code'
import { Router } from 'express'
import { NLUService } from 'studio/nlu'
import { QNAService } from 'studio/qna'
import { StudioServices } from 'studio/studio-router'

export abstract class CustomStudioRouter {
  protected logger: Logger
  protected configProvider: ConfigProvider
  protected botService: BotService
  protected mediaServiceProvider: MediaServiceProvider
  protected cmsService: CMSService
  protected flowService: FlowService
  protected actionService: ActionService
  protected actionServersService: ActionServersService
  protected hintsService: HintsService
  protected skillService: SkillService
  protected bpfs: GhostService
  protected objectCache: MemoryObjectCache
  protected nluService: NLUService
  protected qnaService: QNAService

  protected readonly asyncMiddleware: AsyncMiddleware

  public readonly router: Router

  constructor(name: string, services: StudioServices) {
    this.asyncMiddleware = asyncMiddleware(services.logger, name)

    this.router = Router({ mergeParams: true })

    this.logger = services.logger
    this.configProvider = services.configProvider
    this.botService = services.botService
    this.mediaServiceProvider = services.mediaServiceProvider
    this.cmsService = services.cmsService
    this.flowService = services.flowService
    this.actionService = services.actionService
    this.actionServersService = services.actionServersService
    this.bpfs = services.bpfs
    this.hintsService = services.hintsService
    this.skillService = services.skillService
    this.objectCache = services.objectCache
    this.nluService = services.nluService
    this.qnaService = services.qnaService
  }
}
