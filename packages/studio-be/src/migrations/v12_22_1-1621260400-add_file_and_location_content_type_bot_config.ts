import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds file and location content types to bot configs',
    target: 'bot',
    type: 'config'
  },
  up: async ({ botService, configProvider, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBotContentTypes = async (botId: string, botConfig: sdk.BotConfig) => {
      const newTypes = ['builtin_file', 'builtin_location']
      const contentTypes = botConfig.imports.contentTypes || []

      const hasMissingTypes = !newTypes.every(type => contentTypes.find(x => x === type))

      if (contentTypes.length && hasMissingTypes) {
        hasChanges = true
        botConfig.imports.contentTypes = _.uniq([...contentTypes, ...newTypes])

        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    if (metadata.botId) {
      const botConfig = await botService.findBotById(metadata.botId)
      await updateBotContentTypes(metadata.botId, botConfig!)
    } else {
      const bots = await botService.getBots()
      for (const [botId, botConfig] of bots) {
        await updateBotContentTypes(botId, botConfig)
      }
    }

    return { success: true, message: hasChanges ? 'New types added successfully' : 'Nothing to change' }
  },
  down: async () => {
    // Down migrations not necessary for content types, no impact
    return { success: true, message: 'Nothing to change' }
  }
}

export default migration
