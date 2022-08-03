import { NLU } from 'botpress/sdk'

/**
 * CDM Workspace
 */
export interface Workspace {
  id: string
  name: string
}

export interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}
