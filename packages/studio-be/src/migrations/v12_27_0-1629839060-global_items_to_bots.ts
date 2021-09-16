import * as sdk from 'botpress/sdk'
import { FlowService } from 'core/dialog'
import { Migration, MigrationOpts } from 'core/migration'
import { getBuiltinPath, listDir } from 'core/misc/list-dir'
import { TYPES } from 'core/types'
import fse from 'fs-extra'
import path from 'path'

const CONTENT_DIR = 'content-types'
const ACTIONS_DIR = 'actions'
const HOOKS_DIR = 'hooks'
const IGNORED_ACTION = ['say']
const BP_MODULES = ['builtin', 'basic-skills', 'channel-web', 'internal-users']

const migration: Migration = {
  info: {
    description: 'Move actions, hooks and content types from global to individual bots',
    target: 'bot',
    type: 'content'
  },
  up: async ({ botService, ghostService, metadata, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const flowService = inversify.get<FlowService>(TYPES.FlowService)

    const globalTypes = await ghostService.global().directoryListing(CONTENT_DIR, '*.*')
    const builtinTypes = await listDir(getBuiltinPath(CONTENT_DIR), { fileFilter: '**/*.js' })

    const contentTypes = [
      ...globalTypes.filter(x => !x.startsWith('builtin/')),
      ...builtinTypes.map(x => x.relativePath)
    ]

    const updateBotContentTypes = async (botId: string, botConfig: sdk.BotConfig) => {
      const botTypes = await ghostService.forBot(botId).directoryListing(CONTENT_DIR, '*.*')
      if (botTypes.length) {
        return
      }

      for (const type of contentTypes) {
        let content
        if (builtinTypes.find(x => x.relativePath === type)) {
          content = await fse.readFile(path.join(getBuiltinPath(CONTENT_DIR), type))
        } else if (globalTypes.find(x => x === type)) {
          content = await ghostService.global().readFileAsBuffer(CONTENT_DIR, type)
        }

        if (content) {
          await ghostService.forBot(botId).upsertFile(CONTENT_DIR, type, content)
          hasChanges = true
        }
      }
    }

    /**
     * Scan each flows and extract actions, then if the bot doesn't have it locally, fetch it from builtin or global.
     * We prefer builtin first because we had to make slight adjustments to some actions (module config was moved to bot config)
     */
    const builtinActions = await listDir(getBuiltinPath('actions'))

    const updateBotActions = async (botId: string) => {
      const botActions = await ghostService.forBot(botId).directoryListing(ACTIONS_DIR, '*.*')
      const usedActions = await flowService.forBot(botId).getAllFlowActions()
      const filteredActions = usedActions.filter(x => !IGNORED_ACTION.includes(x)).map(x => `${x}.js`)

      for (const actionFile of filteredActions) {
        if (botActions.find(x => x === actionFile)) {
          continue
        }

        if (builtinActions.find(x => x.relativePath === actionFile)) {
          const content = await fse.readFile(path.join(getBuiltinPath(ACTIONS_DIR), actionFile))
          await ghostService.forBot(botId).upsertFile(ACTIONS_DIR, actionFile, content)

          hasChanges = true
        }
      }
    }

    /**
     * We copy builtin hooks to the bot, other global hooks are untouched
     */
    const builtinHooks = await listDir(getBuiltinPath('hooks'), { fileFilter: '**/*.js' })
    const updateBotHooks = async (botId: string) => {
      const botHooks = await ghostService.forBot(botId).directoryListing(HOOKS_DIR, '*.*')

      for (const hookFile of builtinHooks.map(x => x.relativePath)) {
        if (botHooks.find(x => x === hookFile)) {
          continue
        }

        const content = await fse.readFile(path.join(getBuiltinPath(HOOKS_DIR), hookFile))
        await ghostService.forBot(botId).upsertFile(HOOKS_DIR, hookFile, content)

        hasChanges = true
      }
    }

    const updateBot = async (botId: string, botConfig: sdk.BotConfig) => {
      await updateBotContentTypes(botId, botConfig!)
      await updateBotActions(botId)
      await updateBotHooks(botId)
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

    return {
      success: true,
      message: `[${metadata.botId}] ${hasChanges ? 'Content updated successfully' : 'No migration required'}`
    }
  },
  down: async ({ botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBotContentTypes = async (botId: string) => {
      const botTypes = await ghostService.forBot(botId).directoryListing(CONTENT_DIR, '*.*')

      for (const type of botTypes) {
        await ghostService.forBot(botId).deleteFile(CONTENT_DIR, type)
        hasChanges = true
      }
    }

    const builtinActions = await listDir(getBuiltinPath('actions'))
    const updateBotActions = async (botId: string) => {
      const botActions = await ghostService.forBot(botId).directoryListing(ACTIONS_DIR, '*.*')

      for (const actionFile of builtinActions.map(x => x.relativePath)) {
        if (botActions.find(x => x === actionFile)) {
          await ghostService.forBot(botId).deleteFile(ACTIONS_DIR, actionFile)
          hasChanges = true
        }
      }
    }

    const builtinHooks = await listDir(getBuiltinPath('hooks'), { fileFilter: '**/*.js' })
    const updateBotHooks = async (botId: string) => {
      const botHooks = await ghostService.forBot(botId).directoryListing(HOOKS_DIR, '*.*')

      for (const hookFile of builtinHooks.map(x => x.relativePath)) {
        if (botHooks.find(x => x === hookFile)) {
          await ghostService.forBot(botId).deleteFile(HOOKS_DIR, hookFile)
          hasChanges = true
        }
      }
    }

    const updateBot = async (botId: string, botConfig: sdk.BotConfig) => {
      await updateBotContentTypes(botId)
      await updateBotActions(botId)
      await updateBotHooks(botId)
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

    return {
      success: true,
      message: `[${metadata.botId}] ${hasChanges ? 'Content updated successfully' : 'No migration required'}`
    }
  }
}

export default migration
