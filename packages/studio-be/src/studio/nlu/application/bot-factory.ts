import { AxiosRequestConfig } from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Bot } from './bot'
import { DefinitionsRepository } from './definitions-repository'
import { ModelStateService } from './model-state'
import { NLUClient } from './nlu-client'
import pickSeed from './pick-seed'

import { BotDefinition, BotConfig, TrainingSession, ConfigResolver } from './typings'

export class BotFactory {
  constructor(
    private _configResolver: ConfigResolver,
    private _logger: sdk.Logger,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: TrainingSession) => void
  ) {}

  public makeBot = async (botConfig: BotConfig): Promise<Bot> => {
    const { id: botId } = botConfig

    const { CORE_PORT, ROOT_PATH, INTERNAL_PASSWORD } = process.core_env
    const config: AxiosRequestConfig = {
      headers: { authorization: INTERNAL_PASSWORD },
      baseURL: `http://localhost:${CORE_PORT}${ROOT_PATH}/api/v1/bots/${botId}/nlu-server`
    }
    const nluClient = new NLUClient(config)

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

    return new Bot(
      botDefinition,
      this._configResolver,
      nluClient,
      this._defRepo,
      this._modelStateService,
      this._webSocket,
      this._logger
    )
  }
}
