import { Migration, MigrationOpts, MigrationResult } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds file and location content types to bot configs',
    target: 'bot',
    type: 'config'
  },
  up: async ({ configProvider, metadata }: MigrationOpts): Promise<MigrationResult> => {
    const { botId, botConfig, isDryRun } = metadata

    let hasChanges = false

    const newTypes = ['builtin_file', 'builtin_location']
    const { contentTypes } = botConfig.imports

    const hasMissingTypes = !newTypes.every(type => contentTypes?.find(x => x === type))

    if (contentTypes && hasMissingTypes) {
      hasChanges = true

      if (!isDryRun) {
        botConfig.imports.contentTypes = _.uniq([...contentTypes, ...newTypes])
        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    return isDryRun ? { hasChanges } : { success: true }
  },
  down: async () => {
    // Down migrations not necessary for content types, no impact
    return { hasChanges: false, message: 'Nothing to change' }
  }
}

export default migration
