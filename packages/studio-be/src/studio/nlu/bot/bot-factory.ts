import { Logger } from 'botpress/sdk'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelEntryService, TrainingEntryService, ModelEntryRepository } from '../model-entry'
import { NLUClient } from '../nlu-client'
import pickSeed from '../pick-seed'

import { BotDefinition, BotConfig, ConfigResolver, TrainListener } from '../typings'
import { BotState } from './bot-state'
import { BotStateMachine } from './bot-state-machine'

const CLOUD_NLU_ENDPOINT = process.env.CLOUD_NLU_ENDPOINT || 'https://nlu.botpress.dev'

export class BotFactory {
  constructor(
    private _configResolver: ConfigResolver,
    private _logger: Logger,
    private _defRepo: DefinitionsRepository,
    private _modelStateRepo: ModelEntryRepository,
    private _webSocket: TrainListener,
    private _nluEndpoint: string
  ) {}

  public makeBot = async (botConfig: BotConfig): Promise<BotStateMachine> => {
    const { id: botId, cloud } = botConfig

    const baseURL = cloud ? CLOUD_NLU_ENDPOINT : this._nluEndpoint
    const nluClient = new NLUClient({ baseURL, cloud })

    const { defaultLanguage } = botConfig
    const { languages: engineLanguages } = await nluClient.getInfo()
    const languages = _.intersection(botConfig.languages, engineLanguages)
    if (botConfig.languages.length !== languages.length) {
      const missingLangMsg = `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`
      this._logger.forBot(botId).warn(missingLangMsg, { notSupported: _.difference(botConfig.languages, languages) })
    }

    const botDefinition: BotDefinition = {
      botId,
      defaultLanguage,
      languages,
      seed: pickSeed(botConfig)
    }

    const modelService = new ModelEntryService(this._modelStateRepo)
    const trainService = new TrainingEntryService(this._modelStateRepo)
    const botState = new BotState(
      botDefinition,
      this._configResolver,
      nluClient,
      this._defRepo,
      modelService,
      trainService
    )
    return new BotStateMachine(botState, this._defRepo, this._webSocket)
  }
}
