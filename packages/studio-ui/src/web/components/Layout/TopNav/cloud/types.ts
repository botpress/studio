import { NLU } from 'botpress/sdk'

export interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}
