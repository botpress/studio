import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description:
      'Migrates the messaging clientId and clientToken from bot.config.json to srv_channels when the bot is imported',
    target: 'bot',
    type: 'content'
  },

  up: async ({
    database,
    logger,
    metadata,
    configProvider,
    botService
  }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migration = async (botId: string, botConfig: any) => {
      const move = async () => {
        if (!botConfig.messaging) {
          return logger.warn(`[${botId}] No messaging config to migrate`)
        } else if (!botConfig.messaging.id?.length) {
          return logger.warn(`[${botId}] No messaging clientId to migrate`)
        } else if (!botConfig.messaging.token?.length) {
          return logger.warn(`[${botId}] No messaging clientToken to migrate`)
        }

        await database.knex('srv_channels').where({ clientId: botConfig.messaging.id }).del()
        await database.knex('srv_channels').where({ botId }).del()

        await database.knex('srv_channels').insert({
          botId,
          clientId: botConfig.messaging.id,
          clientToken: botConfig.messaging.token,
          config: database.knex.json.set({})
        })
      }

      try {
        await move()
      } catch (e) {
        logger
          .attachError(e)
          .error(`[${botId}] Failed to move messaging credentials to srv_channels. New credentials will be generated`)
      }

      if (botConfig.messaging) {
        delete botConfig.messaging.id
        delete botConfig.messaging.token
      }

      await configProvider.setBotConfig(botId, botConfig)
    }

    if (metadata.botId) {
      const botConfig = await botService.findBotById(metadata.botId)
      await migration(metadata.botId, botConfig!)
    } else {
      const bots = await botService.getBots()
      for (const [botId, botConfig] of bots) {
        await migration(botId, botConfig)
      }
    }

    return { success: true, message: 'Configurations updated successfully' }
  },

  down: async ({ database, metadata, configProvider, botService }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migration = async (botId: string, botConfig: any) => {
      const [entry] = await database.knex('srv_channels').where({ botId })
      if (!entry) {
        return
      }

      if (!botConfig.messaging) {
        botConfig.messaging = {}
      }
      botConfig.messaging.id = entry.clientId
      botConfig.messaging.token = entry.clientToken

      await configProvider.setBotConfig(botConfig, botConfig)
      await database.knex('srv_channels').where({ botId }).del()
    }

    if (metadata.botId) {
      const botConfig = await botService.findBotById(metadata.botId)
      await migration(metadata.botId, botConfig!)
    } else {
      const bots = await botService.getBots()
      for (const [botId, botConfig] of bots) {
        await migration(botId, botConfig)
      }
    }

    return { success: true, message: 'Configurations updated successfully' }
  }
}

export default migration
