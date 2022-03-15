import { RequestWithUser } from 'common/typings'

export interface TypingDefinitions {
  [file: string]: string
}

export type FileType =
  | 'action_legacy'
  | 'action_http'
  | 'hook'
  | 'bot_config'
  | 'main_config'
  | 'module_config'
  | 'hook_example'
  | 'action_example'
  | 'raw'
  | 'shared_libs'

export interface EditableFile {
  /** The name of the file, extracted from its location */
  name: string
  /** Content is preloaded only when filtering builtin files */
  content?: string
  /** Type of file allowed (used to determine storage) */
  type: FileType
  /** The relative location of the file of the specified type */
  location: string
  /** If not set, the file is considered global */
  botId?: string
  hookType?: string
  readOnly?: boolean
  /** Example files are a special type of file that can be copied locally */
  isExample?: boolean
}

export interface FilesDS {
  [type: string]: EditableFile[]
}

export interface FilePermissions {
  [key: string]: {
    type: string
    isGlobal?: boolean
    read: boolean
    write: boolean
  }
}

export type RequestWithPerms = RequestWithUser & {
  permissions: FilePermissions
  params: any
  query?: any
  body: any
}

export const HOOK_SIGNATURES = {
  before_incoming_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_incoming_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_outgoing_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.OutgoingEvent)',
  after_event_processed: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_suggestions_election: `function hook(
  bp: typeof sdk,
  sessionId: string,
  event: sdk.IO.IncomingEvent,
  suggestions: sdk.IO.Suggestion[])`,
  after_server_start: 'function hook(bp: typeof sdk)',
  after_bot_mount: 'function hook(bp: typeof sdk, botId: string)',
  after_bot_unmount: 'function hook(bp: typeof sdk, botId: string)',
  before_session_timeout: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_conversation_end: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  on_incident_status_changed: 'function hook(bp: typeof sdk, incident: sdk.Incident)',
  before_bot_import: 'function hook(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object)',
  on_stage_request: `function hook(
  bp: typeof sdk,
  bot: sdk.BotConfig,
  users: Partial<sdk.StrategyUser[]>,
  pipeline: sdk.Pipeline,
  hookResult: any)`,
  after_stage_changed: `function hook(
  bp: typeof sdk,
  previousBotConfig: sdk.BotConfig,
  bot: sdk.BotConfig,
  users: Partial<sdk.StrategyUser[]>,
  pipeline: sdk.Pipeline)`,
  on_bot_error: 'function hook(bp: typeof sdk, botId: string, events: sdk.LoggerEntry[])'
}

export const BOT_SCOPED_HOOKS = [
  'before_incoming_middleware',
  'after_incoming_middleware',
  'before_outgoing_middleware',
  'after_event_processed',
  'before_suggestions_election',
  'before_session_timeout',
  'before_conversation_end',
  'after_bot_mount',
  'after_bot_unmount',
  'before_bot_import',
  'on_bot_error'
]

export interface FileDefinition {
  allowGlobal?: boolean // When true, this type of file can be stored as global
  allowScoped?: boolean // When true, this file can be scoped to a specific bot
  allowRoot?: boolean // When true, it can be accessed through the root scope
  onlySuperAdmin?: boolean //
  isJSON?: boolean // When true, the file content is checked for valid JSON (also used for listing files in ghost)
  permission: string // The permission required for this type of file (will be prepended by global / bot)
  filenames?: string[] // List of valid filenames. Used for validation before save (& avoid doing a full directory listing)
  ghost: {
    baseDir: string // The base directory where files are located
    /** Adds additional fields to the resulting object when reading content from the disk */
    dirListingAddFields?: (filepath: string) => object | undefined
    dirListingExcluded?: string[]
    upsertLocation?: (file: EditableFile) => string
    upsertFilename?: (file: EditableFile) => string
    shouldSyncToDisk?: boolean
  }
  /** Validation if the selected file can be deleted */
  canDelete?: (file: EditableFile) => boolean
  /** An additional validation that must be done for that type of file. Return a string indicating the error message */
  validate?: (file: EditableFile, isWriting?: boolean) => Promise<string | undefined>
}

export const MAIN_GLOBAL_CONFIG_FILES = ['botpress.config.json', 'workspaces.json']

export const FileTypes: { [type: string]: FileDefinition } = {
  action_http: {
    allowGlobal: false,
    allowScoped: true,
    permission: 'actions',
    ghost: {
      baseDir: '/actions',
      shouldSyncToDisk: true,
      upsertFilename: (file: EditableFile) => file.location.replace('.js', '.http.js')
    }
  },
  action_legacy: {
    allowGlobal: true,
    allowScoped: true,
    permission: 'actions',
    ghost: {
      baseDir: '/actions',
      shouldSyncToDisk: true
    }
  },
  hook: {
    allowGlobal: true,
    allowScoped: true,
    permission: 'hooks',
    ghost: {
      baseDir: '/hooks',
      dirListingAddFields: (filepath: string) => ({ hookType: filepath.substr(0, filepath.indexOf('/')) }),
      upsertLocation: (file: EditableFile) => `/hooks/${file.hookType}`,
      upsertFilename: (file: EditableFile) => file.location.replace(file.hookType!, ''),
      shouldSyncToDisk: true
    },
    validate: async (file: EditableFile, isWriting?: boolean) => {
      if (isWriting && file.botId && !BOT_SCOPED_HOOKS.includes(file.hookType!)) {
        return "This hook can't be scoped to a bot"
      }
      return HOOK_SIGNATURES[file.hookType!] === undefined ? `Invalid hook type "${file.hookType}"` : undefined
    }
  },
  bot_config: {
    allowGlobal: false,
    allowScoped: true,
    isJSON: true,
    permission: 'bot_config',
    filenames: ['bot.config.json'],
    ghost: {
      baseDir: '/'
    },
    canDelete: () => false
  },
  shared_libs: {
    allowGlobal: false,
    allowScoped: true,
    permission: 'shared_libs',
    ghost: {
      dirListingExcluded: ['node_modules'],
      baseDir: '/libraries',
      shouldSyncToDisk: true
    },
    canDelete: (file) => {
      return !['package.json', 'package-lock.json'].includes(file.name)
    }
  },
  main_config: {
    allowGlobal: true,
    allowScoped: false,
    isJSON: true,
    permission: 'main_config',
    filenames: ['botpress.config.json', 'workspaces.json'],
    ghost: {
      baseDir: '/'
    },
    validate: async (file: EditableFile) =>
      !MAIN_GLOBAL_CONFIG_FILES.includes(file.location) ? 'Invalid file name' : undefined,
    canDelete: () => false
  },
  module_config: {
    allowGlobal: true,
    allowScoped: true,
    isJSON: true,
    permission: 'module_config',
    ghost: {
      baseDir: '/config'
    },
    canDelete: (file: EditableFile) => !!file.botId
  },
  raw: {
    allowRoot: true,
    onlySuperAdmin: true,
    permission: 'raw',
    ghost: {
      baseDir: '/'
    }
  }
}
