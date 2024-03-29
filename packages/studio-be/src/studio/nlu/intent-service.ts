import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { sanitizeFileName } from 'core/misc/utils'
import _ from 'lodash'

import { NLUService } from './nlu-service'
import { trimUtterances } from './utils'

const INTENTS_DIR = './intents'

export class IntentService {
  constructor(private ghostService: GhostService, private nluService: NLUService) {}

  private async intentExists(botId: string, intentName: string): Promise<boolean> {
    return this.ghostService.forBot(botId).fileExists(INTENTS_DIR, `${intentName}.json`)
  }

  public async getIntents(botId: string): Promise<sdk.NLU.IntentDefinition[]> {
    const intentNames = await this.ghostService.forBot(botId).directoryListing(INTENTS_DIR, '*.json')
    return Promise.map(intentNames, (n) => this.getIntent(botId, n))
  }

  public async getIntent(botId: string, intentName: string): Promise<sdk.NLU.IntentDefinition> {
    intentName = sanitizeFileName(intentName)
    if (intentName.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    if (!(await this.intentExists(botId, intentName))) {
      throw new Error('Intent does not exist')
    }
    return this.ghostService.forBot(botId).readFileAsObject(INTENTS_DIR, `${intentName}.json`)
  }

  public async saveIntent(botId: string, intent: sdk.NLU.IntentDefinition): Promise<sdk.NLU.IntentDefinition> {
    const name = sanitizeFileName(intent.name)
    if (name.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const availableEntities = await this.nluService.entities.listEntities(botId)

    _.chain(intent.slots)
      .flatMap('entities')
      .uniq()
      .forEach((entity) => {
        if (!availableEntities.find((e) => e.name === entity)) {
          throw Error(`"${entity}" is neither a system entity nor a custom entity`)
        }
      })

    trimUtterances(intent)

    await this.ghostService.forBot(botId).upsertFile(INTENTS_DIR, `${name}.json`, JSON.stringify(intent, undefined, 2))
    return intent
  }

  public async updateIntent(
    botId: string,
    name: string,
    content: Partial<sdk.NLU.IntentDefinition>
  ): Promise<sdk.NLU.IntentDefinition> {
    const intentDef = await this.getIntent(botId, name)
    const merged = _.merge(intentDef, content) as sdk.NLU.IntentDefinition
    if (content?.name !== name) {
      await this.deleteIntent(botId, name)
      name = <string>content.name
    }
    return this.saveIntent(botId, merged)
  }

  public async deleteIntent(botId: string, intentName: string): Promise<void> {
    intentName = sanitizeFileName(intentName)

    if (!(await this.intentExists(botId, intentName))) {
      throw new Error('Intent does not exist')
    }

    return this.ghostService.forBot(botId).deleteFile(INTENTS_DIR, `${intentName}.json`)
  }

  // ideally this would be a filewatcher
  public async updateIntentsSlotsEntities(botId: string, prevEntityName: string, newEntityName: string): Promise<void> {
    _.each(await this.getIntents(botId), async (intent) => {
      let modified = false
      _.each(intent.slots, (slot) => {
        _.forEach(slot.entities, (e, index, arr) => {
          if (e === prevEntityName) {
            arr[index] = newEntityName
            modified = true
          }
        })
      })
      if (modified) {
        await this.updateIntent(botId, intent.name, intent)
      }
    })
  }
}
