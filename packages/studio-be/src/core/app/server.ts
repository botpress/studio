import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { machineUUID } from 'common/stats'
import compression from 'compression'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { StudioConfig, ConfigProvider } from 'core/config'
import { FlowService, SkillService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { monitoringMiddleware } from 'core/routers'
import { ActionService, ActionServersService, HintsService } from 'core/user-code'
import errorHandler from 'errorhandler'
import express from 'express'
import { createServer, Server } from 'http'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import portFinder from 'portfinder'
import { NLUService } from 'studio/nlu'
import { QNAService } from 'studio/qna'
import { StudioRouter } from 'studio/studio-router'
import { URL } from 'url'

import { debugRequestMw, resolveStudioAsset } from './server-utils'

const getSocketTransports = (config: StudioConfig): string[] => {
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports && transports.length ? transports : ['websocket', 'polling']
}

@injectable()
export class HTTPServer {
  public httpServer!: Server
  public readonly app: express.Express
  private isBotpressReady = false
  private machineId!: string

  private readonly studioRouter!: StudioRouter

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'HTTP')
    private logger: Logger,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.ActionServersService) actionServersService: ActionServersService,
    @inject(TYPES.MediaServiceProvider) mediaServiceProvider: MediaServiceProvider,
    @inject(TYPES.SkillService) skillService: SkillService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HintsService) hintsService: HintsService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ObjectCache) private objectCache: MemoryObjectCache,
    @inject(TYPES.NLUService) nluService: NLUService,
    @inject(TYPES.QnaService) qnaService: QNAService
  ) {
    this.app = express()

    if (!process.IS_PRODUCTION) {
      this.app.use(errorHandler())
    }

    this.app.use(debugRequestMw)

    this.app.use(compression())

    this.studioRouter = new StudioRouter(
      logger,
      botService,
      configProvider,
      actionService,
      cmsService,
      flowService,
      ghostService,
      mediaServiceProvider,
      actionServersService,
      hintsService,
      objectCache,
      nluService,
      qnaService,
      skillService,
      this
    )
  }

  async setupRootPath() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const externalUrl = process.env.EXTERNAL_URL || botpressConfig.httpServer.externalUrl

    if (!externalUrl) {
      process.ROOT_PATH = ''
    } else {
      const pathname = new URL(externalUrl).pathname
      process.ROOT_PATH = pathname.replace(/\/+$/, '')
    }
  }

  @postConstruct()
  async initialize() {
    this.machineId = await machineUUID()
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)
    await this.setupRootPath()

    const app = express()
    app.use(process.ROOT_PATH, this.app)
    this.httpServer = createServer(app)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).then(() => {
      this.isBotpressReady = true
    })
  }

  async getCommonEnv() {
    const config = await this.configProvider.getBotpressConfig()

    return `
    window.SEND_USAGE_STATS = ${config!.sendUsageStats};
    window.EXPERIMENTAL = ${config.experimental};
    window.SOCKET_TRANSPORTS = ["${getSocketTransports(config).join('","')}"];
    window.SHOW_POWERED_BY = ${!!config.showPoweredBy};
    window.UUID = "${this.machineId}"
    window.BP_SERVER_URL = "${process.env.BP_SERVER_URL || ''}"
    window.STUDIO_PORT = ${process.PORT}
    window.MESSAGING_ENDPOINT = "${process.env.MESSAGING_ENDPOINT || ''}"
    window.RUNTIME_ENDPOINT = "${process.env.RUNTIME_ENDPOINT || ''}"`
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer

    this.app.use((req, res, next) => {
      res.removeHeader('X-Powered-By') // Removes the default X-Powered-By: Express
      res.set(config.headers)

      next()
    })

    this.app.use(monitoringMiddleware)

    this.app.use(bodyParser.json({ limit: config.bodyLimit }))
    this.app.use(bodyParser.urlencoded({ extended: true }))

    this.app.use('/assets/studio/ui', express.static(resolveStudioAsset('')))

    await this.studioRouter.setupRoutes(this.app)

    this.app.use((err, _req, _res, next) => {
      if (err.statusCode === 413) {
        this.logger.error('You may need to increase httpServer.bodyLimit in file data/global/botpress.config.json')
      }
      next(err)
    })

    this.app.use(function handleUnexpectedError(err, req, res, next) {
      const statusCode = err.statusCode || 400
      const errorCode = err.errorCode
      const message = err.message || err || 'Unexpected error'
      const details = err.details || ''
      const docs = err.docs || 'https://botpress.com/docs'
      const devOnly = process.IS_PRODUCTION ? {} : { showStackInDev: true, stack: err.stack, full: err.message }

      res.status(statusCode).json({
        statusCode,
        errorCode,
        type: err.type || Object.getPrototypeOf(err).name || 'Exception',
        message,
        details,
        docs,
        ...devOnly
      })
    })

    process.HOST = config.host
    process.PORT = await portFinder.getPortPromise({ port: process.core_env.STUDIO_PORT || config.port })
    process.LOCAL_URL = `http://localhost:${process.PORT}${process.ROOT_PATH}`
    process.EXTERNAL_URL = process.env.EXTERNAL_URL || config.externalUrl || `http://${process.HOST}:${process.PORT}`

    await Promise.fromCallback(callback => {
      this.httpServer.listen(process.PORT, undefined, config.backlog, () => callback(undefined))
    })

    this.app.use('/', (req, res) => {
      res.redirect(`/studio/${process.BOT_ID}`)
    })

    return this.app
  }
}
