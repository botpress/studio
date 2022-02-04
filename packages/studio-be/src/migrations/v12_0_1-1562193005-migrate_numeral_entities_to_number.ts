import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Migrates slots from type numeral to number',
    target: 'bot',
    type: 'config'
  },
  up: async ({ botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const updateBot = async (botId: string) => {
      const bpfs = ghostService.forBot(botId)
      const intents = await bpfs.directoryListing('./intents', '*.json')
      for (const file of intents) {
        const content = (await bpfs.readFileAsObject('./intents', file)) as sdk.NLU.IntentDefinition
        content.slots = content.slots.map((slot) => {
          if (slot.entities && slot.entities.length) {
            slot.entities = slot.entities.map((entity) => (entity === 'numeral' ? 'number' : entity))
          }
          return slot
        })
        await bpfs.upsertFile('./intents', file, JSON.stringify(content, undefined, 2), { ignoreLock: true })
      }
    }

    if (metadata.botId) {
      await updateBot(metadata.botId)
    } else {
      const bots = await botService.getBots()
      for (const botId of Array.from(bots.keys())) {
        await updateBot(botId)
      }
    }

    return { success: true, message: 'Slots migrated successfully' }
  }
}

export default migration
