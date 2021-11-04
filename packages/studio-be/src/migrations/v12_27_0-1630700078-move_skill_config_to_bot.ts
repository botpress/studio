import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Move basic-skills config to bot config',
    target: 'bot',
    type: 'config'
  },
  up: async ({ configProvider, botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBot = async (botId: string, botConfig: sdk.BotConfig) => {
      let skillConfig
      if (await ghostService.forBot(botId).fileExists('config', 'basic-skills.json')) {
        skillConfig = await ghostService.forBot(botId).readFileAsObject('config', 'basic-skills.json')
      }

      if (skillConfig) {
        const { matchNLU, matchNumbers, transportConnectionString } = skillConfig

        botConfig.skillChoice = { matchNLU, matchNumbers }
        botConfig.skillSendEmail = { transportConnectionString }

        await configProvider.setBotConfig(botId, botConfig)
        hasChanges = true
      }
    }

    if (metadata.botId) {
      const botConfig = await botService.findBotById(metadata.botId)
      await updateBot(metadata.botId, botConfig!)
    } else {
      const bots = await botService.getBots()
      for (const [botId, botConfig] of bots) {
        await updateBot(botId, botConfig)
      }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
