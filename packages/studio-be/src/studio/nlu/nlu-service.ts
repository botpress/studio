import { Specifications as StanSpecifications } from '@botpress/nlu-client'
import { Logger } from 'botpress/sdk'
import { NLUProgressEvent, Training as BpTraining } from 'common/nlu-training'
import { coreActions } from 'core/app/core-client'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import yn from 'yn'
import { BotFactory, BotStateMachine } from './bot'
import { DefinitionsRepository } from './definitions-repository'
import { EntityRepository } from './entities-repo'
import { BotNotMountedError, NLUServiceNotInitializedError } from './errors'
import { IntentRepository } from './intent-repo'
import { ModelEntryRepository } from './model-entry'
import { NLUClient } from './nlu-client'
import { ConfigResolver } from './typings'

interface ServerInfo {
  specs: StanSpecifications
  languages: string[]
}

interface SubServices {
  baseClient: NLUClient
  botFactory: BotFactory
  queueTrainingsOnBotMount: boolean
}

@injectable()
export class NLUService {
  public entities: EntityRepository
  public intents: IntentRepository

  private _bots: _.Dictionary<BotStateMachine> = {}
  private _app: SubServices | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private _logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {
    this.entities = new EntityRepository(this.ghost, this)
    this.intents = new IntentRepository(this.ghost, this)
  }

  public isReady(): boolean {
    return !!this._app
  }

  public async initialize() {
    if (!process.NLU_ENDPOINT) {
      throw new Error('NLU Service expects variable "NLU_ENDPOINT" to be set.')
    }

    const { nlu: nluConfig } = await this.configProvider.getBotpressConfig()
    const { queueTrainingOnBotMount } = nluConfig
    const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)

    const baseClient = new NLUClient({
      baseURL: process.NLU_ENDPOINT
    })

    const socket = this._getWebsocket()

    const modelRepo = new ModelEntryRepository(this.database.knex)
    await modelRepo.initialize()

    const configResolver: ConfigResolver = {
      getBotById: this.configProvider.getBotConfig.bind(this.configProvider),
      mergeBotConfig: this.configProvider.mergeBotConfig.bind(this.configProvider)
    }

    const defRepo = new DefinitionsRepository(this.entities, this.intents, this.ghost)
    const botFactory = new BotFactory(configResolver, this._logger, defRepo, modelRepo, socket, process.NLU_ENDPOINT)

    this._app = {
      baseClient,
      botFactory,
      queueTrainingsOnBotMount: trainingEnabled && !!queueTrainingOnBotMount
    }
  }

  public async teardown() {
    for (const botId of Object.keys(this._bots)) {
      await this.unmountBot(botId)
    }
  }

  public async getInfo(): Promise<ServerInfo | undefined> {
    if (!this._app) {
      throw new NLUServiceNotInitializedError()
    }

    try {
      const info = await this._app.baseClient.getInfo()
      return info
    } catch (err) {
      this._logger.attachError(err).error('An error occured when fetch info from NLU Server.')
      return
    }
  }

  public async mountBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.SERVICES_READY)
    if (!this._app) {
      throw new NLUServiceNotInitializedError()
    }

    const botConfig = await this.configProvider.getBotConfig(botId)
    const bot = await this._app.botFactory.makeBot(botConfig)
    this._bots[botId] = bot
    return bot.mount({
      queueTraining: this._app.queueTrainingsOnBotMount
    })
  }

  public async unmountBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.SERVICES_READY)
    if (!this._app) {
      throw new NLUServiceNotInitializedError()
    }

    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    await bot.unmount()
    delete this._bots[botId]
  }

  public async getLanguages(): Promise<string[]> {
    if (!this._app) {
      throw new NLUServiceNotInitializedError()
    }

    const { languages } = await this._app.baseClient.getInfo()
    return languages
  }

  public getBot(botId: string): BotStateMachine {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    return bot
  }

  public async queueTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    // the Bot SM class will report progress and handle errors
    void bot.train(language)
  }

  private _getWebsocket = () => {
    return async (ts: BpTraining) => {
      const ev: NLUProgressEvent = { type: 'nlu', ...ts }
      return coreActions.notifyTrainUpdate(ev)
    }
  }
}
