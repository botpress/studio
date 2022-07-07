import { Logger } from 'botpress/sdk'
import { removeHtmlChars } from 'common/html'
import { gaId } from 'common/stats'
import { HTTPServer } from 'core/app/server'
import { resolveStudioAsset, resolveIndexPaths } from 'core/app/server-utils'
import { BotService } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { BotpressConfig } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import { FlowService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, checkBotVisibility } from 'core/security'
import { ActionServersService, ActionService, HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import express, { RequestHandler, Router } from 'express'
import rewrite from 'express-urlrewrite'
import _ from 'lodash'

import { ActionsRouter } from './actions/actions-router'
import { CMSRouter } from './cms/cms-router'
import { ConfigRouter } from './config/config-router'
import { FlowsRouter } from './flows/flows-router'
import { HintsRouter } from './hints/hints-router'
import { InternalRouter } from './internal-router'
import { LibrariesRouter } from './libraries/libraries-router'
import MediaRouter from './media/media-router'
import { NLURouter, NLUService } from './nlu'
import { QNARouter, QNAService } from './qna'
import { TopicsRouter } from './topics/topics-router'
import { fixStudioMappingMw } from './utils/api-mapper'

export interface StudioServices {
  logger: Logger
  authService: AuthService
  workspaceService: WorkspaceService
  botService: BotService
  configProvider: ConfigProvider
  cmsService: CMSService
  mediaServiceProvider: MediaServiceProvider
  flowService: FlowService
  actionService: ActionService
  actionServersService: ActionServersService
  hintsService: HintsService
  bpfs: GhostService
  objectCache: MemoryObjectCache
  nluService: NLUService
  qnaService: QNAService
}

export class StudioRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler

  private botpressConfig?: BotpressConfig
  private cmsRouter: CMSRouter
  private mediaRouter: MediaRouter
  private actionsRouter: ActionsRouter
  private flowsRouter: FlowsRouter
  private topicsRouter: TopicsRouter
  private hintsRouter: HintsRouter
  private configRouter: ConfigRouter
  private internalRouter: InternalRouter
  private libsRouter: LibrariesRouter
  private nluRouter: NLURouter
  private qnaRouter: QNARouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private botService: BotService,
    private configProvider: ConfigProvider,
    actionService: ActionService,
    cmsService: CMSService,
    flowService: FlowService,
    bpfs: GhostService,
    mediaServiceProvider: MediaServiceProvider,
    actionServersService: ActionServersService,
    hintsService: HintsService,
    objectCache: MemoryObjectCache,
    nluService: NLUService,
    qnaService: QNAService,
    private httpServer: HTTPServer
  ) {
    super('Studio', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    const studioServices: StudioServices = {
      logger,
      authService: this.authService,
      mediaServiceProvider,
      workspaceService,
      actionService,
      flowService,
      botService,
      configProvider,
      bpfs,
      cmsService,
      actionServersService,
      hintsService,
      objectCache,
      nluService,
      qnaService
    }

    this.cmsRouter = new CMSRouter(studioServices)
    this.actionsRouter = new ActionsRouter(studioServices)
    this.flowsRouter = new FlowsRouter(studioServices)
    this.mediaRouter = new MediaRouter(studioServices)
    this.topicsRouter = new TopicsRouter(studioServices)
    this.hintsRouter = new HintsRouter(studioServices)
    this.configRouter = new ConfigRouter(studioServices)
    this.internalRouter = new InternalRouter(studioServices)
    this.libsRouter = new LibrariesRouter(studioServices)
    this.nluRouter = new NLURouter(studioServices)
    this.qnaRouter = new QNARouter(studioServices)
  }

  async setupRoutes(app: express.Express) {
    this.botpressConfig = await this.configProvider.getBotpressConfig()

    this.actionsRouter.setupRoutes()
    this.flowsRouter.setupRoutes()
    await this.mediaRouter.setupRoutes(this.botpressConfig)
    this.topicsRouter.setupRoutes()
    this.hintsRouter.setupRoutes()
    this.configRouter.setupRoutes()
    this.internalRouter.setupRoutes()
    this.libsRouter.setupRoutes()
    this.nluRouter.setupRoutes()
    this.qnaRouter.setupRoutes()

    app.use('/api/internal', this.internalRouter.router)

    app.use(rewrite('/studio/:botId/*labeling.js', '/api/v1/studio/:botId/labeling.js'))
    app.use(rewrite('/studio/:botId/*env', '/api/v1/studio/:botId/env'))

    // TODO: Temporary in case we forgot to change it somewhere
    app.use('/api/v1/bots/:botId', fixStudioMappingMw, this.router)

    app.use('/api/v1/studio/:botId', this.router)

    // This route must be accessible even when the bot is disabled
    this.router.use('/config', this.checkTokenHeader, this.configRouter.router)

    this.router.use(checkBotVisibility(this.configProvider, this.checkTokenHeader))

    this.router.get(
      '/workspaceBotsIds',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        res.send([])
      })
    )

    this.router.use('/actions', this.checkTokenHeader, this.actionsRouter.router)
    this.router.use('/cms', this.checkTokenHeader, this.cmsRouter.router)
    this.router.use('/nlu', this.checkTokenHeader, this.nluRouter.router)
    this.router.use('/qna', this.checkTokenHeader, this.qnaRouter.router)
    this.router.use('/flows', this.checkTokenHeader, this.flowsRouter.router)
    this.router.use('/media', this.mediaRouter.router)
    this.router.use('/topics', this.checkTokenHeader, this.topicsRouter.router)
    this.router.use('/hints', this.checkTokenHeader, this.hintsRouter.router)
    this.router.use('/libraries', this.checkTokenHeader, this.libsRouter.router)

    this.setupUnauthenticatedRoutes(app)
    this.setupStaticRoutes(app)
  }

  setupUnauthenticatedRoutes(app) {
    /**
     * UNAUTHENTICATED ROUTES
     * Do not return sensitive information there. These must be accessible by unauthenticated users
     */
    this.router.get(
      '/env',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const bot = await this.botService.findBotById(botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        const workspaceId = await this.workspaceService.getBotWorkspaceId(botId)
        const commonEnv = await this.httpServer.getCommonEnv()

        const segmentWriteKey = process.core_env.BP_DEBUG_SEGMENT
          ? 'OzjoqVagiw3p3o1uocuw6kd2YYjm6CHi' // Dev key from Segment
          : '7lxeXxbGysS04TvDNDOROQsFlrls9NoY' // Prod key from Segment

        const totalEnv = {
          ...commonEnv,
          STUDIO_VERSION: process.STUDIO_VERSION,
          ANALYTICS_ID: gaId,
          API_PATH: `${process.ROOT_PATH}/api/v1`,
          BOT_API_PATH: `${process.ROOT_PATH}/api/v1/bots/${botId}`,
          STUDIO_API_PATH: `${process.ROOT_PATH}/api/v1/studio/${botId}`,
          BOT_ID: botId,
          BOT_NAME: bot.name,
          BP_BASE_PATH: `${process.ROOT_PATH}/studio/${botId}`,
          APP_VERSION: process.BOTPRESS_VERSION,
          BOT_LOCKED: !!bot.locked,
          USE_ONEFLOW: !!bot['oneflow'],
          WORKSPACE_ID: workspaceId,
          IS_BOT_MOUNTED: this.botService.isBotMounted(botId),
          SEGMENT_WRITE_KEY: segmentWriteKey,
          IS_PRO_ENABLED: process.IS_PRO_ENABLED
        }

        res.send(totalEnv)
      })
    )

    this.router.get(
      '/labeling.js',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const bot = await this.botService.findBotById(botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        const branding = await this.configProvider.getBrandingConfig('studio')

        const totalEnv = `
          (function(window) {
              window.APP_NAME = "${removeHtmlChars(branding.title)}";
              window.APP_FAVICON = "${removeHtmlChars(branding.favicon)}";
              window.APP_CUSTOM_CSS = "${removeHtmlChars(branding.customCss)}";
            })(typeof window != 'undefined' ? window : {})
          `

        res.contentType('text/javascript')
        res.send(totalEnv)
      })
    )
  }

  setupStaticRoutes(app) {
    //  app.get('/studio', (req, res, next) => res.redirect('/admin'))

    app.use('/:app(studio)/:botId', express.static(resolveStudioAsset('public'), { index: false }))
    app.use('/:app(studio)/:botId', resolveIndexPaths('public/index.html'))

    app.get(['/:app(studio)/:botId/*'], resolveIndexPaths('public/index.html'))
  }
}
