import { NLU } from 'botpress/sdk'

export interface CDMWorkspace {
  id: string
  name: string
}

export interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}
