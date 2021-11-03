import { BPStorage } from '../../../ui-shared-lite/utils/storage'

// TODO: remove when at least one typing is exported from this file
export interface test {}

declare global {
  interface Window {
    __BP_VISITOR_ID: string
    __BP_VISITOR_SOCKET_ID: string
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
    botpressWebChat: any
    APP_NAME: string
    APP_VERSION: string
    APP_FAVICON: string
    APP_CUSTOM_CSS: string
    BOT_API_PATH: string
    API_PATH: string

    ROOT_PATH: string
    BOT_NAME: string
    BOT_ID: string
    BP_BASE_PATH: string
    SEND_USAGE_STATS: boolean
    IS_STANDALONE: boolean
    STUDIO_PORT: number
    IS_BOT_MOUNTED: boolean
    BOT_LOCKED: boolean
    WORKSPACE_ID: string
    SOCKET_TRANSPORTS: string[]
    /** When the studio runs as a standalone, this is the URL of the runtime  */
    BP_SERVER_URL: string
    ANALYTICS_ID: string
    UUID: string
    BP_STORAGE: BPStorage
    EXPERIMENTAL: boolean
    USE_SESSION_STORAGE: boolean
    botpress: {
      [moduleName: string]: any
    }
    TELEMETRY_URL: string
    toggleSidePanel: () => void
  }
}
