import { ActionServer } from 'common/typings'

/**
 * Many configuration options allows you to specify textually the duration, interval, etc.
 * We use the library "ms", so head over to this page to see supported formats: https://www.npmjs.com/package/ms
 */

export interface StudioConfig {
  version: string
  httpServer: {
    /**
     * @default localhost
     */
    host: string
    /**
     * @default 3000
     */
    port: number
    /**
     * @default 0
     */
    backlog: number
    /**
     * @default 10mb
     */
    bodyLimit: string | number
    /**
     * Represents the complete base URL exposed externally by your bot. This is useful if you configure the bot
     * locally and use NGINX as a reverse proxy to handle HTTPS. It should include the protocol and no trailing slash.
     * If unset, it will be constructed from the real host/port
     * @example https://botpress.com
     * @default
     */
    externalUrl: string
    /**
     * Configure the priority for establishing socket connections for webchat and studio users.
     * If the first method is not supported, it will fallback on the second.
     * If the first is supported but it fails with an error, it will not fallback.
     * @default ["websocket","polling"]
     */
    socketTransports: string[]
    /**
     * Adds default headers to the server's responses
     * @default {"X-Powered-By":"Botpress"}
     */
    headers: { [name: string]: string }
  }
  pro: {
    /**
     * Configure the branding of the admin panel and the studio. A valid license is required
     */
    branding: {
      studio: {
        /**
         * Change the name displayed in the title bar on the studio
         * @example "Botpress Studio"
         */
        title?: string
        /**
         * Replace the default favicon
         * @example "assets/ui-studio/public/img/favicon.png"
         */
        favicon?: string
        /**
         * Path to your custom stylesheet
         * @example "assets/my-stylesheet.css"
         */
        customCss: string
      }
    }
  }
  /**
   * When enabled, Botpress collects anonymous data about the bot's usage
   * @default true
   */
  sendUsageStats: boolean
  fileUpload: {
    /**
     * Maximum file size for media files upload (in mb)
     * @default 25mb
     */
    maxFileSize: string
    /**
     * The list of allowed extensions for media file uploads
     * @default ["image/jpeg","image/png","image/gif","audio/mpeg","video/mp4"]
     */
    allowedMimeTypes: string[]
  }
  /**
   * Displays the "Powered by Botpress" under the webchat.
   * Help us spread the word, enable this to show your support !
   * @default true
   */
  showPoweredBy: boolean
  /**
   * Action Servers to be used when dispatching actions.
   */

  actionServers: ActionServersConfig
  /**
   * Whether or not to display experimental features throughout the UI. These are subject
   * to change and can be unstable.
   * @default false
   */
  experimental: boolean

  nlu: {
    /**
     * Whether or not to train bots on mount
     * @optional
     */
    queueTrainingOnBotMount?: boolean
  }
}

interface ActionServersConfig {
  local: {
    /**
     * Port on which the local Action Server listens
     * @default 4000
     */
    port: number
    /**
     * Whether or not the enable the local Action Server
     * @default true
     */
    enabled: boolean
  }
  /**
   * The list of remote Action Servers
   * @default []
   */
  remotes: ActionServer[]
}
