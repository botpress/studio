import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import path from 'path'

const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
}

const migration: Migration = {
  info: {
    description: 'Adds missing fields in custom entities',
    target: 'bot',
    type: 'content'
  },
  up: async ({ botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateBotEntities = async (botId: string) => {
      const bpfs = ghostService.forBot(botId)
      const entFiles = await bpfs.directoryListing('./entities', '*.json')
      for (const fileName of entFiles) {
        const entityDef = (await bpfs.readFileAsObject('./entities', fileName)) as sdk.NLU.EntityDefinition
        if (entityDef.type === 'pattern') {
          if (entityDef.matchCase === undefined) {
            entityDef.matchCase = false
          }
          if (entityDef.examples === undefined) {
            entityDef.examples = []
          }
        }

        if (entityDef.type === 'list') {
          if (entityDef.fuzzy) {
            entityDef.fuzzy = FuzzyTolerance.Medium
          } else {
            entityDef.fuzzy = FuzzyTolerance.Strict
          }
        }

        await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
      }
    }
    if (metadata.botId) {
      await migrateBotEntities(metadata.botId)
    } else {
      const bots = await botService.getBots()
      await Promise.map(bots.keys(), (botId) => migrateBotEntities(botId))
    }

    return { success: true, message: "Entities' fields updated successfully" }
  },

  down: async ({ logger }: MigrationOpts): Promise<sdk.MigrationResult> => {
    logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return {
      success: true,
      message: 'No down migration written.'
    }
  }
}

export default migration
