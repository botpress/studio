import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { EntityRepository } from './entities-repo'
import { IntentRepository } from './intent-repo'

export type FileListener = (fileName: string) => Promise<void>

export interface TrainDefinitions {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
}

export class DefinitionsRepository {
  constructor(
    private entityRepo: EntityRepository,
    private intentRepo: IntentRepository,
    private ghost: GhostService
  ) {}

  // TODO: use the actual repo with the ghost, not an HTTP call
  public async getTrainDefinitions(botId: string): Promise<TrainDefinitions> {
    const intentDefs = await this.intentRepo.getIntents(botId)
    const entityDefs = await this.entityRepo.listEntities(botId)

    return {
      intentDefs,
      entityDefs
    }
  }

  public onFileChanged(botId: string, listener: FileListener): sdk.ListenHandle {
    const handle = this.ghost.forBot(botId).onFileChanged(listener)
    return handle
  }
}
