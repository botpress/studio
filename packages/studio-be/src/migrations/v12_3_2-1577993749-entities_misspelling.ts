import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts, MigrationResult } from 'core/migration'
import _ from 'lodash'
import path from 'path'

const migration: Migration = {
  info: {
    description: 'Updates misspelled property in custom entities',
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

      if (entityDef['occurences']) {
        hasChanges = true

        entityDef.occurrences = _.cloneDeep(entityDef['occurences'])
        delete entityDef['occurences']

        if (!isDryRun) {
          await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
        }
      }
    }

    return isDryRun ? { hasChanges } : { success: true }
  },

  down: async ({ logger }: MigrationOpts): Promise<MigrationResult> => {
    logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return { hasChanges: false }
  }
}

export default migration
