declare namespace NodeJS {
  export interface ExtraRequire {
    addToNodePath(path: string): void
    getPaths(): string[]
    overwritePaths(paths: string[])
  }

  export interface Global {
    printErrorDefault(err: Error): void
    DEBUG: IDebug
    require: ExtraRequire
    rewire: (name: string) => string
    printBotLog(botId: string, args: any[]): void
    printLog(args: any[]): void
  }

  export interface Process {
    VERBOSITY_LEVEL: number
    /**
     * Path to the global APP DATA folder, shared across all installations of Botpress Server
     * Use this folder to store stuff you'd like to cache, like NLU language models etc
     */
    APP_DATA_PATH: string
    HOST: string
    PORT: number
    PROXY?: string
    EXTERNAL_URL: string
    LOCAL_URL: string
    /** Either equal to studio location, or to the botpress source code file */
    PROJECT_LOCATION: string
    /** Path to the bot folder */
    BOT_LOCATION: string
    BOT_ID: string
    /** Path to the temporary location where files like assets are stored */
    TEMP_LOCATION: string
    /** ID of the template (empty if none) */
    TEMPLATE_ID?: string
    pkg: any
    STUDIO_VERSION: string
    BOTPRESS_VERSION: string
    TELEMETRY_URL: string
    core_env: BotpressEnvironmentVariables
    distro: OSDistribution
    BOTPRESS_EVENTS: EventEmitter
    IS_FAILSAFE: boolean
    DISABLE_CONTENT_SANDBOX: boolean
    /** This property is set when the binary is built in a branch other than master */
    DEV_BRANCH?: string
    NLU_ENDPOINT?: string
  }
}

declare var process: NodeJS.Process
declare var global: NodeJS.Global & typeof globalThis
declare type PRO_FEATURES = 'seats'

/**
 * This is a copy of process.env to add typing and documentation to variables
 */
declare interface BotpressEnvironmentVariables {
  readonly STUDIO_PORT?: number
  readonly PROJECT_LOCATION?: string

  readonly APP_SECRET?: string

  /** The URL exposed by Botpress to external users (eg: when displaying links) */
  readonly EXTERNAL_URL?: string

  /**
   * The database connection string. The first part indicates which database to use
   * @example postgres://user:pass@host/db
   */
  readonly DATABASE_URL?: string

  /**
   * Use to set default debug namespaces
   * @example bp:dialog:*,bp:nlu:intents:*
   */
  readonly DEBUG?: string

  /** Enable performance hooks to track incoming and outgoing events */
  readonly BP_DEBUG_IO?: boolean

  /**
   * Overrides the auto-computed `process.APP_DATA_PATH` path
   * @see Process.APP_DATA_PATH
   */

  readonly APP_DATA_PATH?: string

  /**
   * Truthy if running the official Botpress docker image
   */
  readonly BP_IS_DOCKER?: boolean

  /**
   * The max size of the in-memory, in-process cache.
   * Defaults to '1gb'
   */
  readonly BP_MAX_MEMORY_CACHE_SIZE?: string

  /** When true, content elements rendering will be executed outside of the sandbox */
  readonly DISABLE_CONTENT_SANDBOX?: boolean
}

interface IDebug {
  (module: string, botId?: string): IDebugInstance
}

interface IDebugInstance {
  readonly enabled: boolean

  (msg: string, extra?: any): void
  /**
   * Use to print a debug message prefixed with the botId
   * @param botId The bot Id
   * @param message The debug message
   */
  forBot(botId: string, message: string, extra?: any): void
  sub(namespace: string): IDebugInstance
}

declare var DEBUG: IDebug

declare interface OSDistribution {
  os: NodeJS.Platform
  /** The distribution, e.g. "centos", "ubuntu" */
  dist: string
  /** If a codename is available, for example "final" or "alpine" */
  codename: string
  /** The release number, for example 18.04 */
  release: string
}

declare interface Dic<T> {
  [Key: string]: T
}
