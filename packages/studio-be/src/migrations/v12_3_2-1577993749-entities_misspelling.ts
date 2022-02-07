import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'
import path from 'path'

const migration: Migration = {
  info: {
    description: 'Updates misspelled property in custom entities',
    target: 'bot',
    type: 'content'
  },
  up: async ({ botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateBotEntities = async (botId: string) => {
      const bpfs = ghostService.forBot(botId)
      const entFiles = await bpfs.directoryListing('./entities', '*.json')
      for (const fileName of entFiles) {
        const entityDef = (await bpfs.readFileAsObject('./entities', fileName)) as sdk.NLU.EntityDefinition
        entityDef.occurrences = _.cloneDeep(entityDef['occurences'])
        delete entityDef['occurences']
        await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
      }
    }
    if (metadata.botId) {
      await migrateBotEntities(metadata.botId)
    } else {
      const bots = await botService.getBots()
      await Promise.map(bots.keys(), (botId) => migrateBotEntities(botId))
    }

    return { success: true, message: "Entities' properties updated successfully" }
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
