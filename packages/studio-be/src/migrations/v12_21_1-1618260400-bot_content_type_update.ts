import { Migration, MigrationOpts, MigrationResult } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds video and audio content types to bot configs',
    target: 'bot',
    type: 'config'
  },
  up: async ({ configProvider, metadata: { botId, botConfig, isDryRun } }: MigrationOpts): Promise<MigrationResult> => {
    let hasChanges = false

    const newTypes = ['builtin_video', 'builtin_audio']
    const contentTypes = botConfig.imports.contentTypes || []

    // Fix for the previous migration which was removed
    const hasInvalidEntry = !!contentTypes.find(x => typeof x !== 'string')
    const hasMissingTypes = !newTypes.every(type => contentTypes.find(x => x === type))

    if (contentTypes.length && (hasInvalidEntry || hasMissingTypes)) {
      hasChanges = true
      botConfig.imports.contentTypes = _.uniq([...contentTypes.filter(x => typeof x === 'string'), ...newTypes])

      if (!isDryRun) {
        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    return isDryRun ? { hasChanges } : { success: true }
  },
  down: async () => {
    // Down migrations not necessary for content types, no impact
    return { success: true, hasChanges: false }
  }
}

export default migration
