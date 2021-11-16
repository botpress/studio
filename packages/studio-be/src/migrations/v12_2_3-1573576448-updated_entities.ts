import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts, MigrationResult } from 'core/migration'
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
  up: async ({ ghostService, metadata: { botId, isDryRun } }: MigrationOpts): Promise<MigrationResult> => {
    let hasChanges = false
    const bpfs = ghostService.forBot(botId)
    const entFiles = await bpfs.directoryListing('./entities', '*.json')

    for (const fileName of entFiles) {
      const entityDef = (await bpfs.readFileAsObject('./entities', fileName, {
        noCache: true
      })) as sdk.NLU.EntityDefinition

      if (entityDef.type === 'pattern') {
        if (entityDef.matchCase === undefined) {
          hasChanges = true
          entityDef.matchCase = false
        }
        if (entityDef.examples === undefined) {
          hasChanges = true
          entityDef.examples = []
        }
      }

      if (entityDef.type === 'list') {
        if (typeof entityDef.fuzzy !== 'number') {
          hasChanges = true
        }

        if (entityDef.fuzzy) {
          entityDef.fuzzy = FuzzyTolerance.Medium
        } else {
          entityDef.fuzzy = FuzzyTolerance.Strict
        }
      }

      if (!isDryRun) {
        await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
      }
    }

    return isDryRun ? { hasChanges } : { success: true }
  },

  down: async ({ logger }: MigrationOpts): Promise<MigrationResult> => {
    logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return {
      hasChanges: false,
      message: 'No down migration written.'
    }
  }
}

export default migration
