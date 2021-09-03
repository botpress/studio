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
const BOT_HOOKS = [
  'after_bot_mount',
  'after_bot_unmount',
  'before_incoming_middleware',
  'after_incoming_middleware',
  'before_outgoing_middleware',
  'after_event_processed',
  'before_session_timeout',
  'before_suggestions_election',
  'on_bot_error'
]
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

    const baseTypes = await ghostService.global().directoryListing(CONTENT_DIR, '*.*')

    const updateBotContentTypes = async (botId: string, botConfig: sdk.BotConfig) => {
      const botTypes = await ghostService.forBot(botId).directoryListing(CONTENT_DIR, '*.*')

      if (!botTypes.length) {
        for (const type of baseTypes) {
          const buffer = await ghostService.global().readFileAsBuffer(CONTENT_DIR, type)
          await ghostService.forBot(botId).upsertFile(CONTENT_DIR, type, buffer)
        }
        hasChanges = true
      }
    }

    /**
     * Scan each flows and extract actions, then if the bot doesn't have it locally, fetch it from global or builtin
     */
    const globalActions = await ghostService.global().directoryListing('actions', '*.*')
    const builtinActions = await listDir(getBuiltinPath('actions'))

    const updateBotActions = async (botId: string) => {
      const botActions = await ghostService.forBot(botId).directoryListing(ACTIONS_DIR, '*.*')
      const usedActions = await flowService.forBot(botId).getAllFlowActions()
      const filteredActions = usedActions.filter(x => !IGNORED_ACTION.includes(x)).map(x => `${x}.js`)

      for (const actionFile of filteredActions) {
        if (botActions.find(x => x === actionFile)) {
          continue
        }

        let content
        if (globalActions.find(x => x === actionFile)) {
          content = await ghostService.global().readFileAsBuffer(ACTIONS_DIR, actionFile)
        } else if (builtinActions.find(x => x.relativePath === actionFile)) {
          content = await fse.readFile(path.join(getBuiltinPath(ACTIONS_DIR), actionFile))
        }

        if (content) {
          await ghostService.forBot(botId).upsertFile(ACTIONS_DIR, actionFile, content)
          hasChanges = true
        }
      }
    }

    /**
     * Take all global hooks, ignore our own modules and those which are not related to bots.
     * Then we copy all any remaining global hook locally, and we add builtin ones.
     */
    const builtinHooks = await listDir(getBuiltinPath('hooks'), { fileFilter: '**/*.js' })
    const globalHooks = await ghostService.global().directoryListing(HOOKS_DIR, '*.*')

    const globalBotHooks = globalHooks.filter(path => {
      const [hookType, moduleName] = path.split('/')
      return BOT_HOOKS.includes(hookType) && !BP_MODULES.includes(moduleName)
    })

    const globalWithBuiltin = [...globalBotHooks, ...builtinHooks.map(x => x.relativePath)]

    const updateBotHooks = async (botId: string) => {
      const botHooks = await ghostService.forBot(botId).directoryListing(HOOKS_DIR, '*.*')

      for (const hookFile of globalWithBuiltin) {
        if (botHooks.find(x => x === hookFile)) {
          continue
        }

        let content
        if (globalHooks.find(x => x === hookFile)) {
          content = await ghostService.global().readFileAsBuffer(HOOKS_DIR, hookFile)
        } else if (builtinHooks.find(x => x.relativePath === hookFile)) {
          content = await fse.readFile(path.join(getBuiltinPath(HOOKS_DIR), hookFile))
        }

        if (content) {
          await ghostService.forBot(botId).upsertFile(HOOKS_DIR, hookFile, content)
          hasChanges = true
        }
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
  }
}

export default migration
