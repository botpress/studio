import { Logger } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { EntityService } from './entities-service'
import { IntentService } from './intent-service'

@injectable()
export class NLUService {
  public entities: EntityService
  public intents: IntentService

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private logger: Logger,
    @inject(TYPES.GhostService)
    private ghostService: GhostService
  ) {
    this.entities = new EntityService(this.ghostService, this)
    this.intents = new IntentService(this.ghostService, this)
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
