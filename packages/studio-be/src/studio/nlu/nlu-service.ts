import { AxiosBotConfig, Logger, NLU } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { RealTimePayload, RealtimeService } from 'core/realtime'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'
import yn from 'yn'
import { NLUApplication } from './application'
import { BotFactory } from './application/bot-factory'
import { DefinitionsRepository } from './application/definitions-repository'
import { EntityRepository } from './application/entities-repo'
import { IntentRepository } from './application/intent-repo'
import { ModelStateService } from './application/model-state'
import { DbModelStateRepository } from './application/model-state/model-state-repo'
import { NLUClient } from './application/nlu-client'
import { ConfigResolver, TrainingSession } from './application/typings'
import { NonBlockingNluApplication } from './non-blocking-app'

interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}

@injectable()
export class NLUService {
  public entities: EntityRepository
  public intents: IntentRepository
  public app: NLUApplication | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private logger: Logger,
    @inject(TYPES.GhostService)
    private ghostService: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService
  ) {
    this.entities = new EntityRepository(this.ghostService, this)
    this.intents = new IntentRepository(this.ghostService, this)
  }

  @postConstruct()
  public async initialize() {
    const { nlu: nluConfig } = await this.configProvider.getBotpressConfig()
    const { queueTrainingOnBotMount, legacyElection } = nluConfig
    const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)

    if (legacyElection) {
      this.logger.warn(
        'You are still using legacy election which is deprecated. Set { legacyElection: false } in your global nlu config to use the new election pipeline.'
      )
    }

    const nluEndpoint = `${process.LOCAL_URL}/api/v1/nlu-server`
    const axiosConfig: AxiosBotConfig = { baseURL: nluEndpoint, headers: {} }
    const nluClient = new NLUClient(axiosConfig)

    const socket = this.getWebsocket()

    const modelRepo = new DbModelStateRepository(this.database.knex)
    await modelRepo.initialize()
    const modelStateService = new ModelStateService(modelRepo)

    const defRepo = new DefinitionsRepository(this.entities, this.intents, this.ghost)

    const configResolver: ConfigResolver = {
      getBotById: this.configProvider.getBotConfig.bind(this.configProvider),
      mergeBotConfig: this.configProvider.mergeBotConfig.bind(this.configProvider)
    }

    const botFactory = new BotFactory(configResolver, this.logger, defRepo, modelStateService, socket)
    const application = new NonBlockingNluApplication(
      nluClient,
      botFactory,
      {
        queueTrainingsOnBotMount: trainingEnabled && queueTrainingOnBotMount
      },
      this.logger
    )

    // don't block entire server startup
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    application.initialize()

    this.app = application
  }

  private getWebsocket = () => {
    return async (ts: TrainingSession) => {
      const { botId } = ts
      const trainSession = this.mapTrainSession(ts)
      const ev: NLUProgressEvent = { type: 'nlu', botId, trainSession }
      this.realtimeService.sendToSocket(RealTimePayload.forAdmins('statusbar.event', ev))
    }
  }

  private mapTrainSession = (ts: TrainingSession): NLU.TrainingSession => {
    const { botId, language, progress, status } = ts
    const key = `training:${botId}:${language}`
    return { key, language, status, progress }
  }

  onTopicChanged = async ({ botId, oldName, newName }: { botId: string; oldName?: string; newName?: string }) => {
    const isRenaming = !!(oldName && newName)
    const isDeleting = !newName

    if (!isRenaming && !isDeleting) {
      return
    }

    const intentDefs = await this.intents.getIntents(botId)

    for (const intentDef of intentDefs) {
      const ctxIdx = intentDef.contexts.indexOf(oldName as string)
      if (ctxIdx !== -1) {
        intentDef.contexts.splice(ctxIdx, 1)

        if (isRenaming) {
          intentDef.contexts.push(newName!)
        }

        await this.intents.updateIntent(botId, intentDef.name, intentDef)
      }
    }
  }
}
