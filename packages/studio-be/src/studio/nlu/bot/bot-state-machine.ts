import { ListenHandle } from 'botpress/sdk'
import { Training as BpTraining } from 'common/nlu-training'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { TrainListener } from '../typings'
import { BotState } from './bot-state'

export interface MountOptions {
  queueTraining: boolean
}

const TRAIN_POLL_INTERVAL = 500

export class BotStateMachine {
  private _needTrainingWatcher!: ListenHandle

  constructor(private _bot: BotState, private _defRepo: DefinitionsRepository, private _webSocket: TrainListener) {}

  public mount = async (opt: MountOptions) => {
    this._needTrainingWatcher = this._registerNeedsTrainingWatcher()

    if (!opt.queueTraining) {
      return
    }

    for (const l of this._bot.languages) {
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
    await this._bot.startTraining(language)
    const needsTraining: BpTraining = { status: 'needs-training', progress: 0, language, botId: this._bot.id }
    const doneTraining: BpTraining = { status: 'done', progress: 1, language, botId: this._bot.id }

    return this._while(async () => {
      const training = await this._bot.getTraining(language)
      if (!training) {
        return 'stop-polling'
      }

      if (training.status === 'training' || training.status === 'training-pending') {
        const { status, progress } = training
        this._webSocket({ status, progress, language, botId: this._bot.id })
        return 'keep-polling'
      }

      if (training.status === 'done') {
        await this._bot.setModel(language, training)
        this._webSocket(doneTraining)
        return 'stop-polling'
      }

      const { error } = training
      this._webSocket({ ...needsTraining, error })
      return 'stop-polling'
    }, TRAIN_POLL_INTERVAL)
  }

  public syncAndGetState = async (language: string): Promise<BpTraining> => {
    const needsTraining: BpTraining = { status: 'needs-training', progress: 0, language, botId: this._bot.id }
    const doneTraining: BpTraining = { status: 'done', progress: 1, language, botId: this._bot.id }

    const training = await this._bot.getTraining(language)
    if (training) {
      if (training.status === 'done') {
        await this._bot.setModel(language, training)
        return doneTraining
      }

      if (training.status === 'training' || training.status === 'training-pending') {
        const { status, progress } = training
        return { status, progress, language, botId: this._bot.id }
      }

      // if error or canceled we fallback on model
    }

    const model = await this._bot.getModel(language)
    if (!model) {
      return needsTraining
    }

    const isDirty = await this._bot.isDirty(language, model)
    if (!isDirty) {
      return doneTraining
    }

    return needsTraining
  }

  public cancelTraining = async (language: string) => {
    await this._bot.cancelTraining(language)
  }

  private _registerNeedsTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._bot.id, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._bot.languages, async l => {
        const state = await this.syncAndGetState(l)
        this._webSocket(state)
      })
    })
  }

  private _while(cb: () => Promise<'keep-polling' | 'stop-polling'>, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const int = setInterval(async () => {
        try {
          const status = await cb()
          if (status === 'stop-polling') {
            clearInterval(int)
            resolve()
          }
        } catch (err) {
          clearInterval(int)
          reject(err)
        }
      }, ms)
    })
  }
}
