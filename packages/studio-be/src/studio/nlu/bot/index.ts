import { ListenHandle } from 'botpress/sdk'
import { Training as BpTraining } from 'common/nlu-training'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelEntryService, TrainingEntryService } from '../model-entry'
import { NLUClient } from '../nlu-client'
import { BotDefinition, ConfigResolver, TrainListener } from '../typings'
import { BotState } from './bot-state'
import { poll } from './polling'

export interface MountOptions {
  queueTraining: boolean
}

const TRAIN_POLL_INTERVAL = 500

export class Bot {
  private _needTrainingWatcher!: ListenHandle
  private _botState: BotState
  private _botId: string
  private _languages: string[]

  constructor(
    botDef: BotDefinition,
    _configResolver: ConfigResolver,
    _nluClient: NLUClient,
    private _defRepo: DefinitionsRepository,
    _models: ModelEntryService,
    _trainings: TrainingEntryService,
    private _webSocket: TrainListener
  ) {
    this._botState = new BotState(botDef, _configResolver, _nluClient, _defRepo, _models, _trainings)
    this._botId = botDef.botId
    this._languages = botDef.languages
  }

  public mount = async (opt: MountOptions) => {
    this._needTrainingWatcher = this._registerNeedsTrainingWatcher()

    if (!opt.queueTraining) {
      return
    }

    for (const l of this._languages) {
      const { status } = await this.syncAndGetState(l)
      if (status === 'needs-training') {
        // The train function reports progress and handles errors
        void this.train(l)
      }
    }
  }

  public unmount = async () => {
    this._needTrainingWatcher.remove()
  }

  public train = async (language: string): Promise<void> => {
    await this._botState.startTraining(language)
    const needsTraining: BpTraining = { status: 'needs-training', progress: 0, language, botId: this._botId }
    const doneTraining: BpTraining = { status: 'done', progress: 1, language, botId: this._botId }

    return poll(async () => {
      const training = await this._botState.getTraining(language)
      if (!training) {
        return 'stop-polling'
      }

      if (training.status === 'training' || training.status === 'training-pending') {
        const { status, progress } = training
        this._webSocket({ status, progress, language, botId: this._botId })
        return 'keep-polling'
      }

      if (training.status === 'done') {
        await this._botState.setModel(language, training)
        this._webSocket(doneTraining)
        return 'stop-polling'
      }

      const { error } = training
      this._webSocket({ ...needsTraining, error })
      return 'stop-polling'
    }, TRAIN_POLL_INTERVAL)
  }

  public syncAndGetState = async (language: string): Promise<BpTraining> => {
    const needsTraining: BpTraining = { status: 'needs-training', progress: 0, language, botId: this._botId }
    const doneTraining: BpTraining = { status: 'done', progress: 1, language, botId: this._botId }

    const training = await this._botState.getTraining(language)
    if (training) {
      if (training.status === 'done') {
        await this._botState.setModel(language, training)
        return doneTraining
      }

      if (training.status === 'training' || training.status === 'training-pending') {
        const { status, progress } = training
        return { status, progress, language, botId: this._botId }
      }

      // if error or canceled we fallback on model
    }

    const model = await this._botState.getModel(language)
    if (!model) {
      return needsTraining
    }

    const isDirty = await this._botState.isDirty(language, model)
    if (!isDirty) {
      return doneTraining
    }

    return needsTraining
  }

  public cancelTraining = async (language: string) => {
    await this._botState.cancelTraining(language)
  }

  private _registerNeedsTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._botId, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._languages, async l => {
        const state = await this.syncAndGetState(l)
        this._webSocket(state)
      })
    })
  }
}
