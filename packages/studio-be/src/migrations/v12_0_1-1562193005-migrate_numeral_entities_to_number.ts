import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts, MigrationResult } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Migrates slots from type numeral to number',
    target: 'bot',
    type: 'content'
  },
  up: async ({ ghostService, metadata: { botId, isDryRun } }: MigrationOpts): Promise<MigrationResult> => {
    let hasChanges = false

    const bpfs = ghostService.forBot(botId)
    const intents = await bpfs.directoryListing('./intents', '*.json')

    for (const file of intents) {
      const content = (await bpfs.readFileAsObject('./intents', file, { noCache: true })) as sdk.NLU.IntentDefinition

      content.slots = content.slots.map(slot => {
        if (slot.entities?.find(entity => entity === 'numeral')) {
          hasChanges = true
          slot.entities = slot.entities.map(entity => (entity === 'numeral' ? 'number' : entity))
        }

        return slot
      })

      if (!isDryRun) {
        await bpfs.upsertFile('./intents', file, JSON.stringify(content, undefined, 2), { ignoreLock: true })
      }
    }

    return { success: true, hasChanges }
  }
}

export default migration
