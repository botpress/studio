import { Logger } from 'botpress/sdk'
import { gaId } from 'common/stats'
import { HTTPServer } from 'core/app/server'
import { resolveStudioAsset, resolveIndexPaths } from 'core/app/server-utils'
import { BotService } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { BotpressConfig } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import { FlowService, SkillService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, checkBotVisibility, needPermissions } from 'core/security'
import { ActionServersService, ActionService, HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import express, { RequestHandler, Router } from 'express'
import rewrite from 'express-urlrewrite'
import _ from 'lodash'

import { ActionsRouter } from './actions/actions-router'
import { CMSRouter } from './cms/cms-router'
import { CodeEditorRouter } from './code-editor/code-editor-router'
import { ConfigRouter } from './config/config-router'
import { FlowsRouter } from './flows/flows-router'
import { HintsRouter } from './hints/hints-router'
import { InternalRouter } from './internal-router'
import { LibrariesRouter } from './libraries/libraries-router'
import ManageRouter from './manage/manage-router'
import MediaRouter from './media/media-router'
import { NLURouter, NLUService } from './nlu'
import { QNARouter, QNAService } from './qna'
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
  skillService: SkillService
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
  private hintsRouter: HintsRouter
  private configRouter: ConfigRouter
  private internalRouter: InternalRouter
  private libsRouter: LibrariesRouter
  private nluRouter: NLURouter
  private qnaRouter: QNARouter
  private manageRouter: ManageRouter
  private codeEditorRouter: CodeEditorRouter

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
    skillService: SkillService,
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
      qnaService,
      skillService
    }

    this.cmsRouter = new CMSRouter(studioServices)
    this.actionsRouter = new ActionsRouter(studioServices)
    this.flowsRouter = new FlowsRouter(studioServices)
    this.mediaRouter = new MediaRouter(studioServices)
    this.hintsRouter = new HintsRouter(studioServices)
    this.configRouter = new ConfigRouter(studioServices)
    this.internalRouter = new InternalRouter(studioServices)
    this.libsRouter = new LibrariesRouter(studioServices)
    this.nluRouter = new NLURouter(studioServices)
    this.qnaRouter = new QNARouter(studioServices)
    this.manageRouter = new ManageRouter(studioServices)
    this.codeEditorRouter = new CodeEditorRouter(studioServices)
  }

  async setupRoutes(app: express.Express) {
    this.botpressConfig = await this.configProvider.getBotpressConfig()

    this.actionsRouter.setupRoutes()
    this.flowsRouter.setupRoutes()
    await this.mediaRouter.setupRoutes(this.botpressConfig)
    this.hintsRouter.setupRoutes()
    this.configRouter.setupRoutes()
    this.internalRouter.setupRoutes()
    this.libsRouter.setupRoutes()
    this.nluRouter.setupRoutes()
    this.qnaRouter.setupRoutes()
    this.manageRouter.setupRoutes()
    this.codeEditorRouter.setupRoutes()

    app.use('/studio/manage', this.checkTokenHeader, this.manageRouter.router)
    app.use('/api/internal', this.internalRouter.router)

    app.use(rewrite('/studio/:botId/*env.js', '/api/v1/studio/:botId/env.js'))

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
    this.router.use('/hints', this.checkTokenHeader, this.hintsRouter.router)
    this.router.use('/libraries', this.checkTokenHeader, this.libsRouter.router)
    this.router.use('/code-editor', this.checkTokenHeader, this.codeEditorRouter.router)

    this.setupUnauthenticatedRoutes(app)
    this.setupStaticRoutes(app)
  }

  setupUnauthenticatedRoutes(app) {
    /**
     * UNAUTHENTICATED ROUTES
     * Do not return sensitive information there. These must be accessible by unauthenticated users
     */
    this.router.get(
      '/env.js',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const bot = await this.botService.findBotById(botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        const branding = await this.configProvider.getBrandingConfig('studio')
        const workspaceId = await this.workspaceService.getBotWorkspaceId(botId)
        const commonEnv = await this.httpServer.getCommonEnv()

        const segmentWriteKey = process.core_env.BP_DEBUG_SEGMENT
          ? 'OzjoqVagiw3p3o1uocuw6kd2YYjm6CHi' // Dev key from Segment
          : '7lxeXxbGysS04TvDNDOROQsFlrls9NoY' // Prod key from Segment

        const totalEnv = `
          (function(window) {
              ${commonEnv}
              window.STUDIO_VERSION = "${process.STUDIO_VERSION}";
              window.ANALYTICS_ID = "${gaId}";
              window.API_PATH = "${process.ROOT_PATH}/api/v1";
              window.BOT_API_PATH = "${process.ROOT_PATH}/api/v1/bots/${botId}";
              window.STUDIO_API_PATH = "${process.ROOT_PATH}/api/v1/studio/${botId}";
              window.BOT_ID = "${botId}";
              window.BOT_NAME = "${bot.name}";
              window.BP_BASE_PATH = "${process.ROOT_PATH}/studio/${botId}";
              window.APP_VERSION = "${process.BOTPRESS_VERSION}";
              window.APP_NAME = "${branding.title}";
              window.APP_FAVICON = "${branding.favicon}";
              window.APP_CUSTOM_CSS = "${branding.customCss}";
              window.BOT_LOCKED = ${!!bot.locked};
              window.WORKSPACE_ID = "${workspaceId}";
              window.IS_BOT_MOUNTED = ${this.botService.isBotMounted(botId)};
              window.IS_CLOUD_BOT = ${!bot.standalone}
              window.SEGMENT_WRITE_KEY = "${segmentWriteKey}";
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
