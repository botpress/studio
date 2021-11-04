import * as sdk from 'botpress/sdk'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { StudioConfig, ConfigProvider } from 'core/config'
import { LoggerFilePersister, LoggerProvider } from 'core/logger'
import { MigrationService } from 'core/migration'
import { copyDir } from 'core/misc/pkg-fs'
import { RealtimeService } from 'core/realtime'
import { HintsService } from 'core/user-code'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import { NLUService } from 'studio/nlu'

import { setDebugScopes } from '../../debug'
import { HTTPServer } from './server'
import { TYPES } from './types'

export interface StartOptions {
  modules: sdk.ModuleEntryPoint[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  config!: StudioConfig | undefined
  api!: typeof sdk
  _heartbeatTimer?: NodeJS.Timeout

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.HintsService) private hintsService: HintsService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.NLUService) private nluService: NLUService,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.LoggerFilePersister) private loggerFilePersister: LoggerFilePersister,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.MigrationService) private migrationService: MigrationService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService
  ) {
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  async start() {
    const beforeDt = moment()
    await this.initialize()
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Started in ${bootTime}ms`)
  }

  private async initialize() {
    this.config = await this.configProvider.getBotpressConfig()
    this.migrationService.botService = this.botService

    setDebugScopes(process.core_env.DEBUG || '')

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.checkNLUEndpoint()
    await this.initializeServices()
    await this.deployAssets()
    await this.startServer()
    await this.startRealtime()
    await this.discoverBots()

    AppLifecycle.setDone(AppLifecycleEvents.BOTPRESS_READY)
  }

  async checkNLUEndpoint() {
    process.NLU_ENDPOINT = process.env.NLU_ENDPOINT
  }

  async deployAssets() {
    try {
      const assets = path.resolve(process.TEMP_LOCATION, 'assets/studio/ui')

      // Avoids overwriting the folder when developing locally on the studio
      if (fse.pathExistsSync(`${assets}/public`)) {
        const studioPath = fse.lstatSync(`${assets}/public`)
        if (studioPath.isSymbolicLink()) {
          return
        }
      }

      await copyDir(path.join(__dirname, '../../ui'), assets)
    } catch (err) {
      this.logger.attachError(err).error('Error deploying assets')
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(): Promise<void> {
    if (!(await fse.pathExists(path.resolve(process.BOT_LOCATION, 'bot.config.json')))) {
      const template = process.TEMPLATE_ID
      this.logger.info(`Bot ${process.BOT_ID} doesn't exist, creating from template "${template}"`)

      await this.botService.addBot({ id: process.BOT_ID }, { id: template })
    }

    await this.botService.mountBot(process.BOT_ID)
  }

  private async initializeServices() {
    await this.loggerFilePersister.initialize(this.config!, await this.loggerProvider('LogFilePersister'))
    await this.cmsService.initialize()
    await this.nluService.initialize()

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.hintsService.refreshAll()

    AppLifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  private async startRealtime() {
    await this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }

  private async startServer() {
    await this.httpServer.start()
    AppLifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }
}
